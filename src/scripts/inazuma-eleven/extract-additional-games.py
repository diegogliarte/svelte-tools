#!/usr/bin/env python3
"""Extract IE2 and IE3 web datasets from the user's European game dumps.

IE2's two ROMs share the same databases. IE3's European 3DS archive contains
the localized base-game and Ogre databases; the edition executable selects one.
"""

from __future__ import annotations

import importlib.util
import argparse
import json
import mmap
import shutil
import struct
import tempfile
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
IE1_EXTRACTOR = Path(__file__).with_name("inazuma-eleven-1") / "extract.py"
DATA_ROOT = ROOT / "src/lib/data/inazuma-eleven"
STATIC_ROOT = ROOT / "static/inazuma-eleven"
ELEMENTS = {0: "None", 1: "Air", 2: "Wood", 3: "Fire", 4: "Earth"}
POSITIONS = {0x20: "GK", 0x40: "DF", 0x60: "MF", 0x80: "FW"}
GENDERS = {1: "Male", 2: "Female"}
MOVE_TYPES = {1: "Normal Dribble", 2: "Normal Block", 3: "Normal Shot", 4: "Normal Catch", 5: "Dribble", 6: "Block", 7: "Shot", 8: "Save", 9: "Skill"}
# team.pkb stores canonical affiliations first, followed by generated battle and
# challenge-route teams. Those later rosters must not replace a player's team.
IE2_CANONICAL_TEAM_COUNT = 46
IE3_CANONICAL_TEAM_COUNT = 66


def write_json(folder: str, name: str, value: object) -> None:
    target = DATA_ROOT / folder
    target.mkdir(parents=True, exist_ok=True)
    (target / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def load_ie1_extractor():
    spec = importlib.util.spec_from_file_location("ie1_extract", IE1_EXTRACTOR)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def extract_ie2(rom: Path) -> None:
    source = load_ie1_extractor()
    with tempfile.TemporaryDirectory(prefix="inazuma-eleven-ie2-") as temp:
        data_root = source.extract_rom(rom, Path(temp))
        logic = data_root / "logic/en"
        # fieldinf.dat is language-neutral in IE2, unlike IE1 EUR.
        shutil.copy2(data_root / "logic/fieldinf.dat", logic / "fieldinf.dat")

        source.PLAYER_INDEX_LIMIT = 2399
        source.IE1_BEFRIENDED_VIA = set(range(0x10000))
        source.MOVE_ID_RANGE = range(101, 0x10000)
        source.EQUIPMENT_ID_RANGE = range(0, 0x10000)
        source.STORY_PLAYER_IDS = {*range(1, 16), 29}
        source.SPECIAL_RECRUITMENT = {}
        moves, moves_by_id = source.parse_moves(logic)
        players = source.parse_players(logic, moves_by_id)
        equipment = source.parse_equipment(logic)
        _, memberships = parse_team_data(
            logic.joinpath("team.pkb").read_bytes(), 0x140, IE2_CANONICAL_TEAM_COUNT
        )
        uniform_groups = parse_uniform_groups(logic.joinpath("team.pkb").read_bytes(), 0x140)
        unitbase = logic.joinpath("unitbase.dat").read_bytes()
        body_keys = source.read_archive(data_root, "fab").keys()
        for player in players:
            player["image"] = f"/inazuma-eleven/inazuma-eleven-2/portraits/{player['id']}.png"
            unit = unitbase[player["id"] * 0x60 : (player["id"] + 1) * 0x60]
            uniform_group = uniform_groups.get(unit[0x41], 1)
            uniform_variant = unit[0x47] if unit[0x47] < 10 else 0
            body_tail = player["bodyPortraitId"] % 100_000
            body_id = uniform_group * 1_000_000 + body_tail
            variant_body_id = body_id + uniform_variant * 100_000
            player["bodyPortraitId"] = body_id if body_id in body_keys else variant_body_id
            team = memberships.get(player["scoutId"])
            if team:
                player["team"] = team
                if player["recruitment"] != "Story":
                    player["recruitment"] = "Team recruitment"
            else:
                player["team"] = "Scout"

        source.PORTRAIT_OUT = STATIC_ROOT / "inazuma-eleven-2/portraits"
        portrait_count = source.extract_portraits(data_root, players)
    write_json("inazuma-eleven-2", "players.json", players)
    write_json("inazuma-eleven-2", "moves.json", moves)
    write_json("inazuma-eleven-2", "equipment.json", equipment)
    print(f"IE2: {len(players)} players, {len(moves)} moves, {len(equipment)} equipment, {portrait_count} portraits")


def archive_files(archive: Path, occurrence: int, names: list[str]) -> dict[str, bytes]:
    result = {}
    with archive.open("rb") as handle:
        data = mmap.mmap(handle.fileno(), 0, access=mmap.ACCESS_READ)
        assert data[:4] == b"B123"
        info_offset = struct.unpack_from("<I", data, 0x0C)[0]
        data_offset = struct.unpack_from("<I", data, 0x14)[0]
        count = struct.unpack_from("<I", data, 0x1C)[0]
        for name in names:
            target_hash = zlib.crc32(name.lower().encode()) & 0xFFFFFFFF
            matches = []
            for index in range(count):
                file_hash, _, offset, size = struct.unpack_from("<4I", data, info_offset + index * 16)
                if file_hash == target_hash:
                    matches.append((data_offset + offset, size))
            offset, size = matches[occurrence]
            raw = data[offset : offset + size]
            if raw[:4] == b"SSZL":
                raise ValueError(f"Compressed target is not supported: {name}")
            result[name] = raw
    return result


def decode_record(record: bytes, start: int, size: int) -> str:
    return record[start : start + size].split(b"\0", 1)[0].decode("cp932", "replace").strip()


def decrypt_ie3_stat(record: bytes) -> bytes:
    data = bytearray(record)
    for index, value in enumerate(data):
        value ^= 0xAD
        data[index] = ((value << 6) | (value >> 2)) & 0xFF
    for distance, step in ((2, 3), (4, 5), (6, 7), (1, 2)):
        for index in range(0, len(data) - distance, step):
            data[index], data[index + distance] = data[index + distance], data[index]
    return bytes(data)


def parse_ie3_moves(command: bytes, strings: bytes) -> tuple[list[dict], dict[int, dict]]:
    string_records = [decode_record(strings, offset, 0x20) for offset in range(0, len(strings), 0x20)]
    moves = []
    for move_id in range(len(command) // 0x24):
        record = command[move_id * 0x24 : (move_id + 1) * 0x24]
        move_type = record[0]
        name_id, description_id = struct.unpack_from("<HH", record, 0x18)
        name = string_records[name_id] if name_id < len(string_records) else ""
        if not name or move_type not in MOVE_TYPES or move_id < 101:
            continue
        evolution = record[0x14]
        speed, high = evolution & 3, evolution - (evolution & 3)
        growth_increase = ({1: 16, 2: 14, 3: 18} if high == 0 else {1: 10, 2: 8, 3: 12}).get(speed, 0)
        moves.append({
            "id": move_id, "name": name,
            "description": string_records[description_id] if description_id < len(string_records) else "",
            "type": MOVE_TYPES[move_type], "element": ELEMENTS.get(record[8], "None"),
            "power": record[6], "maxPower": record[6] + growth_increase,
            "tp": struct.unpack_from("<H", record, 4)[0], "foulRate": record[1],
            "growth": {0: "L/G", 100: "Shin", 200: "V"}.get(high, "None") if evolution else "None",
        })
    return moves, {move["id"]: move for move in moves}


def parse_team_data(data: bytes, record_size: int, team_count: int) -> tuple[dict[int, str], dict[int, str]]:
    teams = {}
    memberships = {}
    for index in range(min(team_count, len(data) // record_size)):
        record = data[index * record_size : (index + 1) * record_size]
        name = decode_record(record, 0, 0x20)
        if name and all(character.isprintable() for character in name):
            teams[index + 1] = name
            for slot in range(17):
                player_id = struct.unpack_from("<H", record, 0x40 + slot * 8)[0]
                if player_id:
                    memberships.setdefault(player_id, name)
    return teams, memberships


def parse_uniform_groups(data: bytes, record_size: int) -> dict[int, int]:
    result = {}
    for index in range(len(data) // record_size):
        record = data[index * record_size : (index + 1) * record_size]
        team_code, uniform_group = struct.unpack_from("<HH", record, 0x20)
        if team_code and uniform_group:
            result.setdefault(team_code, uniform_group)
    return result


def parse_ie3_players(
    base: bytes,
    stats: bytes,
    moves_by_id: dict[int, dict],
    memberships: dict[int, str],
    uniform_groups: dict[int, int],
    body_keys: set[int],
    search_records: dict[int, bytes],
) -> list[dict]:
    players = []
    count = min(len(base) // 0x68, len(stats) // 0x48)
    for player_id in range(1, count):
        player = base[player_id * 0x68 : (player_id + 1) * 0x68]
        position = player[0x5D] & 0xE0
        name = decode_record(player, 0, 0x1C)
        if position not in POSITIONS or not name:
            continue
        stat = decrypt_ie3_stat(stats[player_id * 0x48 : (player_id + 1) * 0x48])
        values = {"fp": struct.unpack_from("<H", stat, 2)[0], "tp": struct.unpack_from("<H", stat, 0x0A)[0]}
        for key, offset in zip(("kick", "body", "guard", "control", "speed", "guts", "stamina"), range(0x11, 0x2A, 4)):
            values[key] = stat[offset]
        values["total"] = sum(values[key] for key in ("kick", "body", "guard", "control", "speed", "guts", "stamina"))
        values["freedom"] = struct.unpack_from("<H", stat, 0x3C)[0] - values["total"]
        learned = []
        for slot in range(4):
            move_id = struct.unpack_from("<H", stat, 0x2C + slot * 4)[0]
            level = stat[0x2E + slot * 4]
            if move_id in moves_by_id:
                learned.append({"id": move_id, "name": moves_by_id[move_id]["name"], "level": level})
        portrait_id = struct.unpack_from("<H", player, 0x50)[0]
        uniform_group = uniform_groups.get(player[0x4D], 1)
        uniform_variant = player[0x53] if player[0x53] < 10 else 0
        kit_variant = 2 if POSITIONS[position] == "GK" else 1
        body_tail = kit_variant * 10_000 + player[0x5C] * 100 + player[0x52]
        body_portrait_id = uniform_group * 1_000_000 + body_tail
        variant_body_portrait_id = body_portrait_id + uniform_variant * 100_000
        if body_portrait_id not in body_keys and variant_body_portrait_id in body_keys:
            body_portrait_id = variant_body_portrait_id
        scout_id = struct.unpack_from("<H", player, 0x4E)[0]
        search_record = search_records.get(scout_id)
        unavailable = bool(search_record and search_record[-1] == 0)
        team = memberships.get(scout_id, "Unobtainable" if unavailable else "Scout")
        players.append({
            "id": player_id, "scoutId": scout_id, "name": name,
            "nickname": decode_record(player, 0x1C, 0x10), "description": "",
            "image": f"/inazuma-eleven/inazuma-eleven-3/portraits/{player_id}.png",
            "portraitId": portrait_id, "bodyPortraitId": body_portrait_id, "position": POSITIONS[position],
            "element": ELEMENTS.get(player[0x62], "None"), "gender": GENDERS.get(player[0x5A], "Unknown"),
            "age": player[0x5B], "team": team,
            "recruitment": "Unobtainable" if unavailable else "Scout" if team == "Scout" else "Team recruitment",
            "locations": [],
            "stats": values, "moves": learned,
        })
    return players


def parse_ie3_equipment(items: bytes, details: bytes) -> list[dict]:
    result = []
    for item_id in range(len(items) // 0x2C):
        item = decrypt_ie3_stat(items[item_id * 0x2C : (item_id + 1) * 0x2C])
        name = decode_record(item, 0, 0x20)
        lowered = name.lower()
        category = next((label for word, label in (("boot", "Boots"), ("glove", "Gloves"), ("bracelet", "Bracelet"), ("pendant", "Pendant")) if word in lowered), None)
        if not category:
            continue
        detail_id = struct.unpack_from("<H", item, 0x26)[0]
        detail = details[detail_id * 0x10 : (detail_id + 1) * 0x10]
        if len(detail) < 0x10:
            continue
        fp, tp, kick, body, guard, control, speed, guts, stamina = struct.unpack_from("<HH7B", detail)
        result.append({
            "id": item_id, "name": name, "category": category, "price": struct.unpack_from("<H", item, 0x20)[0],
            "fp": fp, "tp": tp, "kick": kick, "body": body, "guard": guard,
            "control": control, "speed": speed, "guts": guts, "stamina": stamina,
        })
    return result


def extract_ie3(archive: Path) -> None:
    names = ["unitbase.dat", "unitstat.dat", "command.dat", "command.str", "item.dat", "i_detail.dat", "team.pkb", "usearch.dat"]
    portraits = archive_files(archive, 1, ["fac.pkb", "fac.pkh", "fab.pkb", "fab.pkh"])
    fab_header = portraits["fab.pkh"]
    header_length, _, file_count = struct.unpack_from("<IHH", fab_header, 0x10)
    entry_size = (header_length - 0x30) // file_count
    body_keys = {
        struct.unpack_from("<I", fab_header, 0x30 + index * entry_size)[0]
        for index in range(file_count)
    }
    # The first English pair is the base game, the second is the Ogre expansion.
    for folder, occurrence in (("inazuma-eleven-3", 0), ("inazuma-eleven-3-ogre", 1)):
        files = archive_files(archive, occurrence, names)
        moves, moves_by_id = parse_ie3_moves(files["command.dat"], files["command.str"])
        _, memberships = parse_team_data(files["team.pkb"], 0x160, IE3_CANONICAL_TEAM_COUNT)
        uniform_groups = parse_uniform_groups(files["team.pkb"], 0x160)
        search_records = {
            struct.unpack_from("<H", files["usearch.dat"], offset + 0x24)[0]: files["usearch.dat"][offset : offset + 0x2C]
            for offset in range(0, len(files["usearch.dat"]), 0x2C)
        }
        players = parse_ie3_players(
            files["unitbase.dat"], files["unitstat.dat"], moves_by_id, memberships, uniform_groups, body_keys,
            search_records,
        )
        equipment = parse_ie3_equipment(files["item.dat"], files["i_detail.dat"])
        write_json(folder, "players.json", players)
        write_json(folder, "moves.json", moves)
        write_json(folder, "equipment.json", equipment)
        print(f"{folder}: {len(players)} players, {len(moves)} moves, {len(equipment)} equipment")

    source = load_ie1_extractor()
    source.PORTRAIT_OUT = STATIC_ROOT / "inazuma-eleven-3/portraits"
    with tempfile.TemporaryDirectory(prefix="inazuma-eleven-ie3-portraits-") as temp:
        root = Path(temp)
        (root / "face2d").mkdir()
        for name, data in portraits.items():
            (root / "face2d" / name).write_bytes(data)
        count = source.extract_portraits(root, players)
    print(f"IE3: {count} portraits")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("ie2_rom", type=Path, help="European Firestorm or Blizzard NDS ROM")
    parser.add_argument("ie3_archive", type=Path, help="archive_bz.fa extracted from a European IE3 CIA")
    args = parser.parse_args()
    extract_ie2(args.ie2_rom)
    extract_ie3(args.ie3_archive)
