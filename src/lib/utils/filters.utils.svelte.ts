export function unique<T>(arr: T[]) {
	return Array.from(new Set(arr));
}

export function sortNoneLast(list: string[]) {
	return list.slice().sort((a, b) => {
		if (a === 'None') return 1;
		if (b === 'None') return -1;
		return a.localeCompare(b);
	});
}

export function makeFilter(list: string[]) {
	return Object.fromEntries(list.map(v => [v, false])) as Record<string, boolean>;
}

export type FilterGroup = {
	name: string;
	list: string[];
	store: Record<string, boolean>;
	active: string[];
};