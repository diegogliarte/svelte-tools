import { createJsonLoader } from '$lib/data/json-loader';

import baffleBoardsUrl from './baffle-boards.json?url';

export type BaffleBoard = {
	id: number;
	name: string;
	image: string;
	tribe: string;
	rank: string;
	boardLocation: string;
	clues: string[];
	effect: string;
	yokaiLocations: string[];
};

export const loadBaffleBoards = createJsonLoader<BaffleBoard[]>(baffleBoardsUrl);
