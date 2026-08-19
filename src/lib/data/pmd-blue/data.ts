import { createJsonLoader } from '$lib/data/json-loader';
import type { Pokemon } from '$lib/utils/pmd-blue.utils';

import abilitiesUrl from './abilities.json?url';
import moveFlagsUrl from './move-flags.json?url';
import movesUrl from './moves.json?url';
import pokemonMovesUrl from './pokemon-moves.json?url';
import pokemonsUrl from './pokemons.json?url';

export type Ability = {
	id: number;
	name: string;
	description?: string;
};

export type Move = {
	id?: number;
	name: string;
	type: string;
	class: string;
	power: number;
	maxPP: number;
	acc1: number;
	acc2: number;
	crit: number;
	damageFlags: number[];
	otherFlags: number[];
	targets: string;
	description?: string;
	min_hits?: number | null;
	max_hits?: number | null;
	hit_count_mode?: string | null;
};

export type PokemonMoves = {
	pokemon_id: number;
	levelup_moves?: { level: number; move_id: number }[];
	aux_moves?: number[];
};

export type MoveFlags = {
	damageFlags: { id: number; description: string }[];
	otherFlags: { id: number; description: string }[];
};

export const loadAbilities = createJsonLoader<Ability[]>(abilitiesUrl);
export const loadMoveFlags = createJsonLoader<MoveFlags>(moveFlagsUrl);
export const loadMoves = createJsonLoader<Move[]>(movesUrl);
export const loadPokemonMoves = createJsonLoader<PokemonMoves[]>(pokemonMovesUrl);
export const loadPokemons = createJsonLoader<Pokemon[]>(pokemonsUrl);

export async function loadPmdCoreData() {
	const [pokemons, moves, pokemonMoves, abilities] = await Promise.all([
		loadPokemons(),
		loadMoves(),
		loadPokemonMoves(),
		loadAbilities()
	]);

	return { pokemons, moves, pokemonMoves, abilities };
}
