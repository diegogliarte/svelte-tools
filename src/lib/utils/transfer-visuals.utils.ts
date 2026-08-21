import { loadDigimon } from '$lib/data/digimon-story-ts/data';
import { loadPokemons } from '$lib/data/pmd-blue/data';
import { getDigimonIcon, type Digimon } from '$lib/utils/digimon-story-ts.utils';
import { getPokemonIcon, type Pokemon } from '$lib/utils/pmd-blue.utils';
import recruitmentData from '$lib/data/digimon-world-next-order/recruitment.json';
import type { StorageItemDiff, ValueChange } from '$lib/utils/local-storage-transfer.utils';

export type EntityVisual = {
	src: string;
	alt: string;
};

type RecruitmentEntry = {
	id: string;
	name: string;
};

type TransferVisualResolver = {
	matches: (key: string) => boolean;
	resolve: (change: ValueChange, side: 'before' | 'after') => EntityVisual | null;
};

type EntityIndex = {
	pokemonByName: Map<string, EntityVisual>;
	digimonById: Map<number, EntityVisual>;
	digimonByName: Map<string, EntityVisual>;
};

const recruitmentById = new Map((recruitmentData as RecruitmentEntry[]).map((entry) => [entry.id, entry]));

function toPokemonVisual(pokemon: Pokemon): EntityVisual {
	return {
		src: getPokemonIcon(pokemon),
		alt: pokemon.name
	};
}

function toDigimonVisual(digimon: Digimon): EntityVisual {
	return {
		src: getDigimonIcon(digimon),
		alt: digimon.name
	};
}

function createPokemonRecruitmentResolver(index: EntityIndex): TransferVisualResolver {
	return {
		matches: (key) =>
			['/pokemon/mystery-dungeon/', '/pokemon-mystery-dungeon/'].some((path) =>
				key.includes(`${path}blue-rescue-team/recruitment-checklist`)
			),
		resolve: (change) => {
			const [group, field, name] = change.pathSegments;
			if (group !== 'collection' || !['owned', 'readyToEvolve'].includes(field) || !name) return null;

			return index.pokemonByName.get(name) ?? null;
		}
	};
}

function createWorldNextOrderRecruitmentResolver(index: EntityIndex): TransferVisualResolver {
	return {
		matches: (key) => key.includes('/digimon/world-next-order/recruitment-checklist'),
		resolve: (change) => {
			const [group, id] = change.pathSegments;
			if (group !== 'recruited' || !id) return null;

			const entry = recruitmentById.get(id);
			return entry ? (index.digimonByName.get(entry.name.toLowerCase()) ?? null) : null;
		}
	};
}

function createTimeStrangerTeamBuilderResolver(index: EntityIndex): TransferVisualResolver {
	return {
		matches: (key) => key.includes('/digimon/story-time-stranger/team-builder'),
		resolve: (change, side) => {
			const value = side === 'before' ? change.beforeValue : change.afterValue;
			return typeof value === 'number' ? (index.digimonById.get(value) ?? null) : null;
		}
	};
}

export async function createTransferVisualResolver() {
	const [pokemons, digimon] = await Promise.all([loadPokemons(), loadDigimon()]);

	const index: EntityIndex = {
		pokemonByName: new Map(pokemons.map((pokemon) => [pokemon.name, toPokemonVisual(pokemon)])),
		digimonById: new Map(digimon.map((item) => [item.id, toDigimonVisual(item)])),
		digimonByName: new Map(digimon.map((item) => [item.name.toLowerCase(), toDigimonVisual(item)]))
	};

	const resolvers = [
		createPokemonRecruitmentResolver(index),
		createWorldNextOrderRecruitmentResolver(index),
		createTimeStrangerTeamBuilderResolver(index)
	];

	return function entityVisualFor(item: StorageItemDiff, change: ValueChange, side: 'before' | 'after') {
		for (const resolver of resolvers) {
			if (!resolver.matches(item.key)) continue;

			const visual = resolver.resolve(change, side);
			if (visual) return visual;
		}

		return null;
	};
}
