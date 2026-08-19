import { mkdir, writeFile } from 'node:fs/promises';

const API = 'https://pokeapi.co/api/v2';
const OUT = new URL('../../lib/data/pokemon-main-series/', import.meta.url);
const STATIC = new URL('../../../static/pokemon/main-series/', import.meta.url);
const generations = [
	{ id: 1, max: 151, groups: { 'red-blue': ['red', 'blue'], yellow: ['yellow'] } },
	{ id: 2, max: 251, groups: { 'gold-silver': ['gold', 'silver'], crystal: ['crystal'] } },
	{
		id: 3,
		max: 386,
		groups: {
			'ruby-sapphire': ['ruby', 'sapphire'],
			emerald: ['emerald'],
			'firered-leafgreen': ['firered', 'leafgreen']
		}
	},
	{
		id: 4,
		max: 493,
		groups: {
			'diamond-pearl': ['diamond', 'pearl'],
			platinum: ['platinum'],
			'heartgold-soulsilver': ['heartgold', 'soulsilver']
		}
	},
	{ id: 5, max: 649, groups: { 'black-white': ['black', 'white'], 'black-2-white-2': ['black-2', 'white-2'] } }
] as const;

type Named = { name: string; url: string };
type Detail = { version_group: Named; move_learn_method: Named; level_learned_at: number };
type Pokemon = {
	id: number;
	name: string;
	height: number;
	weight: number;
	base_experience: number;
	moves: { move: Named; version_group_details: Detail[] }[];
	types: { type: Named }[];
	abilities: { ability: Named; is_hidden: boolean }[];
	stats: { base_stat: number; stat: Named }[];
	sprites: {
		front_default: string;
		versions: Record<string, Record<string, { front_default?: string; front_transparent?: string }>>;
	};
};
type Species = {
	id: number;
	names: { name: string; language: Named }[];
	capture_rate: number;
	growth_rate: Named;
	genera: { genus: string; language: Named }[];
	evolution_chain: { url: string };
	flavor_text_entries: { flavor_text: string; language: Named; version: Named }[];
};
type EvoDetail = {
	trigger?: Named;
	held_item?: Named | null;
	item?: Named | null;
	min_level?: number | null;
	min_happiness?: number | null;
	time_of_day?: string;
	known_move?: Named | null;
	location?: Named | null;
};
type EvoNode = { species: Named; evolution_details: EvoDetail[]; evolves_to: EvoNode[] };
type Encounter = {
	location_area: Named;
	version_details: {
		version: Named;
		encounter_details: { chance: number; min_level: number; max_level: number; method: Named }[];
	}[];
}[];
type Move = {
	id: number;
	name: string;
	names: { name: string; language: Named }[];
	type: Named;
	damage_class: Named;
	power: number | null;
	accuracy: number | null;
	pp: number;
	target: Named;
	effect_chance: number | null;
	effect_entries: { short_effect: string; language: Named }[];
	generation: Named;
};
type ModValue = {
	stats?: Record<string, number>;
	types?: string[];
	abilities?: string[];
	move?: Record<string, string | number | boolean>;
};

async function get<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${response.status} ${url}`);
	return response.json() as Promise<T>;
}
async function batches<T, R>(values: T[], fn: (value: T) => Promise<R>) {
	const result: R[] = [];
	for (let i = 0; i < values.length; i += 50) result.push(...(await Promise.all(values.slice(i, i + 50).map(fn))));
	return result;
}
function title(value: string) {
	return value
		.split('-')
		.map((part) => part[0].toUpperCase() + part.slice(1))
		.join(' ');
}
function id(url: string) {
	return Number(url.match(/\/(\d+)\/$/)?.[1]);
}
function roman(value: string) {
	const found = ['i', 'ii', 'iii', 'iv', 'v'].indexOf(value.replace('generation-', ''));
	return found < 0 ? 99 : found + 1;
}
function evolutionText(detail?: EvoDetail) {
	if (!detail) return 'Evolve';
	if (detail.trigger?.name === 'trade')
		return detail.held_item ? `Trade holding ${title(detail.held_item.name)}` : 'Trade';
	if (detail.item) return `Use ${title(detail.item.name)}`;
	if (detail.min_happiness) return `Friendship${detail.time_of_day ? ` (${title(detail.time_of_day)})` : ''}`;
	if (detail.known_move) return `Level up knowing ${title(detail.known_move.name)}`;
	if (detail.location) return `Level up at ${title(detail.location.name)}`;
	if (detail.min_level != null)
		return `Level ${detail.min_level}${detail.time_of_day ? ` (${title(detail.time_of_day)})` : ''}`;
	return title(detail.trigger?.name ?? 'Evolve');
}
function evolutionEdges(node: EvoNode, max: number, edges: { fromId: number; toId: number; method: string }[] = []) {
	for (const child of node.evolves_to) {
		const fromId = id(node.species.url),
			toId = id(child.species.url);
		if (fromId <= max && toId <= max) edges.push({ fromId, toId, method: evolutionText(child.evolution_details[0]) });
		evolutionEdges(child, max, edges);
	}
	return edges;
}
function parseMods(text: string) {
	const map = new Map<string, ModValue>();
	for (const match of text.matchAll(/\n\t(\w+): \{([\s\S]*?)\n\t\},/g)) {
		const block = match[2],
			value: ModValue = {};
		const stats = block.match(/baseStats: \{ hp: (\d+), atk: (\d+), def: (\d+), spa: (\d+), spd: (\d+), spe: (\d+) \}/);
		if (stats)
			value.stats = {
				hp: +stats[1],
				attack: +stats[2],
				defense: +stats[3],
				specialAttack: +stats[4],
				specialDefense: +stats[5],
				speed: +stats[6]
			};
		const types = block
			.match(/types: \[([^\]]+)\]/)?.[1]
			.match(/"([^"]+)"/g)
			?.map((entry) => entry.slice(1, -1));
		if (types) value.types = types;
		const abilities = block
			.match(/abilities: \{([^}]+)\}/)?.[1]
			.match(/"([^"]+)"/g)
			?.map((entry) => entry.slice(1, -1));
		if (abilities) value.abilities = abilities;
		const move: Record<string, string | number | boolean> = {};
		for (const [field, source] of [
			['power', 'basePower'],
			['accuracy', 'accuracy'],
			['pp', 'pp']
		] as const) {
			const found = block.match(new RegExp(`\\n\\t\\t${source}: (\\d+|true)`))?.[1];
			if (found) move[field] = found === 'true' ? true : +found;
		}
		for (const field of ['type', 'category'] as const) {
			const found = block.match(new RegExp(`\\n\\t\\t${field}: "([^"]+)"`))?.[1];
			if (found) move[field] = found;
		}
		const description = block.match(/\n\t\tshortDesc: "([^"]+)"/)?.[1];
		if (description) move.description = description;
		if (Object.keys(move).length) value.move = move;
		map.set(match[1], value);
	}
	return map;
}
function sprite(pokemon: Pokemon, generation: number) {
	const keys = [
		['generation-i', 'red-blue'],
		['generation-ii', 'crystal'],
		['generation-iii', 'emerald'],
		['generation-iv', 'platinum'],
		['generation-v', 'black-white']
	][generation - 1];
	const sprites = pokemon.sprites.versions[keys[0]]?.[keys[1]];
	return (generation <= 2 ? sprites?.front_transparent : sprites?.front_default) ?? pokemon.sprites.front_default;
}
async function localizeSprites(entries: { id: number; sprite: string }[], generation: number) {
	if (generation > 2) return;
	const directory = new URL(`generation-${generation}/`, STATIC);
	await mkdir(directory, { recursive: true });
	await batches(entries, async (entry) => {
		const destination = new URL(`${entry.id}.png`, directory);
		const response = await fetch(entry.sprite);
		if (!response.ok) throw new Error(`${response.status} ${entry.sprite}`);
		await writeFile(destination, Buffer.from(await response.arrayBuffer()));
		entry.sprite = `/pokemon/main-series/generation-${generation}/${entry.id}.png`;
	});
}

const ids = Array.from({ length: 649 }, (_, index) => index + 1);
const [pokemon, species, encounters, modTexts] = await Promise.all([
	batches(ids, (value) => get<Pokemon>(`${API}/pokemon/${value}`)),
	batches(ids, (value) => get<Species>(`${API}/pokemon-species/${value}`)),
	batches(ids, (value) => get<Encounter>(`${API}/pokemon/${value}/encounters`)),
	Promise.all(
		generations.map(async ({ id }) => ({
			id,
			pokedex: await fetch(
				`https://raw.githubusercontent.com/smogon/pokemon-showdown/refs/heads/master/data/mods/gen${id}/pokedex.ts`
			).then((r) => r.text()),
			moves: await fetch(
				`https://raw.githubusercontent.com/smogon/pokemon-showdown/refs/heads/master/data/mods/gen${id}/moves.ts`
			).then((r) => r.text())
		}))
	)
]);
const chains = await batches([...new Set(species.map((entry) => entry.evolution_chain.url))], (url) =>
	get<{ chain: EvoNode }>(url)
);
const moveNames = [...new Set(pokemon.flatMap((entry) => entry.moves.map((move) => move.move.name)))];
const moves = await batches(moveNames, (name) => get<Move>(`${API}/move/${name}`));
await mkdir(OUT, { recursive: true });

for (const config of generations) {
	const versionGroups = Object.entries(config.groups).map(([value, versions]) => ({
		value,
		label: title(value),
		versions
	}));
	const versions = versionGroups.flatMap((group) => group.versions);
	const pokemonMods = modTexts
		.filter((entry) => entry.id >= config.id)
		.sort((a, b) => b.id - a.id)
		.map((entry) => parseMods(entry.pokedex));
	const moveMods = modTexts
		.filter((entry) => entry.id >= config.id)
		.sort((a, b) => b.id - a.id)
		.map((entry) => parseMods(entry.moves));
	const combined = (layers: ReturnType<typeof parseMods>[], name: string) =>
		layers.reduce((value, layer) => ({ ...value, ...(layer.get(name) ?? {}) }), {} as ModValue);
	const edges = chains.flatMap((chain) => evolutionEdges(chain.chain, config.max));
	const pokemonData = pokemon.slice(0, config.max).map((entry, index) => {
		const info = species[index],
			mod = combined(pokemonMods, entry.name.replaceAll('-', ''));
		const currentStats = Object.fromEntries(
			entry.stats.map((stat) => [
				stat.stat.name.replace('special-attack', 'specialAttack').replace('special-defense', 'specialDefense'),
				stat.base_stat
			])
		);
		const stats = mod?.stats ?? currentStats;
		if (config.id === 1) {
			stats.special = stats.specialAttack;
			delete stats.specialAttack;
			delete stats.specialDefense;
		}
		const learnset = Object.fromEntries(
			versionGroups.map((group) => [
				group.value,
				entry.moves
					.flatMap((move) =>
						move.version_group_details
							.filter((detail) => detail.version_group.name === group.value)
							.map((detail) => ({
								name: title(move.move.name),
								method: title(detail.move_learn_method.name),
								level: detail.level_learned_at || undefined
							}))
					)
					.sort(
						(a, b) =>
							(a.method === 'Level Up' ? -1 : 1) - (b.method === 'Level Up' ? -1 : 1) ||
							(a.level ?? 999) - (b.level ?? 999) ||
							a.name.localeCompare(b.name)
					)
			])
		);
		return {
			id: entry.id,
			name: info.names.find((name) => name.language.name === 'en')?.name ?? title(entry.name),
			sprite: sprite(entry, config.id),
			types: mod?.types ?? entry.types.map((slot) => title(slot.type.name)),
			stats,
			abilities:
				config.id < 3
					? []
					: (mod?.abilities ??
						entry.abilities
							.filter((ability) => config.id >= 5 || !ability.is_hidden)
							.map((ability) => title(ability.ability.name))),
			captureRate: info.capture_rate,
			growthRate: title(info.growth_rate.name),
			genus: info.genera.find((genus) => genus.language.name === 'en')?.genus ?? '',
			description: (
				info.flavor_text_entries.find(
					(text) => text.language.name === 'en' && versions.includes(text.version.name as never)
				)?.flavor_text ?? ''
			).replace(/[\n\f]/g, ' '),
			evolutions: edges.filter((edge) => edge.fromId === entry.id || edge.toId === entry.id),
			learnset
		};
	});
	await localizeSprites(pokemonData, config.id);
	const moveData = moves
		.filter((move) => roman(move.generation.name) <= config.id)
		.map((entry) => {
			const override = combined(moveMods, entry.name.replaceAll('-', '')).move ?? {},
				type = String(override.type ?? title(entry.type.name));
			const special = ['Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Psychic', 'Dragon', 'Dark'].includes(type);
			return {
				id: entry.id,
				name: entry.names.find((name) => name.language.name === 'en')?.name ?? title(entry.name),
				type,
				category:
					config.id <= 3
						? entry.damage_class.name === 'status'
							? 'Status'
							: special
								? 'Special'
								: 'Physical'
						: String(override.category ?? title(entry.damage_class.name)),
				power: Number(override.power ?? entry.power) || null,
				accuracy: override.accuracy === true ? null : Number(override.accuracy ?? entry.accuracy) || null,
				pp: Number(override.pp ?? entry.pp),
				target: title(entry.target.name),
				description: String(
					override.description ??
						entry.effect_entries.find((effect) => effect.language.name === 'en')?.short_effect ??
						''
				).replace('$effect_chance', String(entry.effect_chance ?? ''))
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name));
	const encounterMap = new Map<
		string,
		{
			pokemonId: number;
			location: string;
			version: string;
			method: string;
			minLevel: number;
			maxLevel: number;
			chance: number;
		}
	>();
	for (const [index, areas] of encounters.slice(0, config.max).entries())
		for (const area of areas)
			for (const detail of area.version_details) {
				if (!versions.includes(detail.version.name as never)) continue;
				for (const encounter of detail.encounter_details) {
					const location = title(area.location_area.name.replace(/-area$/, '').replace(/^kanto-/, '')),
						method = title(encounter.method.name),
						key = `${index}-${location}-${detail.version.name}-${method}`,
						old = encounterMap.get(key);
					encounterMap.set(key, {
						pokemonId: index + 1,
						location,
						version: detail.version.name,
						method,
						minLevel: Math.min(old?.minLevel ?? encounter.min_level, encounter.min_level),
						maxLevel: Math.max(old?.maxLevel ?? encounter.max_level, encounter.max_level),
						chance: Math.min(100, (old?.chance ?? 0) + encounter.chance)
					});
				}
			}
	const encounterData = [...encounterMap.values()];
	await writeFile(
		new URL(`generation-${config.id}.json`, OUT),
		`${JSON.stringify({ generation: config.id, versionGroups, pokemon: pokemonData, moves: moveData, encounters: encounterData }, null, '\t')}\n`
	);
	console.log(
		`Generation ${config.id}: ${pokemonData.length} Pokémon, ${moveData.length} moves, ${encounterData.length} encounters`
	);
}
