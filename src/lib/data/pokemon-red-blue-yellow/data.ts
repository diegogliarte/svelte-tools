import { createJsonLoader } from '$lib/data/json-loader';
import pokemonUrl from './pokemon.json?url';
import movesUrl from './moves.json?url';
import encountersUrl from './encounters.json?url';

export type LearnableMove = { name: string; method: string; level?: number };
export type Evolution = { fromId: number; toId: number; method: string };
export type Gen1Move = {
	id: number;
	name: string;
	type: string;
	category: 'Physical' | 'Special' | 'Status';
	power: number | null;
	accuracy: number | null;
	pp: number;
	target: string;
	description: string;
};
export type Gen1Encounter = {
	pokemonId: number;
	location: string;
	version: 'red' | 'blue' | 'yellow';
	method: string;
	minLevel: number;
	maxLevel: number;
	chance: number;
};

export type Gen1Pokemon = {
	id: number;
	name: string;
	sprite: string;
	types: string[];
	stats: Record<'hp' | 'attack' | 'defense' | 'special' | 'speed', number>;
	height: number;
	weight: number;
	baseExperience: number;
	captureRate: number;
	growthRate: string;
	genus: string;
	description: string;
	evolutions: Evolution[];
	learnset: Record<'red-blue' | 'yellow', LearnableMove[]>;
};

export const loadGen1Pokemon = createJsonLoader<Gen1Pokemon[]>(pokemonUrl);
export const loadGen1Moves = createJsonLoader<Gen1Move[]>(movesUrl);
export const loadGen1Encounters = createJsonLoader<Gen1Encounter[]>(encountersUrl);

export async function loadGen1Data() {
	const [pokemon, moves] = await Promise.all([loadGen1Pokemon(), loadGen1Moves()]);
	return { pokemon, moves };
}
