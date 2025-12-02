<script lang="ts">
	import DataTable, { type Column } from "$lib/components/ui/data-table.svelte";
	import CheckboxInput from "$lib/components/ui/checkbox-input.svelte";

	import boots from "$lib/data/inazuma-eleven-vr/boots.json";
	import pendants from "$lib/data/inazuma-eleven-vr/pendants.json";
	import bracelets from "$lib/data/inazuma-eleven-vr/bracelets.json";
	import misc from "$lib/data/inazuma-eleven-vr/miscs.json";

	const raw = [
		...boots.map(e => ({ ...e, Category: "Boots" })),
		...pendants.map(e => ({ ...e, Category: "Pendant" })),
		...bracelets.map(e => ({ ...e, Category: "Bracelet" })),
		...misc.map(e => ({ ...e, Category: "Misc" }))
	];

	const rows = raw.map(r => {
		const cleaned: any = { ...r };
		for (const k of Object.keys(cleaned)) {
			if (cleaned[k] === "") cleaned[k] = "";

			cleaned.Shop1 = cleaned.Shop1 ?? "";
			cleaned.Shop2 = cleaned.Shop2 ?? "";
			cleaned.Shop3 = cleaned.Shop3 ?? "";

		}
		return cleaned;
	});


	const columns: Column[] = [
		{ key: "Item", label: "Item", width: "240px" },
		{ key: "Category", label: "Type" },
		{ key: "Kick", label: "Kick" },
		{ key: "Control", label: "Control" },
		{ key: "Technique", label: "Technique" },
		{ key: "Pressure", label: "Pressure" },
		{ key: "Physical", label: "Physical" },
		{ key: "Intelligence", label: "Intelligence" },
		{ key: "Agility", label: "Agility" },

		// ATDF stats
		// { key: "Shoot AT", label: "Shoot AT" },
		// { key: "Focus AT", label: "Focus AT" },
		// { key: "Focus DF", label: "Focus DF" },
		// { key: "Scramble AT", label: "Scramble AT" },
		// { key: "Scramble DF", label: "Scramble DF" },
		// { key: "Wall DF", label: "Wall DF" },
		// { key: "KP", label: "KP" },

		// Shops
		{ key: "Shop1", label: "Shop 1" },
		{ key: "Shop2", label: "Shop 2" },
		{ key: "Shop3", label: "Shop 3" }
	];

	// ---------------------------------------
	// FILTER GROUPS (dynamic)
	// ---------------------------------------
	function unique<T>(arr: T[]): T[] {
		return Array.from(new Set(arr));
	}

	const types = unique(rows.map(r => r.Category));
	const shops = unique(
		rows.flatMap(r => [r.Shop1, r.Shop2, r.Shop3]).filter(Boolean)
	);

	function makeFilter(list: string[]) {
		return Object.fromEntries(list.map(v => [v, false])) as Record<string, boolean>;
	}

	let typeFilter = $state(makeFilter(types));
	let shopFilter = $state(makeFilter(shops));

	// ---------------------------------------
	// FILTERED ROWS
	// ---------------------------------------
	let filteredRows = $derived.by(() => {
		const activeTypes = Object.keys(typeFilter).filter(k => typeFilter[k]);
		const activeShops = Object.keys(shopFilter).filter(k => shopFilter[k]);

		return rows.filter(r =>
			(activeTypes.length ? activeTypes.includes(r.Category) : true) &&
			(activeShops.length
				? activeShops.some(s => [r.Shop1, r.Shop2, r.Shop3].includes(s))
				: true)
		);
	});

	const filterGroups = [
		{ name: "Category", list: types, store: typeFilter },
	];
</script>

<div class="flex justify-around flex-row gap-2">
	{#each filterGroups as group (group)}
		<div class="flex flex-row gap-3">
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
