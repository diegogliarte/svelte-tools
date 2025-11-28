import type { Action } from 'svelte/action';
import { clampStep } from '$lib/utils/math.utils';

interface Params {
	min?: number;
	max?: number;
	step?: number;
}

export const clampAction: Action<HTMLInputElement, Params> = (node, params) => {
	let { min, max, step } = params ?? {};

	function handle() {
		const num = Number(node.value);
		const next = clampStep(num, min, max, step);

		if (next !== num) {
			node.value = String(next);
			// ensure bind:value updates
			node.dispatchEvent(new Event('input'));
		}
	}

	node.addEventListener('input', handle);

	return {
		update(newParams) {
			min = newParams?.min;
			max = newParams?.max;
			step = newParams?.step ?? 1;
		},
		destroy() {
			node.removeEventListener('input', handle);
		}
	};
};
