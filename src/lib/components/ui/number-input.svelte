<script lang="ts">
	import Icon from "@iconify/svelte";
	import { clampAction } from '$lib/actions/clamp';
	import { clampStep } from '$lib/utils/math.utils';


	interface Props {
		value?: number | null;
		label?: string;
		min?: number;
		max?: number;
		step?: number;
		placeholder?: string;
	}

	let {
		value = $bindable(),
		label = '',
		min = undefined,
		max = undefined,
		step = undefined,
		placeholder = '',
	}: Props = $props();

	const uid = $props.id();

	let holdInterval: Timeout = null;

	function startHold(direction: 1 | -1) {
		if (value === null && placeholder) {
			value = Number(placeholder)
			return
		}
		value = getNextValue(direction);

		holdInterval = setTimeout(() => {
			holdInterval = setInterval(() => {
				value = getNextValue(direction);
			}, 50); // speed during hold
		}, 200) // delay before rapid firing starts
	}

	function getNextValue(direction: 1 | -1): number{
		let next = (value ?? 0) + (step ?? 1) * direction;
		return clampStep(next, min, max, step);
	}

	function stopHold() {
		if (!holdInterval) return;

		clearTimeout(holdInterval);
		clearInterval(holdInterval);
		holdInterval = null;
	}

</script>

{#snippet arrow(dir: 1 | -1, symbol: string)}
	<button
		type="button"
		class="leading-none cursor-pointer hover:text-accent active:text-accent"
		onmousedown={() => startHold(dir)}
		onmouseup={stopHold}
		onmouseleave={stopHold}
		ontouchstart={() => startHold(dir)}
		ontouchend={stopHold}
	>
		<Icon icon={symbol} />
	</button>
{/snippet}

<div class="relative flex flex-col w-full gap-0.5">
	{#if label}
		<label for={uid} class="text-small">{label}</label>
	{/if}

	<div class="relative w-full">
		<input
			id={uid}
			type="number"
			class="
				w-full
				px-3 py-2
				border
				outline-none hover:border-accent focus:border-accent focus:bg-accent-dark
				transition-all duration-150
				pr-8
			"
			bind:value
			use:clampAction={{ min, max, step }}
			{min}
			{max}
			{step}
			{placeholder}
		/>

		<!-- arrows inside the input -->
		<div class="absolute inset-y-0 right-3 flex flex-col justify-center">
			{@render arrow(1, 'mdi:chevron-up')}
			{@render arrow(-1, 'mdi:chevron-down')}
		</div>
	</div>
</div>


<style>
    @layer utilities {
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
            @apply appearance-none;
        }
    }

    input[type='number'] {
        -moz-appearance: textfield;
    }
</style>