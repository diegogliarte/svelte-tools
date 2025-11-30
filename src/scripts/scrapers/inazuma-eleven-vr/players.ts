import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";

const PER_PAGE = 1000;
const BASE = `https://zukan.inazuma.jp/en/chara_param/?per_page=${PER_PAGE}&page=`;
const BATCH_SIZE = 5; // Fetch 5 pages at a time

// ---------- Helpers ----------
function clean(x: string): string {
	return x.replace(/\s+/g, " ").trim();
}

function numeric(x: string): number {
	const n = parseInt(x.replace(/[^\d]/g, ""));
	return isNaN(n) ? 0 : n;
}

function stripRuby($el: any): string {
	const cloned = $el.clone();
	cloned.find("rt").remove();
	return clean(cloned.text());
}

async function fetchPage(page: number): Promise<string> {
	const res = await fetch(BASE + page);
	if (!res.ok) throw new Error("Failed to fetch page " + page);
	return await res.text();
}

// ---------- Parse ----------
function parsePlayers(html: string) {
	const $ = load(html);
	const players: any[] = [];

	$("ul.charaListBox > li").each((_i, el) => {
		const $p = $(el);

		const name = stripRuby($p.find(".nameBox span.name").first());
		if (!name) return;

		const nickname = stripRuby($p.find(".lBox .name span.nickname").first());
		const image = $p.find("figure img").attr("src") ?? "";
		const game = clean($p.find("dl.appearedWorks dd").text());
		const description = clean($p.find("p.description").text());

		const stats: Record<string, any> = {};

		$p.find("ul.param > li dl").each((_i, dl) => {
			const key = clean($(dl).find("dt").text());
			const dd = $(dl).find("dd");

			const pText = dd.find("p").text().trim();
			if (pText && !/\d/.test(pText)) {
				stats[key] = pText;
				return;
			}

			stats[key] = numeric(dd.find("td").text());
		});

		const basic: Record<string, string> = {};
		$p.find("ul.basic li").each((_i, li) => {
			const label = clean($(li).find("dt").text());
			const value = clean($(li).find("dd").text());
			if (label) basic[label] = value;
		});

		const viewer = $p.find("a.verLink").attr("href");
		const link = viewer ? "https://zukan.inazuma.jp" + viewer : "";

		const total = ["Kick", "Control", "Technique", "Pressure", "Physical", "Agility", "Intelligence"]
			.map(k => stats[k] ?? 0)
			.reduce((a, b) => a + b, 0);

		players.push({
			Name: name,
			Nickname: nickname,
			Image: image,
			Game: game,
			Description: description,
			Position: stats.Position ?? "",
			Element: stats.Element ?? "",
			InazugleLink: link,
			Kick: stats.Kick ?? 0,
			Control: stats.Control ?? 0,
			Technique: stats.Technique ?? 0,
			Pressure: stats.Pressure ?? 0,
			Physical: stats.Physical ?? 0,
			Agility: stats.Agility ?? 0,
			Intelligence: stats.Intelligence ?? 0,
			Total: total,
			AgeGroup: basic["Age Group"] ?? "",
			Year: basic["School Year"] ?? "",
			Gender: basic["Gender"] ?? "",
			Role: basic["Character Role"] ?? "",
		});
	});

	return players;
}

// ---------- MAIN (BATCH PARALLEL) ----------
async function run() {
	let page = 1;
	let allPlayers: any[] = [];

	while (true) {
		// Determine the pages in this batch
		const pages = Array.from({ length: BATCH_SIZE }, (_, i) => page + i);

		console.log("Fetching pages:", pages.join(", "));

		// Fetch batch in parallel
		const htmlList = await Promise.all(pages.map(p => fetchPage(p)));

		// Parse all pages in one pass
		const parsedList = htmlList.map(html => parsePlayers(html));

		// Check for termination condition
		const emptyPageIndex = parsedList.findIndex(list => list.length === 0);

		// Add all valid results
		parsedList.forEach(list => allPlayers.push(...list));

		if (emptyPageIndex !== -1) {
			console.log(`Page ${pages[emptyPageIndex]} returned 0 players. Stopping.`);
			break;
		}

		// Move to next batch
		page += BATCH_SIZE;
	}

	console.log("Total players scraped:", allPlayers.length);

	const out = path.join("src", "lib", "data", "inazuma-eleven-vr", "players.json");
	fs.mkdirSync(path.dirname(out), { recursive: true });
	fs.writeFileSync(out, JSON.stringify(allPlayers, null, 2));

	console.log("Saved →", out);
}

run().catch(console.error);
