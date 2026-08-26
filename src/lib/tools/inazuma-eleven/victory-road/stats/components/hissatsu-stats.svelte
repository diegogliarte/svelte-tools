<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import CheckboxChipGroup from '$lib/components/ui/checkbox-chip-group.svelte';
	import HissatsuCell from '$lib/components/inazuma-eleven/victory-road/HissatsuCell.svelte';

	import { loadHissatsu } from '$lib/data/inazuma-eleven-vr/data';
	import { addMissingFilterOptions, sortNoneLast, unique } from '$lib/utils/filters.utils.svelte.js';
	import type { Hissatsu } from '$lib/utils/inazuma-eleven-vr.utils';

	let hissatsu = $state<Hissatsu[]>([]);

	onMount(async () => {
		hissatsu = await loadHissatsu();
	});

	const rows = $derived(
		hissatsu.map((r) => ({
			...r,
			Type: r.Type?.trim() || 'None',
			'Sub-Type': r['Sub-Type']?.trim() || 'None',
			Element: r.Element?.trim() || 'None'
		}))
	);

	const nameColumn: Column<Hissatsu> = {
		key: 'Name',
		label: 'Name',
		width: '260px',
		searchValue: (h) => `${h.Name} ${h['Japanese Name']} ${h.Type} ${h.Element}`,
		renderComponent: (hissatsu) => ({ component: HissatsuCell, props: { hissatsu } })
	};

	// ${h.Movie ? `
	// 		<div class="absolute w-96 left-40 z-50 hidden group-hover:block">
	// 			<video
	// 				src="${h.Movie}"
	// 				autoplay
	// 				muted
	// 				loop
	// 				playsinline
	// 				class="w-full h-full border pointer-events-none"
	// 			></video>
	// 		</div>
	// 		` : ""}

	const columns: Column<Hissatsu>[] = [
		nameColumn,
		{ key: 'Power', label: 'Power' },
		{ key: 'Tension', label: 'Tension' },
		{ key: 'Type', label: 'Type' },
		{ key: 'Sub-Type', label: 'Subtype' },
		{ key: 'Shop 1', label: 'Shop 1' },
		{ key: 'Shop 2', label: 'Shop 2' }
	];

	const types = $derived(unique(rows.map((r) => r.Type)));
	const subtypes = $derived(sortNoneLast(unique(rows.map((r) => r['Sub-Type']))));
	const elements = $derived(sortNoneLast(unique(rows.map((r) => r.Element))));
	const powerVals = $derived(unique(rows.map((r) => r.Power)).filter(Boolean));
	const powerOptions = $derived(powerVals.map(String));

	let typeFilter = $state<Record<string, boolean>>({});
	let subtypeFilter = $state<Record<string, boolean>>({});
	let elementFilter = $state<Record<string, boolean>>({});
	let powerFilter = $state<Record<string, boolean>>({});

	$effect(() => {
		addMissingFilterOptions(typeFilter, types);
		addMissingFilterOptions(subtypeFilter, subtypes);
		addMissingFilterOptions(elementFilter, elements);
		addMissingFilterOptions(powerFilter, powerOptions);
	});

	let filteredRows = $derived.by(() => {
		const allowedTypes = Object.keys(typeFilter).filter((k) => typeFilter[k]);
		const allowedSubtypes = Object.keys(subtypeFilter).filter((k) => subtypeFilter[k]);
		const allowedElements = Object.keys(elementFilter).filter((k) => elementFilter[k]);
		const allowedPowers = Object.keys(powerFilter).filter((k) => powerFilter[k]);

		return rows.filter(
			(r) =>
				(allowedTypes.length ? allowedTypes.includes(r.Type) : true) &&
				(allowedSubtypes.length ? allowedSubtypes.includes(r['Sub-Type']) : true) &&
				(allowedElements.length ? allowedElements.includes(r.Element) : true) &&
				(allowedPowers.length ? allowedPowers.includes(r.Power.toString()) : true)
		);
	});
</script>

{#if hissatsu.length}
	<div class="flex flex-col gap-4">
		<div class="grid gap-4 lg:grid-cols-2">
			<CheckboxChipGroup label="Type" options={types} bind:checked={typeFilter} />

			<CheckboxChipGroup label="Subtype" options={subtypes} bind:checked={subtypeFilter} />

			<CheckboxChipGroup label="Element" options={elements} bind:checked={elementFilter} />

			<CheckboxChipGroup label="Power" options={powerOptions} bind:checked={powerFilter} />
		</div>
	</div>

	<DataTable {columns} rows={filteredRows} pageSize={50} />
{:else}
	<p class="text-center opacity-60">Loading hissatsu...</p>
{/if}
