<script lang="ts">
	import CheckboxChipGroup from '$lib/components/ui/checkbox-chip-group.svelte';
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import { addMissingFilterOptions, unique } from '$lib/utils/filters.utils.svelte.js';
	import type { Equipment } from '$lib/utils/inazuma-eleven-1.utils';

	let { equipment }: { equipment: Equipment[] } = $props();

	const categories = $derived(unique(equipment.map((item) => item.category)));
	let categoryFilter = $state<Record<string, boolean>>({});

	$effect(() => {
		addMissingFilterOptions(categoryFilter, categories, true);
	});

	const rows = $derived(
		equipment.filter((item) => !Object.values(categoryFilter).some(Boolean) || categoryFilter[item.category])
	);

	const columns: Column<Equipment>[] = [
		{ key: 'name', label: 'Item', width: '240px' },
		{ key: 'category', label: 'Type' },
		{ key: 'price', label: 'Price' },
		{ key: 'fp', label: 'FP' },
		{ key: 'tp', label: 'TP' },
		{ key: 'kick', label: 'Kick' },
		{ key: 'body', label: 'Body' },
		{ key: 'guard', label: 'Guard' },
		{ key: 'control', label: 'Control' },
		{ key: 'speed', label: 'Speed' },
		{ key: 'guts', label: 'Guts' },
		{ key: 'stamina', label: 'Stamina' }
	];
</script>

{#if equipment.length}
	<CheckboxChipGroup label="Categories" options={categories} bind:checked={categoryFilter} />
	<DataTable {columns} {rows} pageSize={50} />
{:else}
	<p class="text-center opacity-60">Loading equipment...</p>
{/if}
