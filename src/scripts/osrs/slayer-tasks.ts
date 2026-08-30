import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import type {
	SlayerAlternative,
	SlayerAssignment,
	SlayerMaster,
	SlayerRequirement,
	SlayerTasksData
} from '../../lib/data/osrs/slayer-tasks.types';

const API = 'https://oldschool.runescape.wiki/api.php';
const USER_AGENT = 'tools.sarganantagames.com slayer data importer (contact: feedback@sarganantagames.com)';
const OUT = path.join('src', 'lib', 'data', 'osrs', 'slayer-tasks.json');

const masterMetadata: Record<string, Omit<SlayerMaster, 'id'>> = {
	turael: { name: 'Turael / Aya / Spria', aliases: ['Turael', 'Aya', 'Spria'], blockCost: 40 },
	krystilia: { name: 'Krystilia', aliases: ['Krystilia'], blockCost: 100 },
	mazchna: {
		name: 'Mazchna / Achtryn',
		aliases: ['Mazchna', 'Achtryn'],
		blockCost: 50,
		minimumCombat: 20,
		requirements: ['Priest in Peril']
	},
	vannaka: { name: 'Vannaka', aliases: ['Vannaka'], blockCost: 60, minimumCombat: 40 },
	chaeldar: {
		name: 'Chaeldar',
		aliases: ['Chaeldar'],
		blockCost: 70,
		minimumCombat: 70,
		requirements: ['Lost City']
	},
	konar: { name: 'Konar quo Maten', aliases: ['Konar'], blockCost: 80, minimumCombat: 75 },
	nieve: { name: 'Nieve / Steve', aliases: ['Nieve', 'Steve'], blockCost: 90, minimumCombat: 85 },
	duradel: {
		name: 'Duradel / Kuradal',
		aliases: ['Duradel', 'Kuradal'],
		blockCost: 100,
		minimumCombat: 100,
		minimumSlayer: 50,
		requirements: ['Shilo Village']
	},
	mortimer: {
		name: 'Mortimer',
		aliases: ['Mortimer'],
		blockCost: 120,
		maxBlockSlots: 2,
		minimumCombat: 100,
		minimumSlayer: 70,
		requirements: ['Fallen From Grace (partial)'],
		choiceCount: 2
	}
};

const assignmentPages: Record<string, string> = {
	turael: 'Turael/Slayer assignments',
	krystilia: 'Krystilia',
	mazchna: 'Mazchna/Slayer assignments',
	vannaka: 'Vannaka',
	chaeldar: 'Chaeldar',
	konar: 'Konar quo Maten',
	nieve: 'Nieve/Slayer assignments',
	duradel: 'Duradel/Slayer assignments',
	mortimer: 'Mortimer'
};

type WikiRevision = { revid: number; timestamp?: string; slots: { main: { content: string } } };
type LuaEntry = {
	id: string;
	name: string;
	wikiPath?: string;
	weight: number;
	requirements: SlayerRequirement[];
	bosses?: LuaEntry[];
};

async function wiki(params: Record<string, string>) {
	const url = new URL(API);
	for (const [key, value] of Object.entries({ format: 'json', formatversion: '2', ...params })) {
		url.searchParams.set(key, value);
	}

	const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
	if (!response.ok) throw new Error(`Wiki request failed (${response.status}): ${url}`);
	return response.json() as Promise<Record<string, unknown>>;
}

function findClosing(source: string, start: number, open = '{', close = '}'): number {
	let depth = 0;
	let quote = '';
	let escaped = false;

	for (let index = start; index < source.length; index += 1) {
		const char = source[index];
		if (quote) {
			if (escaped) escaped = false;
			else if (char === '\\') escaped = true;
			else if (char === quote) quote = '';
			continue;
		}
		if (char === '"' || char === "'") {
			quote = char;
			continue;
		}
		if (char === open) depth += 1;
		if (char === close) depth -= 1;
		if (depth === 0) return index;
	}

	throw new Error(`Unclosed ${open} at ${start}`);
}

function assignedTable(source: string, variable: string): string {
	const match = new RegExp(`local\\s+${variable}\\s*=\\s*\\{`).exec(source);
	if (!match) throw new Error(`Missing Lua table: ${variable}`);
	const start = source.indexOf('{', match.index);
	return source.slice(start, findClosing(source, start) + 1);
}

function keyedEntries(source: string): { key: string; body: string }[] {
	const entries: { key: string; body: string }[] = [];
	let index = 1;

	while (index < source.length - 1) {
		const match = /\[SlayerConsts\.(TASK_[A-Z0-9_]+)\]\s*=\s*\{/.exec(source.slice(index));
		if (!match) break;
		const keyStart = index + match.index;
		const bodyStart = source.indexOf('{', keyStart + match[0].indexOf('{'));
		const bodyEnd = findClosing(source, bodyStart);
		entries.push({ key: match[1], body: source.slice(bodyStart, bodyEnd + 1) });
		index = bodyEnd + 1;
	}

	return entries;
}

function labelMaps(source: string, tableName: string): Map<string, string> {
	const table = assignedTable(source.replace(new RegExp(`${tableName}\\s*=`), `local ${tableName} =`), tableName);
	const labels = new Map<string, string>();
	for (const match of table.matchAll(/\["([^"]+)"\]\s*=\s*p\.([A-Z0-9_]+)/g)) labels.set(match[2], match[1]);
	return labels;
}

function wikiName(value: string): { name: string; wikiPath?: string } {
	const match = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\](.*)/.exec(value);
	if (!match) return { name: value };
	return {
		name: `${match[2] ?? match[1]}${match[3]}`.replace(/\s+/g, ' ').trim(),
		wikiPath: match[1].replace(/ /g, '_')
	};
}

function splitTopLevel(value: string): string[] {
	const parts: string[] = [];
	let start = 0;
	let depth = 0;
	for (let index = 0; index < value.length; index += 1) {
		if (value[index] === '{') depth += 1;
		if (value[index] === '}') depth -= 1;
		if (value[index] === ',' && depth === 0) {
			parts.push(value.slice(start, index));
			start = index + 1;
		}
	}
	parts.push(value.slice(start));
	return parts;
}

function parseRequirements(
	body: string,
	labels: { quests: Map<string, string>; unlocks: Map<string, string>; other: Map<string, string> }
): SlayerRequirement[] {
	const marker = /requirements\s*=\s*\{/.exec(body);
	if (!marker) return [];
	const start = body.indexOf('{', marker.index);
	const content = body.slice(start + 1, findClosing(body, start));
	const requirements: SlayerRequirement[] = [];

	for (const part of splitTopLevel(content)) {
		const match = /^\s*(\w+)\s*=\s*(.*?)\s*$/.exec(part);
		if (!match) continue;
		const [, key, raw] = match;
		if (/^\d+$/.test(raw)) {
			requirements.push({ type: 'skill', id: key.toLowerCase(), label: key, level: Number(raw) });
			continue;
		}

		const type = key === 'Quest' ? 'quest' : key === 'Unlock' ? 'unlock' : key === 'Other' ? 'other' : null;
		if (!type) continue;
		const refs = [...raw.matchAll(/SlayerConsts\.([A-Z0-9_]+)/g)].map((item) => item[1]);
		for (const ref of refs) {
			const map = type === 'quest' ? labels.quests : type === 'unlock' ? labels.unlocks : labels.other;
			requirements.push({
				type,
				id: ref.toLowerCase(),
				label:
					map.get(ref) ??
					ref
						.replace(/^(QUEST_|UNLOCK_)/, '')
						.replaceAll('_', ' ')
						.toLowerCase(),
				...(ref === 'UNLOCK_STOP_THE_WYVERN' ? { inverted: true } : {})
			});
		}
	}

	return requirements;
}

function parseLuaEntry(
	key: string,
	body: string,
	labels: { quests: Map<string, string>; unlocks: Map<string, string>; other: Map<string, string> }
): LuaEntry {
	const rawName = /name\s*=\s*"([^"]+)"/.exec(body)?.[1] ?? key;
	const parsedName = wikiName(rawName);
	const weight = Number(/weight\s*=\s*(\d+)/.exec(body)?.[1] ?? 0);
	const subtableMarker = /subtable\s*=\s*\{/.exec(body);
	let bosses: LuaEntry[] | undefined;
	if (subtableMarker) {
		const start = body.indexOf('{', subtableMarker.index);
		const table = body.slice(start, findClosing(body, start) + 1);
		bosses = keyedEntries(table).map((entry) => parseLuaEntry(entry.key, entry.body, labels));
	}

	return {
		id: key
			.toLowerCase()
			.replace(/^task_/, '')
			.replaceAll('_', '-'),
		...parsedName,
		weight,
		requirements: parseRequirements(body, labels),
		...(bosses ? { bosses } : {})
	};
}

function range(value: string): [number, number] | undefined {
	const numbers = value.match(/\d[\d,]*/g)?.map((item) => Number(item.replaceAll(',', '')));
	if (!numbers?.length) return undefined;
	return [numbers[0], numbers[1] ?? numbers[0]];
}

function normalized(value: string) {
	return value
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]/g, '')
		.replace(/s$/, '');
}

function pathFromHref(href?: string) {
	if (!href?.startsWith('/w/')) return undefined;
	return decodeURIComponent(href.slice(3)).replace(/ /g, '_');
}

function parseAssignmentTable(html: string, bossPaths: Set<string>) {
	const $ = cheerio.load(html);
	const result: {
		name: string;
		wikiPath?: string;
		amount?: [number, number];
		extendedAmount?: [number, number];
		alternatives: SlayerAlternative[];
	}[] = [];

	$('table').each((_, table) => {
		const headers = $(table)
			.find('tr')
			.first()
			.find('th')
			.map((__, cell) => $(cell).text().replace(/\s+/g, ' ').trim().toLowerCase())
			.get();
		const monsterIndex = headers.findIndex((header) => header === 'monster');
		const amountIndex = headers.findIndex((header) => header === 'amount');
		const extendedIndex = headers.findIndex((header) => header.startsWith('extended'));
		const alternativesIndexes = headers
			.map((header, index) => ({ header, index }))
			.filter(({ header }) => header.includes('alternative'))
			.map(({ index }) => index);
		if (monsterIndex < 0 || amountIndex < 0) return;

		$(table)
			.find('tr')
			.slice(1)
			.each((__, row) => {
				const cells = $(row).find('th,td');
				const monster = cells.eq(monsterIndex);
				const name = monster
					.text()
					.replace(/\[[^\]]+\]/g, '')
					.replace(/\s+/g, ' ')
					.trim();
				if (!name || /total task weight/i.test(name)) return;
				const wikiPath = pathFromHref(monster.find('a').first().attr('href'));
				const alternatives: SlayerAlternative[] = [];
				for (const alternativesIndex of alternativesIndexes) {
					cells
						.eq(alternativesIndex)
						.find('a')
						.each((___, link) => {
							const alternativeName = $(link).text().trim();
							const alternativePath = pathFromHref($(link).attr('href'));
							if (
								!alternativeName ||
								!alternativePath ||
								alternatives.some(
									(item) =>
										item.wikiPath === alternativePath || item.name.toLowerCase() === alternativeName.toLowerCase()
								)
							)
								return;
							alternatives.push({
								name: alternativeName,
								wikiPath: alternativePath,
								isBoss: bossPaths.has(normalized(alternativePath))
							});
						});
				}

				result.push({
					name,
					wikiPath,
					amount: range(cells.eq(amountIndex).text()),
					extendedAmount: extendedIndex >= 0 ? range(cells.eq(extendedIndex).text()) : undefined,
					alternatives
				});
			});
	});

	return result;
}

async function main() {
	const modules = (await wiki({
		action: 'query',
		prop: 'revisions',
		rvprop: 'ids|timestamp|content',
		rvslots: 'main',
		titles: 'Module:SlayerConsts|Module:SlayerConsts/MasterTables'
	})) as { query: { pages: { title: string; revisions: WikiRevision[] }[] } };
	const constantsPage = modules.query.pages.find((page) => page.title === 'Module:SlayerConsts');
	const tablesPage = modules.query.pages.find((page) => page.title.endsWith('/MasterTables'));
	if (!constantsPage || !tablesPage) throw new Error('Missing Slayer Lua modules');
	const constants = constantsPage.revisions[0].slots.main.content;
	const tables = tablesPage.revisions[0].slots.main.content;
	const labels = {
		quests: labelMaps(constants, 'QUEST_IDS'),
		unlocks: labelMaps(constants, 'UNLOCK_IDS'),
		other: labelMaps(constants, 'OTHER_IDS')
	};
	const tableNamesMatch = /tableNames\s*=\s*\{([^}]+)\}/.exec(tables);
	if (!tableNamesMatch) throw new Error('Could not find master table names');
	const masterIds = [...tableNamesMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1].toLowerCase());
	const masters = masterIds.map((id) => ({ id, ...(masterMetadata[id] ?? { name: id, aliases: [id], blockCost: 0 }) }));
	const luaByMaster = new Map<string, LuaEntry[]>();
	for (const master of masters) {
		luaByMaster.set(
			master.id,
			keyedEntries(assignedTable(tables, master.id)).map((entry) => parseLuaEntry(entry.key, entry.body, labels))
		);
	}
	const bossPaths = new Set(
		[...luaByMaster.values()]
			.flat()
			.flatMap((task) => task.bosses ?? [])
			.flatMap((boss) => [boss.wikiPath, boss.name])
			.filter((value): value is string => !!value)
			.map(normalized)
	);
	const bossCategory = (await wiki({
		action: 'query',
		list: 'categorymembers',
		cmtitle: 'Category:Bosses',
		cmnamespace: '0',
		cmlimit: 'max'
	})) as { query: { categorymembers: { title: string }[] } };
	for (const boss of bossCategory.query.categorymembers) bossPaths.add(normalized(boss.title));

	const enrichments = new Map<string, ReturnType<typeof parseAssignmentTable>>();
	const sources: SlayerTasksData['sources'] = modules.query.pages.map((page) => ({
		title: page.title,
		revisionId: page.revisions[0].revid,
		revisionTimestamp: page.revisions[0].timestamp
	}));
	for (const master of masters) {
		const pageName = assignmentPages[master.id] ?? master.name;
		const response = (await wiki({ action: 'parse', page: pageName, prop: 'text|revid' })) as {
			parse: { title: string; revid: number; text: string };
		};
		enrichments.set(master.id, parseAssignmentTable(response.parse.text, bossPaths));
		sources.push({ title: response.parse.title, revisionId: response.parse.revid });
	}

	const assignments: SlayerAssignment[] = [];
	const warnings: string[] = [];
	for (const master of masters) {
		for (const task of luaByMaster.get(master.id) ?? []) {
			const lookupName = task.id === 'minions-of-scabaras' ? 'Scabarites' : task.name;
			const enrichment = (enrichments.get(master.id) ?? []).find(
				(item) =>
					(!!task.wikiPath && !!item.wikiPath && normalized(item.wikiPath) === normalized(task.wikiPath)) ||
					normalized(item.name) === normalized(lookupName)
			);
			if (!enrichment && task.id !== 'boss')
				warnings.push(`${master.name}: no amount/alternative row matched ${task.name}`);
			assignments.push({
				taskId: task.id,
				masterId: master.id,
				name: task.name,
				wikiPath: task.wikiPath,
				weight: task.weight,
				requirements: task.requirements,
				amount: enrichment?.amount ?? (task.id === 'boss' ? [3, 35] : undefined),
				extendedAmount: enrichment?.extendedAmount,
				alternatives: enrichment?.alternatives ?? [],
				bosses: task.bosses
			});
		}
	}

	const allRequirements = assignments.flatMap((assignment) => [
		...assignment.requirements,
		...(assignment.bosses ?? []).flatMap((boss) => boss.requirements)
	]);
	const uniqueOptions = (type: 'quest' | 'unlock' | 'other') =>
		[
			...new Map(
				allRequirements.filter((requirement) => requirement.type === type).map((item) => [item.id, item])
			).values()
		]
			.map((item) => ({
				id: item.id,
				label: item.label,
				...('inverted' in item && item.inverted ? { inverted: true } : {})
			}))
			.sort((a, b) => a.label.localeCompare(b.label));
	const quests = uniqueOptions('quest');
	for (const requirement of masters.flatMap((master) => master.requirements ?? [])) {
		if (!quests.some((quest) => quest.label === requirement)) {
			quests.push({ id: `master-${requirement.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, label: requirement });
		}
	}
	quests.sort((a, b) => a.label.localeCompare(b.label));
	const data: SlayerTasksData = {
		generatedAt: new Date().toISOString(),
		sources,
		masters,
		assignments,
		quests,
		unlocks: uniqueOptions('unlock'),
		otherRequirements: uniqueOptions('other'),
		skills: [...new Set(allRequirements.filter((item) => item.type === 'skill').map((item) => item.label))].sort()
	};

	fs.mkdirSync(path.dirname(OUT), { recursive: true });
	fs.writeFileSync(OUT, `${JSON.stringify(data, null, '\t')}\n`);
	console.log(`Saved ${assignments.length} assignments across ${masters.length} masters to ${OUT}`);
	if (warnings.length) console.warn(`${warnings.length} enrichment warnings:\n${warnings.join('\n')}`);
}

await main();
