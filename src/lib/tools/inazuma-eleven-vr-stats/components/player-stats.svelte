<script lang="ts">
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import SelectInput from "$lib/components/ui/select-input.svelte";
	import CheckboxInput from "$lib/components/ui/checkbox-input.svelte";

	import rawPlayers from "$lib/data/inazuma-eleven-vr/players.json";
	import { calculateATDFStats } from "$lib/utils/inazuma-eleven-vr";

	// ---------------------------------------
	// DATA
	// ---------------------------------------
	const players = rawPlayers.filter(p => p.Name !== "???");

	const positions = ["GK", "DF", "MF", "FW"] as const;
	const elements  = ["Fire", "Wind", "Forest", "Mountain"] as const;
	const roles     = ["Player", "Manager", "Coach"] as const;
	const genders   = ["Male", "Female"] as const;

	function makeFilter<T extends readonly string[]>(list: T) {
		return Object.fromEntries(list.map(key => [key, false])) as Record<T[number], boolean>;
	}

	let positionFilter = $state(makeFilter(positions));
	let elementFilter  = $state(makeFilter(elements));
	let roleFilter     = $state(makeFilter(roles));
	let genderFilter   = $state(makeFilter(genders));

	let statMode = $state<"normal" | "atdf">("normal");

	// ---------------------------------------
	// FILTERED DATA
	// ---------------------------------------
	let filteredRows = $derived.by(() => {
		const posSelected    = Object.keys(positionFilter).filter(k => positionFilter[k]);
		const elemSelected   = Object.keys(elementFilter).filter(k => elementFilter[k]);
		const roleSelected   = Object.keys(roleFilter).filter(k => roleFilter[k]);
		const genderSelected = Object.keys(genderFilter).filter(k => genderFilter[k]);

		return players.filter(p =>
			(posSelected.length   ? posSelected.includes(p.Position) : true) &&
			(elemSelected.length  ? elemSelected.includes(p.Element) : true) &&
			(roleSelected.length  ? roleSelected.includes(p.Role)   : true) &&
			(genderSelected.length? genderSelected.includes(p.Gender): true)
		);
	});

	// ---------------------------------------
	// COMPUTED STATS (ATDF)
	// ---------------------------------------
	let computedRows = $derived.by(() =>
		filteredRows.map(p => {
			const base = {
				kick: p.Kick,
				control: p.Control,
				technique: p.Technique,
				pressure: p.Pressure,
				physical: p.Physical,
				agility: p.Agility,
				intelligence: p.Intelligence,
				total: p.Total
			};

			const atdf = calculateATDFStats(base);
			return { ...p, ...atdf };
		})
	);

	// ---------------------------------------
	// COLORS + COLUMNS
	// ---------------------------------------
	const elementColor = {
		Mountain: "bg-yellow-800/75",
		Fire: "bg-red-800/75",
		Forest: "bg-green-800/75",
		Wind: "bg-sky-800/75"
	};

	const positionColor = {
		GK: "bg-yellow-900",
		DF: "bg-blue-900",
		MF: "bg-green-900",
		FW: "bg-red-900"
	};

	const playerColumn: Column = {
		key: "player",
		label: "Player",
		width: "280px",
		searchValue: (p) => `${p.Name} ${p.Nickname} ${p.Position}`,
		render: (p) => `
			<div class="flex items-center gap-3">
				<div class="w-14 h-14 ${elementColor[p.Element] ?? "bg-neutral-700"}">
					<img src="${p.Image}" alt="${p.Name}" class="w-full h-full object-cover" />
				</div>
				<div>
					<div class="leading-none">${p.Name}</div>
					<div class="text-xs inline-block px-1 border ${positionColor[p.Position] ?? "bg-neutral-700"}">
						${p.Position}
					</div>
				</div>
			</div>
		`,
	};

	const normalColumns: Column[] = [
		playerColumn,
		{ key: "Kick", label: "Kick" },
		{ key: "Control", label: "Control" },
		{ key: "Technique", label: "Technique" },
		{ key: "Pressure", label: "Pressure" },
		{ key: "Physical", label: "Physical" },
		{ key: "Agility", label: "Agility" },
		{ key: "Intelligence", label: "Intelligence" },
		{ key: "Total", label: "Total", render: (p) => `<span class="font-bold">${p.Total}</span>` }
	];

	const atdfColumns: Column[] = [
		playerColumn,
		{ key: "shootAT", label: "Shoot AT" },
		{ key: "focusAT", label: "Focus AT" },
		{ key: "focusDF", label: "Focus DF" },
		{ key: "wallDF", label: "Wall DF" },
		{ key: "scrambleAT", label: "Scramble AT" },
		{ key: "scrambleDF", label: "Scramble DF" },
		{ key: "kp", label: "KP" }
	];

	let columns = $derived(statMode === "normal" ? normalColumns : atdfColumns);
</script>

<!-- FILTERS + MODE SELECT -->
<div class="flex justify-around flex-col sm:flex-row gap-2">
	<div class="flex flex-row sm:flex-col gap-1">
		{#each positions as position (position)}
			<CheckboxInput label={position} bind:checked={positionFilter[position]} />
		{/each}
	</div>

	<div class="flex flex-row sm:flex-col gap-1">
		{#each elements as element (element)}
			<CheckboxInput label={element} bind:checked={elementFilter[element]} />
		{/each}
	</div>

	<div class="flex flex-row sm:flex-col gap-1">
		{#each roles as role (role)}
			<CheckboxInput label={role} bind:checked={roleFilter[role]} />
		{/each}
	</div>

	<div class="flex flex-row sm:flex-col gap-1">
		{#each genders as gender (gender)}
			<CheckboxInput label={gender} bind:checked={genderFilter[gender]} />
		{/each}
	</div>

	<SelectInput
		label="Stats Mode"
		bind:value={statMode}
		options={[
			{ value: "normal", label: "Normal Stats" },
			{ value: "atdf", label: "ATDF Stats" }
		]}
	/>
</div>

<DataTable {columns} rows={computedRows} pageSize={50} />
