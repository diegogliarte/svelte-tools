import { mkdir, writeFile } from 'node:fs/promises';

const API = 'https://pokeapi.co/api/v2';
const outputDirectory = new URL('../../lib/data/pokemon-red-blue-yellow/', import.meta.url);

type NamedResource = { name: string; url: string };
type LocalizedName = { name: string; language: NamedResource };
type EvolutionDetail = {
	trigger?: NamedResource;
	held_item?: NamedResource | null;
	item?: NamedResource | null;
	min_level?: number | null;
};
type EvolutionNode = { species: NamedResource; evolution_details: EvolutionDetail[]; evolves_to: EvolutionNode[] };
type EvolutionEdge = { fromId: number; toId: number; method: string };
type VersionMoveDetail = { version_group: NamedResource; move_learn_method: NamedResource; level_learned_at: number };
type PokemonMoveEntry = { move: NamedResource; version_group_details: VersionMoveDetail[] };
type PokemonResponse = {
	id: number;
	name: string;
	moves: PokemonMoveEntry[];
	types: { type: NamedResource }[];
	sprites: { versions: { 'generation-i': { 'red-blue': { front_default: string } } } };
	height: number;
	weight: number;
	base_experience: number;
};
type SpeciesResponse = {
	evolution_chain: { url: string };
	names: LocalizedName[];
	capture_rate: number;
	growth_rate: NamedResource;
	genera: { genus: string; language: NamedResource }[];
	flavor_text_entries: { flavor_text: string; language: NamedResource; version: NamedResource }[];
};
type MoveResponse = {
	id: number;
	name: string;
	names: LocalizedName[];
	type: NamedResource;
	damage_class: NamedResource;
	power: number | null;
	accuracy: number | null;
	pp: number;
	target: NamedResource;
	effect_chance: number | null;
	effect_entries: { short_effect: string; language: NamedResource }[];
};
type LearnableMove = { name: string; method: string; level?: number };
type EncounterResponse = {
	location_area: NamedResource;
	version_details: {
		version: NamedResource;
		encounter_details: { chance: number; min_level: number; max_level: number; method: NamedResource }[];
	}[];
}[];
type Encounter = {
	pokemonId: number;
	location: string;
	version: 'red' | 'blue' | 'yellow';
	method: string;
	minLevel: number;
	maxLevel: number;
	chance: number;
};

function title(value: string) {
	return value
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function locationName(value: string) {
	return title(value.replace(/-area$/, '').replace(/^kanto-/, ''));
}

async function get<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${response.status} ${url}`);
	return response.json() as Promise<T>;
}

function idFromUrl(url: string) {
	return Number(url.match(/\/(\d+)\/$/)?.[1]);
}

function evolutionText(detail?: EvolutionDetail) {
	if (!detail) return 'Evolves';
	if (detail.trigger?.name === 'trade')
		return detail.held_item ? `Trade holding ${title(detail.held_item.name)}` : 'Trade';
	if (detail.item) return `Use ${title(detail.item.name)}`;
	if (detail.min_level != null) return `Level ${detail.min_level}`;
	return title(detail.trigger?.name ?? 'Evolves');
}

function flattenChain(node: EvolutionNode, edges: EvolutionEdge[] = []) {
	const fromId = idFromUrl(node.species.url);
	for (const child of node.evolves_to) {
		const toId = idFromUrl(child.species.url);
		if (fromId <= 151 && toId <= 151) {
			edges.push({ fromId, toId, method: evolutionText(child.evolution_details[0]) });
		}
		flattenChain(child, edges);
	}
	return edges;
}

const ids = Array.from({ length: 151 }, (_, index) => index + 1);
const [pokemon, species, showdownText, showdownMovesText] = await Promise.all([
	Promise.all(ids.map((id) => get<PokemonResponse>(`${API}/pokemon/${id}`))),
	Promise.all(ids.map((id) => get<SpeciesResponse>(`${API}/pokemon-species/${id}`))),
	fetch('https://raw.githubusercontent.com/smogon/pokemon-showdown/refs/heads/master/data/mods/gen1/pokedex.ts').then(
		(response) => response.text()
	),
	fetch('https://raw.githubusercontent.com/smogon/pokemon-showdown/refs/heads/master/data/mods/gen1/moves.ts').then(
		(response) => response.text()
	)
]);

const gen1Stats = new Map<string, Record<string, number>>();
for (const match of showdownText.matchAll(
	/\n\s*(\w+): \{[\s\S]*?baseStats: \{ hp: (\d+), atk: (\d+), def: (\d+), spa: (\d+), spd: \d+, spe: (\d+) \}/g
)) {
	gen1Stats.set(match[1], {
		hp: Number(match[2]),
		attack: Number(match[3]),
		defense: Number(match[4]),
		special: Number(match[5]),
		speed: Number(match[6])
	});
}

const chainUrls = [...new Set(species.map((entry) => entry.evolution_chain.url))] as string[];
const chains = await Promise.all(chainUrls.map((url) => get<{ chain: EvolutionNode }>(url)));
const evolutionEdges = chains.flatMap((chain) => flattenChain(chain.chain));

const moveNames = new Set<string>();
for (const entry of pokemon) {
	for (const move of entry.moves) {
		if (move.version_group_details.some((detail) => ['red-blue', 'yellow'].includes(detail.version_group.name)))
			moveNames.add(move.move.name);
	}
}

const moveOverrides = new Map<string, Record<string, string | number | boolean>>();
for (const match of showdownMovesText.matchAll(/\n\t(\w+): \{([\s\S]*?)\n\t\},/g)) {
	const block = match[2];
	const override: Record<string, string | number | boolean> = {};
	for (const [field, source] of [
		['power', 'basePower'],
		['accuracy', 'accuracy'],
		['pp', 'pp']
	] as const) {
		const value = block.match(new RegExp(`\\n\\t\\t${source}: (\\d+|true)`))?.[1];
		if (value) override[field] = value === 'true' ? true : Number(value);
	}
	for (const field of ['type', 'category'] as const) {
		const value = block.match(new RegExp(`\\n\\t\\t${field}: "([^"]+)"`))?.[1];
		if (value) override[field] = value;
	}
	const description = block.match(/\n\t\tshortDesc: "([^"]+)"/)?.[1];
	if (description) override.description = description;
	moveOverrides.set(match[1], override);
}

const moveResponses = await Promise.all([...moveNames].map((name) => get<MoveResponse>(`${API}/move/${name}`)));
const specialTypes = new Set(['Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Psychic', 'Dragon']);
const moves = moveResponses
	.map((move) => {
		const override = moveOverrides.get(move.name.replaceAll('-', '')) ?? {};
		const type = String(override.type ?? title(move.type.name));
		const status = move.damage_class.name === 'status' || override.category === 'Status';
		return {
			id: move.id,
			name: move.names.find((entry) => entry.language.name === 'en')?.name ?? title(move.name),
			type,
			category: status ? 'Status' : String(override.category ?? (specialTypes.has(type) ? 'Special' : 'Physical')),
			power: Number(override.power ?? move.power) || null,
			accuracy: override.accuracy === true ? null : Number(override.accuracy ?? move.accuracy) || null,
			pp: Number(override.pp ?? move.pp),
			target: title(move.target.name),
			description: String(
				override.description ?? move.effect_entries.find((entry) => entry.language.name === 'en')?.short_effect ?? ''
			)
				.replace('$effect_chance', String(move.effect_chance ?? ''))
				.replaceAll('Special Defense', 'Special')
				.replaceAll('Special Attack', 'Special')
		};
	})
	.sort((a, b) => a.name.localeCompare(b.name));

const result = pokemon.map((entry, index) => {
	const info = species[index];
	const stats = gen1Stats.get(entry.name.replaceAll('-', ''));
	if (!stats) throw new Error(`Missing Gen 1 stats for ${entry.name}`);
	const englishName = info.names.find((name) => name.language.name === 'en')?.name ?? title(entry.name);
	const learnset: Record<'red-blue' | 'yellow', LearnableMove[]> = { 'red-blue': [], yellow: [] };

	for (const move of entry.moves) {
		for (const detail of move.version_group_details) {
			const version = detail.version_group.name;
			if (version !== 'red-blue' && version !== 'yellow') continue;
			learnset[version].push({
				name: title(move.move.name),
				method: title(detail.move_learn_method.name),
				level: detail.level_learned_at || undefined
			});
		}
	}

	for (const moves of Object.values(learnset)) {
		moves.sort(
			(a, b) =>
				(a.method === 'Level Up' ? -1 : 1) - (b.method === 'Level Up' ? -1 : 1) ||
				(a.level ?? 999) - (b.level ?? 999) ||
				a.name.localeCompare(b.name)
		);
	}

	return {
		id: entry.id,
		name: englishName,
		sprite: entry.sprites.versions['generation-i']['red-blue'].front_default,
		types: entry.types.map((slot) => title(slot.type.name)).filter((type) => !['Fairy', 'Steel'].includes(type)),
		stats,
		height: entry.height / 10,
		weight: entry.weight / 10,
		baseExperience: entry.base_experience,
		captureRate: info.capture_rate,
		growthRate: title(info.growth_rate.name),
		genus: info.genera.find((genus) => genus.language.name === 'en')?.genus ?? '',
		description: (
			info.flavor_text_entries.find(
				(text) => text.language.name === 'en' && ['red', 'blue', 'yellow'].includes(text.version.name)
			)?.flavor_text ?? ''
		).replace(/[\n\f]/g, ' '),
		evolutions: evolutionEdges.filter((edge) => edge.fromId === entry.id || edge.toId === entry.id),
		learnset
	};
});

const encounterResponses = await Promise.all(
	ids.map((id) => get<EncounterResponse>(`${API}/pokemon/${id}/encounters`))
);
const encounters: Encounter[] = [];
for (const [index, areas] of encounterResponses.entries()) {
	for (const area of areas) {
		for (const versionDetails of area.version_details) {
			const version = versionDetails.version.name;
			if (version !== 'red' && version !== 'blue' && version !== 'yellow') continue;
			const grouped = new Map<string, Encounter>();
			for (const detail of versionDetails.encounter_details) {
				const method = title(detail.method.name);
				const current = grouped.get(method);
				grouped.set(method, {
					pokemonId: ids[index],
					location: locationName(area.location_area.name),
					version,
					method,
					minLevel: Math.min(current?.minLevel ?? detail.min_level, detail.min_level),
					maxLevel: Math.max(current?.maxLevel ?? detail.max_level, detail.max_level),
					chance: Math.min(100, (current?.chance ?? 0) + detail.chance)
				});
			}
			encounters.push(...grouped.values());
		}
	}
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
	writeFile(new URL('pokemon.json', outputDirectory), `${JSON.stringify(result, null, '\t')}\n`),
	writeFile(new URL('moves.json', outputDirectory), `${JSON.stringify(moves, null, '\t')}\n`),
	writeFile(new URL('encounters.json', outputDirectory), `${JSON.stringify(encounters, null, '\t')}\n`)
]);
console.log(
	`Wrote ${result.length} Pokémon, ${moves.length} moves, and ${encounters.length} encounters to ${outputDirectory.pathname}`
);
