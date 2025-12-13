import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
import { parse } from "csv-parse/sync";

const PER_PAGE = 1000;
const BASE_PARAM = `https://zukan.inazuma.jp/en/chara_param/?per_page=${PER_PAGE}&page=`;
const BASE_LIST = `https://zukan.inazuma.jp/en/chara_list/?per_page=${PER_PAGE}&page=`;

const BATCH_SIZE = 5;

const csvPath = path.join(import.meta.dirname, "characters.csv");
const csvRaw = fs.readFileSync(csvPath, "utf-8");

const csvRows: any[] = parse(csvRaw, {
	columns: true,
	skip_empty_lines: true
});

const csvMap: Record<number, any> = {};
for (const row of csvRows) {
	const id = Number(row.ID);
	if (!isNaN(id)) csvMap[id] = row;
}

function clean(x: string): string {
	return x.replace(/\s+/g, ' ').trim();
}

function stripRuby($el: any): string {
	const cloned = $el.clone();
	cloned.find('rt').remove();
	return clean(cloned.text());
}

function numeric(x: string): number {
	const n = parseInt(x.replace(/[^\d]/g, ''));
	return isNaN(n) ? 0 : n;
}

async function fetchPage(url: string): Promise<string> {
	const res = await fetch(url);
	if (!res.ok) throw new Error('Failed to fetch ' + url);
	return res.text();
}

// -----------------------------------------------------
// ID extraction
// -----------------------------------------------------
function extractParamID(imgSrc: string): string | null {
	if (!imgSrc) return null;

	const filename = imgSrc.split('/').pop();
	if (!filename) return null;

	if (filename.startsWith('icn_secret_character')) return null;

	return filename.replace(/\.[^.]+$/, '');
}

function extractListID(raw: string): string {
	return raw.split('/').pop()!.trim();
}

// -----------------------------------------------------
// PARAM SCRAPER
// -----------------------------------------------------
function parsePlayers(html: string) {
	const $ = load(html);
	const items: any[] = [];

	$('ul.charaListBox > li').each((_, el) => {
		const $p = $(el);

		const name = stripRuby($p.find('.nameBox span.name').first());
		if (!name) return;

		const imgSrc = $p.find('figure img').attr('src') ?? '';
		const id = extractParamID(imgSrc);
		if (!id) return;

		const nickname = stripRuby($p.find('.lBox .name span.nickname').first());
		const game = clean($p.find('dl.appearedWorks dd').text());
		const description = clean($p.find('p.description').text());

		const howToObtain: any[] = [];

		$p.find('dl.getTxt > dd').children('dl').each((_, dl) => {
			const $dl = $(dl);
			const title = clean($dl.find('> dt').text());

			const subsections: any[] = [];
			const entries: string[] = [];

			// Find subsection blocks (dd with p + ul)
			$dl.find('> dd').each((_, dd) => {
				const $dd = $(dd);
				const subsectionTitle = clean($dd.find('> p').text());
				const subsectionEntries: string[] = [];

				$dd.find('> ul > li').each((_, li) => {
					subsectionEntries.push(clean($(li).text()));
				});

				if (subsectionTitle) {
					subsections.push({
						title: subsectionTitle,
						entries: subsectionEntries
					});
				} else {
					// dd without a <p> means a flat entry list group
					entries.push(...subsectionEntries);
				}
			});

			howToObtain.push({ title, entries, subsections });
		});

		const stats: Record<string, any> = {};
		$p.find('ul.param > li dl').each((_, dl) => {
			const key = clean($(dl).find('dt').text());
			const dd = $(dl).find('dd');
			const txt = dd.find('p').text().trim();

			if (txt && !/\d/.test(txt)) {
				stats[key] = txt;
				return;
			}

			stats[key] = numeric(dd.find('td').text());
		});

		const basic: Record<string, string> = {};
		$p.find('ul.basic li').each((_, li) => {
			const label = clean($(li).find('dt').text());
			const value = clean($(li).find('dd').text());
			if (label) basic[label] = value;
		});

		const viewer = $p.find('a.verLink').attr('href');
		const link = viewer ? 'https://zukan.inazuma.jp' + viewer : '';

		const total = ['Kick', 'Control', 'Technique', 'Pressure', 'Physical', 'Agility', 'Intelligence']
			.map((k) => stats[k] ?? 0)
			.reduce((a, b) => a + b, 0);

		items.push({
			CharaID: id,
			Name: name,
			Nickname: nickname,
			Image: imgSrc,
			Game: game,
			Description: description,
			Position: stats.Position ?? '',
			Element: stats.Element ?? '',
			InazugleLink: link,
			Kick: stats.Kick ?? 0,
			Control: stats.Control ?? 0,
			Technique: stats.Technique ?? 0,
			Pressure: stats.Pressure ?? 0,
			Physical: stats.Physical ?? 0,
			Agility: stats.Agility ?? 0,
			Intelligence: stats.Intelligence ?? 0,
			Total: total,
			AgeGroup: basic['Age Group'] ?? '',
			Year: basic['School Year'] ?? '',
			Gender: basic['Gender'] ?? '',
			Role: basic['Character Role'] ?? '',
			HowToObtain: howToObtain
		});
	});

	return items;
}

// -----------------------------------------------------
// LIST SCRAPER
// -----------------------------------------------------
function parseTeams(html: string) {
	const $ = load(html);
	const map: Record<string, { realID: string; name: string; teams: string[] }> = {};

	$('table tbody tr').each((_, el) => {
		const $row = $(el);

		const checkbox = $row.find('input.my-team-checkbox');
		if (!checkbox.length) return;

		const rawCharaID = checkbox.attr('data-chara-id');
		if (!rawCharaID) return;

		const charaID = extractListID(rawCharaID);
		const rawName = checkbox.attr('data-chara-name') ?? 'UNKNOWN';

		const realID = clean($row.find('td').eq(1).text());

		const teamCell = $row.find('td').eq(11);

		let teams: string[] = [];

		if (teamCell.length) {
			const raw = teamCell.html() ?? '';
			teams = raw
				.split('<br>')
				.map((t) => clean(t.replace(/<[^>]+>/g, '')))
				.filter(Boolean);
		}

		map[charaID] = { realID, name: rawName, teams };
	});

	return map;
}

// -----------------------------------------------------
// FULL SCRAPE FUNCTION
// -----------------------------------------------------
async function scrapeAllParam() {
	let page = 1;
	let results: any[] = [];

	while (true) {
		const pages = Array.from({ length: BATCH_SIZE }, (_, i) => page + i);

		const batch = await Promise.all(pages.map((p) => fetchPage(BASE_PARAM + p)));

		const parsed = batch.map((html) => parsePlayers(html));

		const empty = parsed.findIndex((list) => list.length === 0);

		if (empty !== -1) {
			results.push(...parsed.slice(0, empty).flat());
			break;
		}

		results.push(...parsed.flat());
		page += BATCH_SIZE;
	}

	return results;
}

async function scrapeAllTeams() {
	let page = 1;
	let results: Record<string, any> = {};

	while (true) {
		const pages = Array.from({ length: BATCH_SIZE }, (_, i) => page + i);

		const batch = await Promise.all(pages.map((p) => fetchPage(BASE_LIST + p)));

		const parsed = batch.map((html) => parseTeams(html));

		const allEmpty = parsed.every((map) => Object.keys(map).length === 0);
		if (allEmpty) break;

		for (const m of parsed) Object.assign(results, m);

		page += BATCH_SIZE;
	}

	return results;
}

// -----------------------------------------------------
// MAIN
// -----------------------------------------------------
async function run() {
	console.log('Scraping param pages...');
	const paramPlayers = await scrapeAllParam();

	console.log('Scraping list pages...');
	const teamsMap = await scrapeAllTeams();

	const paramMap = Object.fromEntries(paramPlayers.map((p) => [p.CharaID, p]));

	// log skipped
	for (const id of Object.keys(paramMap)) {
		if (!teamsMap[id]) {
			console.log(`[SKIPPED] No teams entry → ${id} (${paramMap[id].Name})`);
		}
	}

	// merge
	const final = [];

	for (const id of Object.keys(paramMap)) {
		const p = paramMap[id];
		const t = teamsMap[id];

		if (!t) continue; // you requested skipping them

		const realID = Number(t.realID);
		const csv = csvMap[realID] ?? null;

		final.push({
			ID: realID,
			CharaID: id,

			...p,

			Teams: t.teams,

			RomajiName: csv?.["Name(Romaji)"] ?? "",
			Archetype: csv?.["Preferred Playstyle"] ?? "",
		});
	}

	final.sort((a, b) => a.ID - b.ID);

	console.log('Total merged players:', final.length);

	const out = path.join('src', 'lib', 'data', 'inazuma-eleven-vr', 'players.json');
	fs.mkdirSync(path.dirname(out), { recursive: true });
	fs.writeFileSync(out, JSON.stringify(final, null, 2));

	console.log('Saved →', out);
}

run().catch(console.error);
