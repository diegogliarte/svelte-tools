<script lang="ts">
	import SelectInput from '$lib/components/ui/select-input.svelte';
	import TypeBadge from '$lib/components/pokemon/TypeBadge.svelte';
	import chart from '$lib/data/pokemon-red-blue-yellow/type-chart.json';

	let generation = $state('1');
	let hoveredRow = $state<string | null>(null);
	let hoveredColumn = $state<string | null>(null);
	const activeChart = $derived(chart.charts.find((entry) => entry.value === generation) ?? chart.charts[0]);

	function multiplier(attacking: string, defending: string) {
		return (
			(activeChart.effectiveness as unknown as Record<string, Record<string, number>>)[attacking]?.[defending] ?? 1
		);
	}
	function text(value: number) {
		return value === 1 ? '1' : value === 0.5 ? '½' : value === 2 ? '2' : '0';
	}
</script>

<div class="mb-4 w-48">
	<SelectInput
		label="Generation"
		bind:value={generation}
		options={chart.charts.map(({ value, label }) => ({ value, label }))}
	/>
</div>
<p class="mb-3 text-xs opacity-60">Attacking type ↓ · Defending type →</p>

<div
	role="region"
	aria-label={`${activeChart.label} type chart`}
	class="overflow-auto"
	onmouseleave={() => {
		hoveredRow = null;
		hoveredColumn = null;
	}}
>
	<table class="mx-auto w-max table-fixed border-collapse text-center text-sm">
		<thead
			><tr>
				<th class="sticky left-0 z-20 h-12 w-12 bg-bg p-0"></th>
				{#each activeChart.types as type (type)}
					<th
						class="h-12 w-12 p-0 transition {hoveredColumn === type ? 'bg-accent-dark' : ''}"
						onmouseenter={() => (hoveredColumn = type)}
						><TypeBadge {type} short highlight={hoveredColumn === type} /></th
					>
				{/each}
			</tr></thead
		>
		<tbody>
			{#each activeChart.types as attack (attack)}
				<tr
					class="transition {hoveredRow === attack ? 'bg-accent-dark/60' : ''}"
					onmouseenter={() => (hoveredRow = attack)}
				>
					<th class="sticky left-0 z-10 h-12 w-12 bg-bg p-0"
						><TypeBadge type={attack} short highlight={hoveredRow === attack} /></th
					>
					{#each activeChart.types as defense (defense)}
						{@const value = multiplier(attack, defense)}
						<td
							class="h-12 w-12 border border-accent/20 p-0 font-bold text-white transition [text-shadow:0_1px_2px_#000] {hoveredColumn ===
							defense
								? 'bg-accent-dark'
								: ''} {value === 2 ? 'bg-green-800' : value === 0.5 ? 'bg-red-900' : value === 0 ? 'bg-black/60' : ''}"
							onmouseenter={() => (hoveredColumn = defense)}>{text(value)}</td
						>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
