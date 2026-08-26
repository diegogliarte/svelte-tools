<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import CheckboxChipGroup from '$lib/components/ui/checkbox-chip-group.svelte';

	import { loadEquipment, type EquipmentItem } from '$lib/data/inazuma-eleven-vr/data';
	import { addMissingFilterOptions, unique } from '$lib/utils/filters.utils.svelte.js';

	let raw = $state<EquipmentItem[]>([]);

	onMount(async () => {
		const { boots, pendants, bracelets, misc } = await loadEquipment();
		raw = [
			...boots.map((e) => ({ ...e, Category: 'Boots' })),
			...pendants.map((e) => ({ ...e, Category: 'Pendant' })),
			...bracelets.map((e) => ({ ...e, Category: 'Bracelet' })),
			...misc.map((e) => ({ ...e, Category: 'Misc' }))
		];
	});

	const rows = $derived(
		raw.map((r) => {
			const cleaned: EquipmentItem = { ...r };

			for (const k of Object.keys(cleaned)) {
				if (cleaned[k] === '') cleaned[k] = '';
			}

			cleaned.Shop1 = cleaned.Shop1 ?? '';
			cleaned.Shop2 = cleaned.Shop2 ?? '';
			cleaned.Shop3 = cleaned.Shop3 ?? '';

			return cleaned;
		})
	);

	const columns: Column[] = [
		{ key: 'Item', label: 'Item', width: '240px' },
		{ key: 'Category', label: 'Type' },
		{ key: 'Kick', label: 'Kick' },
		{ key: 'Control', label: 'Control' },
		{ key: 'Technique', label: 'Technique' },
		{ key: 'Pressure', label: 'Pressure' },
		{ key: 'Physical', label: 'Physical' },
		{ key: 'Intelligence', label: 'Intelligence' },
		{ key: 'Agility', label: 'Agility' },

		// ATDF stats
		// { key: "Shoot AT", label: "Shoot AT" },
		// { key: "Focus AT", label: "Focus AT" },
		// { key: "Focus DF", label: "Focus DF" },
		// { key: "Scramble AT", label: "Scramble AT" },
		// { key: "Scramble DF", label: "Scramble DF" },
		// { key: "Wall DF", label: "Wall DF" },
		// { key: "KP", label: "KP" },

		// Shops
		{ key: 'Shop1', label: 'Shop 1' },
		{ key: 'Shop2', label: 'Shop 2' },
		{ key: 'Shop3', label: 'Shop 3' }
	];

	const types = $derived(unique(rows.map((r) => String(r.Category))));
	const shops = $derived(unique(rows.flatMap((r) => [r.Shop1, r.Shop2, r.Shop3].map(String).filter(Boolean))));

	let typeFilter = $state<Record<string, boolean>>({});
	let shopFilter = $state<Record<string, boolean>>({});

	$effect(() => {
		addMissingFilterOptions(typeFilter, types);
		addMissingFilterOptions(shopFilter, shops);
	});

	let filteredRows = $derived.by(() => {
		const activeTypes = Object.keys(typeFilter).filter((k) => typeFilter[k]);
		const activeShops = Object.keys(shopFilter).filter((k) => shopFilter[k]);

		return rows.filter(
			(r) =>
				(activeTypes.length ? activeTypes.includes(String(r.Category)) : true) &&
				(activeShops.length ? activeShops.some((s) => [r.Shop1, r.Shop2, r.Shop3].map(String).includes(s)) : true)
		);
	});
</script>

{#if raw.length}
	<div class="flex flex-col gap-4">
		<div class="grid gap-4 lg:grid-cols-2">
			<CheckboxChipGroup label="Category" options={types} bind:checked={typeFilter} />

			<CheckboxChipGroup label="Shop" options={shops} bind:checked={shopFilter} />
		</div>
	</div>

	<DataTable {columns} rows={filteredRows} pageSize={50} />
{:else}
	<p class="text-center opacity-60">Loading equipment...</p>
{/if}
