import { createJsonLoader } from '$lib/data/json-loader';
import gen1 from './generation-1.json?url';
import gen2 from './generation-2.json?url';
import gen3 from './generation-3.json?url';
import gen4 from './generation-4.json?url';
import gen5 from './generation-5.json?url';

export type LearnableMove = { name: string; method: string; level?: number };
export type Evolution = { fromId: number; toId: number; method: string };
export type MainPokemon = {
	id: number;
	name: string;
	sprite: string;
	types: string[];
	stats: Record<string, number>;
	abilities: string[];
	captureRate: number;
	growthRate: string;
	genus: string;
	description: string;
	evolutions: Evolution[];
	learnset: Record<string, LearnableMove[]>;
};
export type MainMove = {
	id: number;
	name: string;
	type: string;
	category: string;
	power: number | null;
	accuracy: number | null;
	pp: number;
	target: string;
	machines: Record<string, string>;
	description: string;
};
export type MainEncounter = {
	pokemonId: number;
	location: string;
	version: string;
	method: string;
	minLevel: number;
	maxLevel: number;
	chance: number;
};
export type VersionGroup = { value: string; label: string; versions: string[] };
export type GenerationData = {
	generation: number;
	versionGroups: VersionGroup[];
	pokemon: MainPokemon[];
	moves: MainMove[];
	encounters: MainEncounter[];
};

const loaders = [gen1, gen2, gen3, gen4, gen5].map((url) => createJsonLoader<GenerationData>(url));
export const loadGeneration = (generation: number) => loaders[generation - 1]();

export const generationOptions = [1, 2, 3, 4, 5].map((value) => ({
	value: String(value),
	label: `Generation ${['I', 'II', 'III', 'IV', 'V'][value - 1]}`
}));
export const gameOptions = [
	['red', 'Red', 1],
	['blue', 'Blue', 1],
	['yellow', 'Yellow', 1],
	['gold', 'Gold', 2],
	['silver', 'Silver', 2],
	['crystal', 'Crystal', 2],
	['ruby', 'Ruby', 3],
	['sapphire', 'Sapphire', 3],
	['emerald', 'Emerald', 3],
	['firered', 'FireRed', 3],
	['leafgreen', 'LeafGreen', 3],
	['diamond', 'Diamond', 4],
	['pearl', 'Pearl', 4],
	['platinum', 'Platinum', 4],
	['heartgold', 'HeartGold', 4],
	['soulsilver', 'SoulSilver', 4],
	['black', 'Black', 5],
	['white', 'White', 5],
	['black-2', 'Black 2', 5],
	['white-2', 'White 2', 5]
].map(([value, label, generation]) => ({ value: String(value), label: String(label), generation: Number(generation) }));
