<script lang="ts">
	import DataTable from "$lib/components/ui/data-table.svelte";
	import SelectInput from "$lib/components/ui/select-input.svelte";

	import players from "$lib/data/inazuma-eleven-vr/players.json";

	// -----------------------------
	// FILTER OPTIONS
	// -----------------------------
	let positionFilter = $state<string>("");   // "" = all
	let elementFilter  = $state<string>("");
	let roleFilter     = $state<string>("");
	let genderFilter   = $state<string>("");

	const positions = ["GK", "DF", "MF", "FW"];
	const elements  = ["Fire", "Wind", "Forest", "Mountain"];
	const roles     = ["Player", "Manager", "Coach"]; // adjust if needed
	const genders   = ["Male", "Female"];             // from your dataset

	// -----------------------------
	// FILTERED ROWS
	// -----------------------------
	let filteredRows = $derived.by(() =>
		players.filter(p =>
			(positionFilter ? p.Position === positionFilter : true) &&
			(elementFilter  ? p.Element  === elementFilter  : true) &&
			(roleFilter     ? p.Role     === roleFilter     : true) &&
			(genderFilter   ? p.Gender   === genderFilter   : true)
		)
	);

	// -----------------------------
	// DataTable columns (unchanged)
	// -----------------------------
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
		FW: "bg-red-900",
	};

	const columns = [
		{
			key: "player",
			label: "Player",
			width: "280px",
			render: (p) => `
				<div class="flex items-center gap-3">
					<div class="w-14 h-14 ${elementColor[p.Element] ?? "bg-neutral-700"}">
						<img src="${p.Image}" alt="${p.Name}"
							class="w-full h-full  object-cover aspect-square"/>
					</div>
					<div>
						<div class="leading-none">${p.Name}</div>
						<div class="text-xs inline-block px-1 border ${positionColor[p.Position] ?? "bg-neutral-700"}">
							${p.Position}
						</div>
					</div>
				</div>
			`,
			searchValue: (p) => `${p.Name} ${p.Nickname} ${p.Position}`
		},
		{ key: "Kick", label: "Kick" },
		{ key: "Control", label: "Control" },
		{ key: "Technique", label: "Technique" },
		{ key: "Pressure", label: "Pression" },
		{ key: "Physical", label: "Physical" },
		{ key: "Agility", label: "Agility" },
		{ key: "Intelligence", label: "Intelligence" },
		{
			key: "Total",
			label: "Total",
			render: (p) => `<span class="font-bold">${p.Total}</span>`
		}
	];
</script>

<div class="flex gap-4">

	<SelectInput
		label="Position"
		bind:value={positionFilter}
		options={positions.map(p => ({ value: p, label: p }))}
		placeholder="All positions"
	/>

	<!-- Element -->
	<SelectInput
		label="Element"
		bind:value={elementFilter}
		options={elements.map(e => ({ value: e, label: e }))}
		placeholder="All elements"
	/>

	<!-- Role -->
	<SelectInput
		label="Role"
		bind:value={roleFilter}
		options={roles.map(r => ({ value: r, label: r }))}
		placeholder="All roles"
	/>

	<!-- Gender -->
	<SelectInput
		label="Gender"
		bind:value={genderFilter}
		options={genders.map(g => ({ value: g, label: g }))}
		placeholder="All genders"
	/>

</div>

<DataTable {columns} rows={filteredRows} pageSize={50} />