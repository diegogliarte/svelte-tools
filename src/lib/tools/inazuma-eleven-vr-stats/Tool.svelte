<script lang="ts">
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import InazumaTierList from './components/tier-list.svelte';
	import SelectInput from "$lib/components/ui/select-input.svelte";
	import { calculateATDFStats } from "$lib/utils/inazuma-eleven-vr";

	import rawPlayers from "$lib/data/inazuma-eleven-vr/players.json";

	const players = rawPlayers.filter(p => p.Name !== "???");

	// ----------------------------------
	// FILTER STATE
	// ----------------------------------
	let positionFilter = $state<string>("");
	let elementFilter  = $state<string>("");
	let roleFilter     = $state<string>("");
	let genderFilter   = $state<string>("");

	const positions = ["GK", "DF", "MF", "FW"];
	const elements  = ["Fire", "Wind", "Forest", "Mountain"];
	const roles     = ["Player", "Manager", "Coach"];
	const genders   = ["Male", "Female"];

	// ----------------------------
	// FILTERED RAW PLAYERS
	// ----------------------------
	let filteredRows = $derived.by(() =>

		players.filter(p =>
			(positionFilter ? p.Position === positionFilter : true) &&
			(elementFilter  ? p.Element  === elementFilter  : true) &&
			(roleFilter     ? p.Role     === roleFilter     : true) &&
			(genderFilter   ? p.Gender   === genderFilter   : true)
		)
	);

	let statMode = $state<"normal" | "atdf">("normal");

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
	// COLORS
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
					<img src="${p.Image}" alt="${p.Name}"
						class="w-full h-full object-cover aspect-square"/>
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
		{ key: "Pressure", label: "Pression" },
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

	// current column set
	let columns = $derived(statMode === "normal" ? normalColumns : atdfColumns)

	let showTiers = $state<boolean>(false);
</script>

<SelectInput
	label="Display Mode"
	bind:value={showTiers}
	options={[
		{ value: false, label: "Stats Table" },
		{ value: true, label: "Tier Lists" }
	]}
/>

{#if showTiers === true}
	<InazumaTierList />
{:else}
	<div class="flex gap-4">
		<SelectInput
			label="Position"
			bind:value={positionFilter}
			options={positions.map(p => ({ value: p, label: p }))}
			placeholder="All positions"
		/>

		<SelectInput
			label="Element"
			bind:value={elementFilter}
			options={elements.map(e => ({ value: e, label: e }))}
			placeholder="All elements"
		/>

		<SelectInput
			label="Role"
			bind:value={roleFilter}
			options={roles.map(r => ({ value: r, label: r }))}
			placeholder="All roles"
		/>

		<SelectInput
			label="Gender"
			bind:value={genderFilter}
			options={genders.map(g => ({ value: g, label: g }))}
			placeholder="All genders"
		/>

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
{/if}
