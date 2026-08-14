import type { BaffleBoard } from '$lib/data/yokai-watch-2/data';

const tribeClasses: Record<string, string> = {
	Brave: 'bg-red-900',
	Charming: 'bg-pink-900',
	Eerie: 'bg-purple-900',
	Heartful: 'bg-green-900',
	Mysterious: 'bg-yellow-900',
	Shady: 'bg-blue-900',
	Slippery: 'bg-cyan-900',
	Tough: 'bg-orange-900'
};

const rankClasses: Record<string, string> = {
	E: 'bg-neutral-700',
	D: 'bg-green-900',
	C: 'bg-blue-900',
	B: 'bg-yellow-900',
	A: 'bg-red-900',
	S: 'bg-purple-900'
};

export function getYokaiTribeClass(tribe: string) {
	return tribeClasses[tribe] ?? 'bg-neutral-800';
}

export function getYokaiRankClass(rank: string) {
	return rankClasses[rank] ?? 'bg-neutral-700';
}

export function getYokaiSearchText(yokai: BaffleBoard) {
	return `${yokai.name} ${yokai.tribe} ${yokai.rank}`;
}
