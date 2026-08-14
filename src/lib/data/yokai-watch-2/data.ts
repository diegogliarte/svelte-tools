import { createJsonLoader } from '$lib/data/json-loader';

import baffleBoardsUrl from './baffle-boards.json?url';
import yokaisUrl from './yokais.json?url';

export type YokaiMove = {
	name?: string;
	description?: string;
	power?: string;
};

export type YokaiStats = Partial<Record<'hp' | 'str' | 'spr' | 'def' | 'spd', string>>;

export type Yokai = {
	id: number;
	number: string;
	name: string;
	image: string;
	description: string;
	locations: string[];
	skill: YokaiMove;
	attack: YokaiMove;
	technique: YokaiMove;
	soultimate: YokaiMove;
	inspirit: YokaiMove;
	stats: YokaiStats;
	tribe: string;
	element: string;
	weakness: string;
	rank: string;
	favouriteFood: string;
};

export type BaffleBoard = {
	id: number;
	yokaiId: number;
	boardLocation: string;
	clues: string[];
	effect: string;
};

export const loadYokais = createJsonLoader<Yokai[]>(yokaisUrl);
export const loadBaffleBoards = createJsonLoader<BaffleBoard[]>(baffleBoardsUrl);

export async function loadYokaiWatch2Data() {
	const [yokais, baffleBoards] = await Promise.all([loadYokais(), loadBaffleBoards()]);
	return { yokais, baffleBoards };
}
