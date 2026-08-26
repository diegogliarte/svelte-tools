export type Position = 'GK' | 'DF' | 'MF' | 'FW' | '?';

export type PlayerStats = {
	fp: number;
	tp: number;
	kick: number;
	body: number;
	guard: number;
	control: number;
	speed: number;
	guts: number;
	stamina: number;
	total: number;
	freedom: number;
};

export type LearnedMove = {
	id: number;
	name: string;
	level: number;
};

export type Player = {
	id: number;
	scoutId: number;
	name: string;
	nickname: string;
	description: string;
	image: string;
	portraitId: number;
	bodyPortraitId: number;
	position: Position;
	element: string;
	gender: string;
	age: number;
	team: string;
	recruitment: string;
	locations: string[];
	stats: PlayerStats;
	moves: LearnedMove[];
};

export type Move = {
	id: number;
	name: string;
	description: string;
	type: string;
	element: string;
	power: number;
	maxPower: number;
	tp: number;
	foulRate: number;
	growth: string;
};

export type Equipment = {
	id: number;
	name: string;
	category: string;
	price: number;
	fp: number;
	tp: number;
	kick: number;
	body: number;
	guard: number;
	control: number;
	speed: number;
	guts: number;
	stamina: number;
};

const ELEMENT_CLASSES: Record<string, string> = {
	Air: 'bg-sky-800/75',
	Wood: 'bg-green-800/75',
	Fire: 'bg-red-800/75',
	Earth: 'bg-yellow-800/75'
};

export function getElementClass(element: string): string {
	return ELEMENT_CLASSES[element] ?? 'bg-neutral-700';
}
