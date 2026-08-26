<script lang="ts">
	import CheckboxChipGroup from '$lib/components/ui/checkbox-chip-group.svelte';
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import HissatsuCell from '$lib/components/inazuma-eleven/inazuma-eleven-1/HissatsuCell.svelte';
	import { addMissingFilterOptions, sortNoneLast, unique } from '$lib/utils/filters.utils.svelte.js';
	import type { Move, Player } from '$lib/utils/inazuma-eleven-1.utils';

	let { moves, players }: { moves: Move[]; players: Player[] } = $props();

	const types = $derived(unique(moves.map((move) => move.type)));
	const elements = $derived(sortNoneLast(unique(moves.map((move) => move.element))));
	let typeFilter = $state<Record<string, boolean>>({});
	let elementFilter = $state<Record<string, boolean>>({});

	$effect(() => {
		addMissingFilterOptions(typeFilter, types, true);
		addMissingFilterOptions(elementFilter, elements, true);
	});

	const rows = $derived(
		moves.filter(
			(move) =>
				(!Object.values(typeFilter).some(Boolean) || typeFilter[move.type]) &&
				(!Object.values(elementFilter).some(Boolean) || elementFilter[move.element])
		)
	);

	const columns: Column<Move>[] = [
		{
			key: 'name',
			label: 'Hissatsu',
			width: '240px',
			searchValue: (move) => `${move.name} ${move.description} ${move.type} ${move.element}`,
			renderComponent: (move) => ({ component: HissatsuCell, props: { move, players } })
		},
		{ key: 'power', label: 'Power' },
		{ key: 'maxPower', label: 'Max Power' },
		{ key: 'tp', label: 'TP' },
		{ key: 'type', label: 'Type' },
		{ key: 'element', label: 'Element' },
		{ key: 'growth', label: 'Growth' },
		{ key: 'foulRate', label: 'Foul %' }
	];
</script>

{#if moves.length}
	<div class="grid gap-4 lg:grid-cols-2">
		<CheckboxChipGroup label="Types" options={types} bind:checked={typeFilter} />
		<CheckboxChipGroup label="Elements" options={elements} bind:checked={elementFilter} />
	</div>
	<DataTable {columns} {rows} pageSize={50} />
{:else}
	<p class="text-center opacity-60">Loading moves...</p>
{/if}
