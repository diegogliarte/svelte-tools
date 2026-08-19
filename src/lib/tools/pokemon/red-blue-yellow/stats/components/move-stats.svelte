<script lang="ts">
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import CheckboxChipGroup from '$lib/components/ui/checkbox-chip-group.svelte';
	import MoveCell from '$lib/components/pokemon-red-blue-yellow/MoveCell.svelte';
	import type { Gen1Move, Gen1Pokemon } from '$lib/data/pokemon-red-blue-yellow/data';
	import { addMissingFilterOptions, unique } from '$lib/utils/filters.utils.svelte';

	let { pokemon, moves }: { pokemon: Gen1Pokemon[]; moves: Gen1Move[] } = $props();
	let typeFilter = $state<Record<string, boolean>>({});
	let categoryFilter = $state<Record<string, boolean>>({});
	const types = $derived(unique(moves.map((move) => move.type)).sort());
	const categories = $derived(unique(moves.map((move) => move.category)).sort());
	$effect(() => {
		addMissingFilterOptions(typeFilter, types);
		addMissingFilterOptions(categoryFilter, categories);
	});
	const rows = $derived(
		moves.filter((move) => {
			const selectedTypes = Object.keys(typeFilter).filter((type) => typeFilter[type]);
			const selectedCategories = Object.keys(categoryFilter).filter((category) => categoryFilter[category]);
			return (
				(!selectedTypes.length || selectedTypes.includes(move.type)) &&
				(!selectedCategories.length || selectedCategories.includes(move.category))
			);
		})
	);
	const columns: Column<Gen1Move>[] = [
		{
			key: 'name',
			label: 'Move',
			width: '240px',
			renderComponent: (move) => ({ component: MoveCell, props: { move, pokemonList: pokemon, moves } })
		},
		{ key: 'type', label: 'Type' },
		{ key: 'category', label: 'Category' },
		{ key: 'power', label: 'Power', value: (move) => move.power ?? '—' },
		{ key: 'accuracy', label: 'Accuracy', value: (move) => (move.accuracy == null ? '—' : `${move.accuracy}%`) },
		{ key: 'pp', label: 'PP' },
		{ key: 'target', label: 'Target' }
	];
</script>

<div class="mb-4 grid gap-4 lg:grid-cols-2">
	<CheckboxChipGroup label="Type" options={types} bind:checked={typeFilter} />
	<CheckboxChipGroup label="Category" options={categories} bind:checked={categoryFilter} />
</div>
<DataTable {columns} {rows} rowKey={(move) => move.id} />
