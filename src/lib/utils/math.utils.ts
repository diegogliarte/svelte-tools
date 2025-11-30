export function clamp(value: number, min?: number, max?: number): number {
	if (min !== undefined) value = Math.max(value, min);
	if (max !== undefined) value = Math.min(value, max);
	return value;
}

export function clampStep(value: number, min?: number, max?: number, step = 1) {
	value = clamp(value, min, max);
	const precision = countDecimals(step);
	// Previously implemented snapping to step, e.g. step = 100 would snap 240 to 200, 590 to 600...

	// const base = min ?? 0;
	// const snapped = base + Math.round((value - base) / step) * step;

	return Number(value.toFixed(precision));
}

function countDecimals(n: number) {
	if (Math.floor(n) === n) return 0;
	return n.toString().split('.')[1].length;
}
