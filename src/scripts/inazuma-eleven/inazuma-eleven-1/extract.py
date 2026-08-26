#!/usr/bin/env python3
"""Extract the English Inazuma Eleven 1 database and portraits from a European NDS ROM."""

from __future__ import annotations

import argparse
import json
import shutil
import struct
import subprocess
import tempfile
from collections import defaultdict
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[4]
DATA_OUT = ROOT / "src/lib/data/inazuma-eleven/inazuma-eleven-1"
PORTRAIT_OUT = ROOT / "static/inazuma-eleven/inazuma-eleven-1/portraits"
NDSTOOL = shutil.which("ndstool") or "/opt/devkitpro/tools/bin/ndstool"
# IE1's units occupy the first unit bank. Later translated records are IE2 leftovers.
PLAYER_INDEX_LIMIT = 1031
# usearch.BefriendedVia is a bit mask. 0x02 is the base IE1 roster; 0x06 and
# 0x0A are two download-gated groups whose recruit scripts are 10020001-52 and
# 10030001-08 respectively. The ROM does not say which server batches shipped.
IE1_BEFRIENDED_VIA = {2, 6, 10}
STORY_PLAYER_IDS = {*range(1, 13), 29, 1025}

ELEMENTS = {0: "None", 1: "Air", 2: "Wood", 3: "Fire", 4: "Earth"}
POSITIONS = {0x20: "GK", 0x40: "DF", 0x60: "MF", 0x80: "FW"}
GENDERS = {1: "Male", 2: "Female"}
MOVE_TYPES = {
    1: "Normal Dribble",
    2: "Normal Block",
    3: "Normal Shot",
    4: "Normal Catch",
    5: "Dribble",
    6: "Block",
    7: "Shot",
    8: "Save",
    9: "Skill",
}
EQUIPMENT_TYPES = {22: "Boots", 23: "Gloves", 24: "Bracelet", 25: "Pendant"}
MOVE_ID_RANGE = range(101, 233)
EQUIPMENT_ID_RANGE = range(151, 272)
SPECIAL_RECRUITMENT = {
    248: "Baseball club room (special recruitment)",  # Rory Boomer
    388: "Gym stands (special recruitment)",  # Duncan Jump
    404: "Swimming pool changing rooms (special recruitment)",  # Nathin Gaunt
    495: "Tennis club room (special recruitment)",  # Darrel Jeeling
    540: "Dojo (special recruitment)",  # Saul Dowd
    568: "Comic/newspaper/chess club building, upstairs (special recruitment)",  # Cash Barganier
    657: "Athletics club room (special recruitment)",  # Miles Ryan
    1024: "Raimon Hospital, with Bobby in the main group (special recruitment)",  # Erik Eagle
    1026: "Raimon Jr. High: stairs, club rooms, then tennis courts (special recruitment)",  # Paul Peabody
    1027: "Chess club; search for Chester or Horse (special recruitment)",  # Chester Horse Jr
    1029: "Shopping area electronics store; requires his glasses and boots (special recruitment)",  # Sagaminator
    1031: "Raimon main-building lockers; search for Shadow (special recruitment)",  # Shadow Cimmerian
}


def text(data: bytes) -> str:
    value = data.split(b"\0", 1)[0].decode("cp932", "replace")
    return (
        value.replace("\n", " ")
        .replace("”", '"')
        .replace("（", "(")
        .replace("）", ")")
        .replace("／", "/")
        .replace("ｺ", "é")
        .strip()
    )


def contains_japanese(value: str) -> bool:
    return any("\u3040" <= char <= "\u30ff" or "\u4e00" <= char <= "\u9fff" for char in value)


def records(data: bytes, size: int):
    for offset in range(0, len(data), size):
        yield data[offset : offset + size]


def extract_rom(rom: Path, destination: Path) -> Path:
    args = [
        NDSTOOL,
        "-x",
        str(rom),
        "-9",
        str(destination / "arm9.bin"),
        "-7",
        str(destination / "arm7.bin"),
        "-y9",
        str(destination / "y9.bin"),
        "-y7",
        str(destination / "y7.bin"),
        "-d",
        str(destination / "data"),
        "-y",
        str(destination / "overlay"),
        "-t",
        str(destination / "banner.bin"),
        "-h",
        str(destination / "header.bin"),
    ]
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL)
    return destination / "data/data_iz"


def parse_moves(logic: Path) -> tuple[list[dict], dict[int, dict]]:
    move_data = logic.joinpath("command.dat").read_bytes()
    string_data = logic.joinpath("command.STR").read_bytes()
    strings = [text(record) for record in records(string_data, 0x20)]
    result = []

    for move_id, record in enumerate(records(move_data, 0x1C)):
        move_type = record[0]
        name_id, description_id = struct.unpack_from("<HH", record, 0x14)
        name = strings[name_id] if name_id < len(strings) else ""
        if not name or contains_japanese(name) or move_type not in MOVE_TYPES or move_id not in MOVE_ID_RANGE:
            continue

        evolution = record[0x10]
        speed = evolution & 0x03
        high = evolution - speed
        growth_names = {0: "L/G", 100: "Shin", 200: "V"}
        growth_increase = ({1: 16, 2: 14, 3: 18} if high == 0 else {1: 10, 2: 8, 3: 12}).get(speed, 0)
        description = text(string_data[description_id * 0x20 :])

        result.append(
            {
                "id": move_id,
                "name": name,
                "description": description,
                "type": MOVE_TYPES[move_type],
                "element": ELEMENTS.get(record[8], "None"),
                "power": record[6],
                "maxPower": record[6] + growth_increase,
                "tp": struct.unpack_from("<H", record, 4)[0],
                "foulRate": record[1],
                "growth": growth_names.get(high, "None") if evolution else "None",
            }
        )

    return result, {move["id"]: move for move in result}


def parse_scout_locations(logic: Path) -> dict[int, set[str]]:
    field_records = list(records(logic.joinpath("fieldinf.dat").read_bytes(), 0x180))
    field_names = {index: text(record[0x90:0xB0]) for index, record in enumerate(field_records)}
    by_scout_id: dict[int, set[str]] = defaultdict(set)

    for record in records(logic.joinpath("usearch.dat").read_bytes(), 0x38):
        scout_id = struct.unpack_from("<H", record, 0x2A)[0]
        location = field_names.get(record[0x2E], "")
        if location and not contains_japanese(location):
            by_scout_id[scout_id].add(location)

    return by_scout_id


def parse_search_records(logic: Path) -> dict[int, bytes]:
    return {
        struct.unpack_from("<H", record, 0x2A)[0]: record
        for record in records(logic.joinpath("usearch.dat").read_bytes(), 0x38)
    }


def parse_contact_map_players(logic: Path) -> set[int]:
    """Return the player IDs used by player nodes in the connection/contact map."""
    data = logic.joinpath("JinmyakuData.dat").read_bytes()
    node_count = data[0]
    offset = 2
    player_ids: set[int] = set()

    for _ in range(node_count):
        node_type = data[offset + 1]
        offset += 2
        if node_type < 0x10:
            player_ids.add(struct.unpack_from("<H", data, offset + 8)[0])
            offset += 12
        elif node_type > 0x10:
            text_length = struct.unpack_from("<H", data, offset + 16)[0]
            offset += 18 + text_length
        else:
            raise ValueError("Invalid contact-map node type 0x10")

    return player_ids


def parse_teams(logic: Path) -> dict[int, str]:
    names = []
    for record in records(logic.joinpath("team.pkb").read_bytes(), 0x140):
        name = text(record[:0x20])
        if not name:
            break
        names.append(name)
    return {index + 1: name for index, name in enumerate(names)}


def parse_players(logic: Path, moves_by_id: dict[int, dict]) -> list[dict]:
    base = logic.joinpath("unitbase.dat").read_bytes()
    stats = logic.joinpath("unitstat.dat").read_bytes()
    descriptions = logic.joinpath("unitbase.STR").read_bytes()
    locations_by_scout_id = parse_scout_locations(logic)
    contact_map_player_ids = parse_contact_map_players(logic)
    search_records = parse_search_records(logic)
    teams = parse_teams(logic)
    result = []

    for player_id in range(1, PLAYER_INDEX_LIMIT + 1):
        player = base[player_id * 0x60 : (player_id + 1) * 0x60]
        stat = stats[player_id * 0x50 : (player_id + 1) * 0x50]
        position = player[0x55] & 0xE0
        if position not in POSITIONS:
            continue
        scout_id = struct.unpack_from("<H", player, 0x42)[0]
        search_record = search_records.get(scout_id, b"")
        if len(search_record) < 0x33:
            continue
        befriended_via = struct.unpack_from("<H", search_record, 0x31)[0]
        if befriended_via not in IE1_BEFRIENDED_VIA:
            continue
        name = text(player[:0x20])
        nickname = text(player[0x20:0x40])
        description_id = struct.unpack_from("<H", player, 0x5E)[0]
        description = text(descriptions[description_id * 0x80 : (description_id + 1) * 0x80])
        if contains_japanese(nickname):
            nickname = ""
        if contains_japanese(description):
            description = ""
        learned_moves = []
        for slot in range(4):
            move_id = struct.unpack_from("<H", stat, 0x2C + slot * 4)[0]
            level = struct.unpack_from("<H", stat, 0x2E + slot * 4)[0]
            move = moves_by_id.get(move_id)
            if move:
                learned_moves.append({"id": move_id, "name": move["name"], "level": level})

        stat_values = {
            "fp": struct.unpack_from("<H", stat, 2)[0],
            "tp": struct.unpack_from("<H", stat, 0x0A)[0],
            "kick": stat[0x11],
            "body": stat[0x15],
            "guard": stat[0x19],
            "control": stat[0x1D],
            "speed": stat[0x21],
            "guts": stat[0x25],
            "stamina": stat[0x29],
        }
        stat_values["total"] = sum(
            stat_values[key] for key in ("kick", "body", "guard", "control", "speed", "guts", "stamina")
        )
        stat_values["freedom"] = struct.unpack_from("<H", stat, 0x3C)[0] - stat_values["total"]

        # 0xFF is the ROM's "no team-recruit target" sentinel. Story members
        # use the same sentinel, so handle their event-granted IDs separately.
        if player_id <= 227 and player_id not in STORY_PLAYER_IDS and search_record[0x2C] == 0xFF:
            recruitment = "Unobtainable"
            location_set = set()
        elif player_id in SPECIAL_RECRUITMENT:
            recruitment = "Special"
            location_set = {SPECIAL_RECRUITMENT[player_id]}
        elif player_id in STORY_PLAYER_IDS:
            recruitment = "Story"
            location_set = set()
        elif player_id <= 227:
            recruitment = "Team recruitment"
            location_set = set()
        elif befriended_via in {6, 10}:
            recruitment = "Connect Mode / download-gated"
            group = 1 if befriended_via == 6 else 2
            location_set = {f"Connect Mode unlock group {group}; server release status is not stored in the ROM"}
        elif scout_id in contact_map_player_ids:
            recruitment = "Contact Map"
            location_set = {"Contact Map (Raimon Soccer Club)"}
        else:
            recruitment = "Scout"
            location_set = locations_by_scout_id.get(scout_id, set())
        portrait_id = struct.unpack_from("<H", player, 0x44)[0]
        standard_kit = struct.unpack_from("<H", player, 0x50)[0]
        kit_variant = 2 if POSITIONS[position] == "GK" else 1
        body_portrait_id = (standard_kit % 100) * 1_000_000 + kit_variant * 10_000 + player[0x54] * 100 + player[0x46]
        result.append(
            {
                "id": player_id,
                "scoutId": scout_id,
                "name": name,
                "nickname": nickname,
                "description": description,
                "image": f"/inazuma-eleven/inazuma-eleven-1/portraits/{player_id}.png",
                "portraitId": portrait_id,
                "bodyPortraitId": body_portrait_id,
                "position": POSITIONS[position],
                "element": ELEMENTS.get(player[0x5A], "None"),
                "gender": GENDERS.get(player[0x52], "Unknown"),
                "age": player[0x53],
                "team": (
                    "Raimon" if player_id == 1025 else "Scout" if player_id > 227 else teams.get(player[0x41], "None")
                ),
                "recruitment": recruitment,
                "locations": sorted(location_set),
                "stats": stat_values,
                "moves": learned_moves,
            }
        )

    return result


def parse_equipment(logic: Path) -> list[dict]:
    items = logic.joinpath("item.dat").read_bytes()
    details = logic.joinpath("i_detail.dat").read_bytes()
    result = []

    for item_id, item in enumerate(records(items, 0x30)):
        category = EQUIPMENT_TYPES.get(item[0x21])
        name = text(item[:0x20])
        if not category or not name or item_id not in EQUIPMENT_ID_RANGE:
            continue
        detail_id = struct.unpack_from("<H", item, 0x22)[0] & 0x3FFF
        detail = details[detail_id * 0x10 : (detail_id + 1) * 0x10]
        fp, tp, kick, body, guard, control, speed, guts, stamina = struct.unpack_from("<HH7B", detail)
        result.append(
            {
                "id": item_id,
                "name": name,
                "category": category,
                "price": struct.unpack_from("<H", item, 0x24)[0],
                "fp": fp,
                "tp": tp,
                "kick": kick,
                "body": body,
                "guard": guard,
                "control": control,
                "speed": speed,
                "guts": guts,
                "stamina": stamina,
            }
        )
    return result


def lz10_decompress(data: bytes) -> bytes:
    expected = int.from_bytes(data[1:4], "little")
    output = bytearray()
    position = 4
    while len(output) < expected:
        flags = data[position]
        position += 1
        for bit in range(8):
            if len(output) >= expected:
                break
            if flags & (0x80 >> bit):
                value = (data[position] << 8) | data[position + 1]
                position += 2
                length = (value >> 12) + 3
                distance = (value & 0xFFF) + 1
                for _ in range(length):
                    output.append(output[-distance])
            else:
                output.append(data[position])
                position += 1
    return bytes(output[:expected])


def decode_portrait(raw: bytes) -> Image.Image:
    palette_data = raw[0x40:0x60]
    tile_data = raw[0xE0:0x8E0]
    palette = []
    for value in struct.unpack("<16H", palette_data):
        palette.append(((value & 31) * 8, ((value >> 5) & 31) * 8, ((value >> 10) & 31) * 8, 255))
    palette[0] = (*palette[0][:3], 0)
    image = Image.new("RGBA", (64, 64))
    pixels = image.load()
    offset = 0
    for tile_y in range(8):
        for tile_x in range(8):
            for y in range(8):
                for x_pair in range(4):
                    value = tile_data[offset]
                    offset += 1
                    pixels[tile_x * 8 + x_pair * 2, tile_y * 8 + y] = palette[value & 0xF]
                    pixels[tile_x * 8 + x_pair * 2 + 1, tile_y * 8 + y] = palette[value >> 4]
    return image


def read_archive(data_root: Path, name: str) -> dict[int, bytes]:
    archive = data_root.joinpath(f"face2d/{name}.pkb").read_bytes()
    header = data_root.joinpath(f"face2d/{name}.pkh").read_bytes()
    header_length, _, file_count = struct.unpack_from("<IHH", header, 0x10)
    entry_size = (header_length - 0x30) // file_count
    entries: dict[int, bytes] = {}
    for index in range(file_count):
        key, offset, size = struct.unpack_from("<III", header, 0x30 + index * entry_size)
        entries[key] = archive[offset : offset + size]
    return entries


def extract_portraits(data_root: Path, players: list[dict]) -> int:
    heads = read_archive(data_root, "fac")
    bodies = read_archive(data_root, "fab")
    PORTRAIT_OUT.mkdir(parents=True, exist_ok=True)
    for old_portrait in PORTRAIT_OUT.glob("*.png"):
        old_portrait.unlink()
    count = 0
    for player in players:
        compressed_head = heads.get(player["portraitId"] * 100)
        compressed_body = bodies.get(player["bodyPortraitId"])
        if not compressed_body:
            body_id = player["bodyPortraitId"]
            uniform_group = body_id // 1_000_000
            kit_variant = body_id // 10_000 % 10
            size = body_id // 100 % 100
            same_uniform = sorted(key for key in bodies if key // 1_000_000 == uniform_group)
            fallback_key = next(
                (key for key in same_uniform if key // 10_000 % 10 == kit_variant and key // 100 % 100 == size),
                next((key for key in same_uniform if key // 10_000 % 10 == kit_variant), same_uniform[0] if same_uniform else 1_010_000),
            )
            compressed_body = bodies.get(fallback_key)
        if not compressed_head:
            continue
        head = decode_portrait(lz10_decompress(compressed_head))
        if compressed_body:
            body = decode_portrait(lz10_decompress(compressed_body))
            body.alpha_composite(head)
            portrait = body
        else:
            portrait = head
        portrait.save(PORTRAIT_OUT / f"{player['id']}.png", optimize=True)
        count += 1
    return count


def write_json(name: str, value: object) -> None:
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    DATA_OUT.joinpath(name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("rom", type=Path)
    args = parser.parse_args()
    if not args.rom.is_file():
        parser.error(f"ROM not found: {args.rom}")

    with tempfile.TemporaryDirectory(prefix="inazuma-eleven-ie1-") as temp:
        data_root = extract_rom(args.rom, Path(temp))
        logic = data_root / "logic/en"
        moves, moves_by_id = parse_moves(logic)
        players = parse_players(logic, moves_by_id)
        equipment = parse_equipment(logic)
        portrait_count = extract_portraits(data_root, players)

    write_json("players.json", players)
    write_json("moves.json", moves)
    write_json("equipment.json", equipment)
    print(f"Extracted {len(players)} players, {len(moves)} moves, {len(equipment)} equipment items, and {portrait_count} portraits.")


if __name__ == "__main__":
    main()
