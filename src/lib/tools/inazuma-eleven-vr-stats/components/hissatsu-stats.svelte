<script lang="ts">
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import CheckboxInput from '$lib/components/ui/checkbox-input.svelte';
	import hissatsu from "$lib/data/inazuma-eleven-vr/hissatsu.json";
	import { makeFilter, sortNoneLast, unique } from '$lib/utils/filters.svelte';

	// Element colors (optional)
	const elementColor = {
		"Mountain": "bg-yellow-800",
		"Fire": "bg-red-800",
		"Forest": "bg-green-800",
		"Wind": "bg-sky-800"
	};

	const nameColumn: Column = {
		key: "Name",
		label: "Name",
		width: "260px",
		searchValue: (h) => `${h.Name} ${h["Japanese Name"]} ${h.Type} ${h.Element}`,
		render: (h) => `
		<div class="relative group flex items-center gap-2 cursor-pointer">
			<div class="w-3 h-3 rounded-sm ${elementColor[h.Element] ?? 'bg-neutral-600'}"></div>
			<span>${h.Name}</span>


		</div>
	`
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



	const columns: Column[] = [
		nameColumn,
		{ key: "Power", label: "Power" },
		{ key: "Tension", label: "Tension" },
		{ key: "Type", label: "Type" },
		{ key: "Sub-Type", label: "Subtype" },
		{ key: "Shop 1", label: "Shop 1" },
		{ key: "Shop 2", label: "Shop 2" }
	];

	// Rows come directly from JSON
	const rows = hissatsu.map((r) => ({
		...r,
		Type: r.Type?.trim() || "None",
		"Sub-Type": r["Sub-Type"]?.trim() || "None",
		Element: r.Element?.trim() || "None",
	}));

	const types      = unique(rows.map(r => r.Type));
	const subtypes   = sortNoneLast(unique(rows.map(r => r["Sub-Type"])));
	const elements   = sortNoneLast(unique(rows.map(r => r.Element)));
	const powerVals  = unique(rows.map(r => r.Power)).filter(Boolean);

	let typeFilter     = $state(makeFilter(types));
	let subtypeFilter  = $state(makeFilter(subtypes));
	let elementFilter  = $state(makeFilter(elements));
	let powerFilter    = $state(makeFilter(powerVals.map(String)));

	let filteredRows = $derived.by(() => {
		const allowedTypes     = Object.keys(typeFilter).filter(k => typeFilter[k]);
		const allowedSubtypes  = Object.keys(subtypeFilter).filter(k => subtypeFilter[k]);
		const allowedElements  = Object.keys(elementFilter).filter(k => elementFilter[k]);
		const allowedPowers    = Object.keys(powerFilter).filter(k => powerFilter[k]);

		return rows.filter(r =>
			(allowedTypes.length     ? allowedTypes.includes(r.Type)             : true) &&
			(allowedSubtypes.length  ? allowedSubtypes.includes(r['Sub-Type']) : true) &&
			(allowedElements.length  ? allowedElements.includes(r.Element)       : true) &&
			(allowedPowers.length    ? allowedPowers.includes(r.Power.toString()) : true)
		);
	});

	const filterGroups = [
		{ name: "Type",     list: types,     store: typeFilter },
		{ name: "Subtype",  list: subtypes,  store: subtypeFilter },
		{ name: "Element",  list: elements,  store: elementFilter },
		{ name: "Power",    list: powerVals.map(String), store: powerFilter }
	];

</script>

<div class="flex justify-around flex-col sm:flex-row gap-2">
	{#each filterGroups as group (group)}
		<div class="flex flex-row sm:flex-col gap-1">
			{#each group.list as val (val)}
				<CheckboxInput
					label={val}
					bind:checked={group.store[val]}
				/>
			{/each}
		</div>
	{/each}
</div>

<DataTable {columns} rows={filteredRows} pageSize={50} />
