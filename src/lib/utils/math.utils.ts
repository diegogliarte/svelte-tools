export function clamp(value: number, min?: number, max?: number): number {
	if (min !== undefined) value = Math.max(value, min);
	if (max !== undefined) value = Math.min(value, max);
	return value;
}

export function clampStep(value: number, min?: number, max?: number, step = 1) {
	value = clamp(value, min, max);
	const precision = countDecimals(step);
	const base = min ?? 0;
	const snapped = base + Math.round((value - base) / step) * step;
	return Number(snapped.toFixed(precision));
}

function countDecimals(n: number) {
	if (Math.floor(n) === n) return 0;
	return n.toString().split('.')[1].length;
}
