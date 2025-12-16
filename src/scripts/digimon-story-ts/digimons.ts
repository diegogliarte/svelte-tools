import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const BASE = 'https://www.grindosaur.com';

const LIST_URL =
	`${BASE}/en/games/digimon-story-time-stranger/digimon`;

const OUT_DIR = path.join(
	'src',
	'lib',
	'data',
	'digimon-story-ts'
);

const DIGIMON_OUT = path.join(OUT_DIR, 'digimon.json');
const SKILLS_OUT = path.join(OUT_DIR, 'skills.json');

function clean(x = '') {
	return x.replace(/\s+/g, ' ').trim();
}

function slugify(x: string) {
	return clean(x)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

function num(x: string) {
	const n = parseInt(x.replace(/[^\d]/g, ''), 10);
	return isNaN(n) ? 0 : n;
}

async function fetchPage(url: string) {
	console.log(url);
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed ${url}`);
	return res.text();
}

async function scrapeList() {
	const html = await fetchPage(LIST_URL);
	const $ = load(html);

	const list: any[] = [];

	$('table tbody tr').each((_, tr) => {
		const tds = $(tr).find('td');
		if (tds.length < 7) return;

		const id = num($(tds[0]).text());
		const icon = $(tds[1]).find('img').attr('src') ?? '';
		const a = $(tds[2]).find('a');
		const name = clean(a.text());
		const href = a.attr('href');

		if (!id || !name || !href) return;

		list.push({
			id,
			slug: slugify(name),
			name,
			url: href.startsWith('http') ? href : BASE + href,
			generation: clean($(tds[3]).text()),
			attribute: clean($(tds[4]).text()),
			type: clean($(tds[5]).text()),
			base_personality: clean($(tds[6]).text()),
			icon
		});
	});

	return list;
}

function parseSkill(
	html: string,
	slug: string,
	category: 'special' | 'attachment'
) {
	const $ = load(html);

	const skill: any = {
		slug,
		category
	};

	// SKILL TYPE (FROM ICON TITLE)
	const icon = $('#info .row img').first();
	const iconTitle = clean(icon.attr('title') ?? '');

	skill.type = iconTitle ? slugify(iconTitle) : 'unknown';

	// QUICK FACTS
	$('#info table tbody tr').each((_, tr) => {
		const k = clean($(tr).find('th').text()).toLowerCase();
		const v = clean($(tr).find('td').text());

		if (!k) return;

		if (k === 'name') skill.name = v;
		else if (k === 'damage type') skill.damage_type = v.toLowerCase();
		else if (k === 'sp cost') skill.sp_cost = num(v);
		else if (k === 'accuracy') skill.accuracy = num(v);
		else if (k === 'crit rate') skill.crit_rate = num(v);
		else if (k === 'power') skill.power = num(v);
		else if (k === 'hit count') skill.hit_count = num(v);
	});

	// IN-GAME DESCRIPTION (FIXED)
	skill.description = clean(
		$('#info .columns__item')
			.eq(1)
			.find('p')
			.first()
			.text()
	);

	return skill;
}



async function parseDigimon(entry: any, skillsMap: Record<string, any>) {
	const html = await fetchPage(entry.url);
	const $ = load(html);

	const digimon: any = {
		...entry,
		ridable: false,
		base_stats: { lv1: {}, lv99: {} },
		possible_personalities: {},
		evolution_conditions: [],
		pre_evolutions: [],
		evolutions: [],
		skills: { special: [], attachment: [] }
	};

	$('table tbody tr').each((_, tr) => {
		const label = clean($(tr).find('th').text());

		if (label === 'Ridable') {
			digimon.ridable = clean($(tr).find('td').text()) === 'Yes';
		}
	});

	// BASE STATS
	const baseStatsBox = $('h2#base-stats').next('.box');

	baseStatsBox.find('table tbody tr').each((_, tr) => {
		const stat = clean($(tr).find('th').text());
		const tds = $(tr).find('td');

		if (!stat || tds.length < 4) return;

		digimon.base_stats.lv1[stat] = num($(tds[0]).text());
		digimon.base_stats.lv99[stat] = num($(tds[3]).text());
	});

	// POSSIBLE CONVERSION PERSONALITIES
	const personalitiesBox = $('h2#possible-conversion-personalities').next('.box');

	let currentCategories: string[] = [];

	personalitiesBox.find('table tr').each((_, tr) => {
		const ths = $(tr).find('th');

		// Category row (multiple columns)
		if (ths.length) {
			currentCategories = ths
				.map((_, th) => clean($(th).text()))
				.get()
				.filter(Boolean);

			for (const c of currentCategories) {
				if (!digimon.possible_personalities[c]) {
					digimon.possible_personalities[c] = [];
				}
			}

			return;
		}

		// Personality cells
		$(tr).find('td').each((i, td) => {
			const name = clean($(td).clone().find('b').remove().end().text());
			const pct = clean($(td).find('b').text());

			if (!name || !pct) return;

			const category = currentCategories[Math.floor(i / 2)]

			digimon.possible_personalities[category].push({
				name,
				chance: parseFloat(pct.replace('%', ''))
			})
		});
	});

	// EVOLUTION CONDITIONS
	const evoCondBox = $('h2#evolution-conditions').next('.box');

	evoCondBox.find('table').each((_, table) => {
		const headers = $(table)
			.find('thead th')
			.map((_, th) => clean($(th).text()))
			.get();

		$(table)
			.find('tbody tr')
			.each((_, tr) => {
				const cells = $(tr)
					.find('td')
					.map((_, td) => clean($(td).text()))
					.get();

				if (!cells.length) return;

				const requirements: Record<string, string> = {};

				headers.forEach((h, i) => {
					if (cells[i]) {
						requirements[h] = cells[i];
					}
				});

				let type: 'simple' | 'stats' | 'jogress' | 'item' = 'simple';

				if (headers.some(h => h.includes('Jogress'))) {
					type = 'jogress';
				} else if (headers.some(h => h.includes('Req. Item'))) {
					type = 'item';
				} else if (headers.length > 1) {
					type = 'stats';
				}

				digimon.evolution_conditions.push({
					type,
					requirements
				});
			});
	});


	// EVOLVES FROM
	const evolvesFromBox = $('h2#evolves-from').next('.box');

	evolvesFromBox.find('table tbody tr').each((_, tr) => {
		const link = $(tr).find('td:nth-child(2) a');
		if (!link.length) return;

		digimon.pre_evolutions.push(slugify(clean(link.text())));
	});

	// EVOLVES TO
	const evolvesToBox = $('h2#evolves-to').next('.box');

	evolvesToBox.find('table tbody tr').each((_, tr) => {
		const link = $(tr).find('td:nth-child(2) a');
		if (!link.length) return;

		digimon.evolutions.push(slugify(clean(link.text())));
	});

	// SKILLS (SPECIAL + ATTACHMENT)
	const skillsBox = $('h2#skills').next('.box');

	skillsBox.find('table').each((_, table) => {
		const caption = clean($(table).find('caption').text()).toLowerCase();

		const category =
			caption.includes('special') ? 'special' :
				caption.includes('attachment') ? 'attachment' :
					null;

		if (!category) return;

		$(table).find('tbody tr').each((_, tr) => {
			const link = $(tr).find('td:nth-child(2) a');
			if (!link.length) return;

			const href = link.attr('href');
			if (!href) return;

			const slug = slugify(href.split('/').pop()!);

			digimon.skills[category].push(slug);

			// mark skill for later fetch
			if (!skillsMap[slug]) {
				skillsMap[slug] = {
					slug,
					url: href.startsWith('http') ? href : BASE + href,
					category
				};
			}
		});
	});

	return digimon;
}

async function run() {
	const list = await scrapeList();
	const skills: Record<string, any> = {};
	const bySlug: Record<string, any> = {};

	for (const entry of list) {
		console.log(`Scraping ${entry.name}`);
		const d = await parseDigimon(entry, skills);
		bySlug[d.slug] = d;
	}

	// resolve evolutions to IDs
	for (const d of Object.values(bySlug)) {
		d.pre_evolutions = d.pre_evolutions
			.map((s: string) => bySlug[s]?.id)
			.filter(Boolean);

		d.evolutions = d.evolutions
			.map((s: string) => bySlug[s]?.id)
			.filter(Boolean);
	}

	for (const skill of Object.values(skills)) {
		console.log(`Scraping skill ${skill.slug}`);
		const html = await fetchPage(skill.url);
		Object.assign(skill, parseSkill(html, skill.slug, skill.category));
	}

	fs.mkdirSync(OUT_DIR, { recursive: true });
	fs.writeFileSync(DIGIMON_OUT, JSON.stringify(Object.values(bySlug), null, 2));
	fs.writeFileSync(SKILLS_OUT, JSON.stringify(Object.values(skills), null, 2));

	console.log(`Saved ${Object.keys(bySlug).length} digimon`);
	console.log(`Saved ${Object.keys(skills).length} skills`);
}

run().catch(console.error);
