<script lang="ts">
	import players from "$lib/data/inazuma-eleven-vr/players.json";
	import TextInput from "$lib/components/ui/text-input.svelte";
	import PlayerIcon from '$lib/components/inazuma/PlayerIcon.svelte';
	import CheckboxInput from "$lib/components/ui/checkbox-input.svelte";

	let search = $state("");

	const positions = ["GK", "DF", "MF", "FW"] as const;
	const elements  = ["Fire", "Wind", "Forest", "Mountain"] as const;
	const roles     = ["Player", "Manager", "Coach"] as const;
	const genders   = ["Male", "Female"] as const;

	function makeFilter(list: readonly string[]) {
		return Object.fromEntries(list.map(k => [k, false])) as Record<string, boolean>;
	}

	let positionFilter = $state(makeFilter(positions));
	let elementFilter  = $state(makeFilter(elements));
	let roleFilter     = $state(makeFilter(roles));
	let genderFilter   = $state(makeFilter(genders));

	const positionOrder = ["FW", "MF", "DF", "GK", "?"] as const;

	// -------------------------------------------------
	// Build team map (NO sorting, original order)
	// -------------------------------------------------
	const teamMap: Record<string, any[]> = {};

	for (const p of players) {
		const teams = p.Teams?.length ? p.Teams : ["-"];

		for (const t of teams) {
			if (!teamMap[t]) teamMap[t] = [];
			teamMap[t].push(p);
		}
	}

	// Teams in natural scrape order:
	let teamOrder = Object.keys(teamMap);

	// Remove the two special cases from the main list:
	teamOrder = teamOrder.filter(t => t !== "Unaffiliated" && t !== "-");

	// Push them at the end **in this order**
	if (teamMap["Unaffiliated"]) teamOrder.push("Unaffiliated");
	if (teamMap["-"]) teamOrder.push("-");

	function matchAttributes(p) {
		const posActive = Object.keys(positionFilter).filter(k => positionFilter[k]);
		const elemActive = Object.keys(elementFilter).filter(k => elementFilter[k]);
		const roleActive = Object.keys(roleFilter).filter(k => roleFilter[k]);
		const genderActive = Object.keys(genderFilter).filter(k => genderFilter[k]);

		return (
			(posActive.length   ? posActive.includes(p.Position) : true) &&
			(elemActive.length  ? elemActive.includes(p.Element) : true) &&
			(roleActive.length  ? roleActive.includes(p.Role)   : true) &&
			(genderActive.length? genderActive.includes(p.Gender) : true)
		);
	}

	function filterTeams() {
		const q = search.trim().toLowerCase();
		if (!q) return teamOrder;

		return teamOrder.filter(team =>
			filterPlayers(team).length > 0 ||
			team.toLowerCase().includes(search.trim().toLowerCase())
		);
	}

	function filterPlayers(team: string) {
		const q = search.trim().toLowerCase();

		return teamMap[team].filter(p =>
			matchAttributes(p) &&
			(
				!q ||
				p.Name.toLowerCase().includes(q) ||
				(p.Nickname ?? "").toLowerCase().includes(q) ||
				team.toLowerCase().includes(q)
			)
		);
	}

</script>

<div class="flex justify-around flex-col sm:flex-row gap-2">

	<div class="flex flex-row sm:flex-col gap-1">
		{#each positions as pos (pos)}
			<CheckboxInput label={pos} bind:checked={positionFilter[pos]} />
		{/each}
	</div>

	<div class="flex flex-row sm:flex-col gap-1">
		{#each elements as el (el)}
			<CheckboxInput label={el} bind:checked={elementFilter[el]} />
		{/each}
	</div>

	<div class="flex flex-row sm:flex-col gap-1">
		{#each roles as r (r)}
			<CheckboxInput label={r} bind:checked={roleFilter[r]} />
		{/each}
	</div>

	<div class="flex flex-row sm:flex-col gap-1">
		{#each genders as g (g)}
			<CheckboxInput label={g} bind:checked={genderFilter[g]} />
		{/each}
	</div>

</div>

<!-- SEARCH -->
<div class="w-48 mb-4">
	<TextInput placeholder="Search..." bind:value={search} />
</div>

<div class="flex flex-row flex-wrap gap-8">

	{#each filterTeams() as team (team)}
		<div class="border px-2 pb-2 h-fit">

			<h2 class="text-large">{team}</h2>

			<div class="flex flex-col gap-4">
				{#each positionOrder as pos (pos)}
					{#if filterPlayers(team).some(p => p.Position === pos)}

						<div class="flex flex-row gap-2">
							<h3 class="">{pos}</h3>

							<!-- FLEX WRAP PLAYER ROW -->
							<div class="flex flex-wrap flex-row gap-0.5">

								{#each filterPlayers(team).filter(p => p.Position === pos) as p (p.ID)}
									<div class="w-16 h-16 group">
										<PlayerIcon
											img={p.Image}
											name={p.Name}
											element={p.Element}
											variant="viewer"
										></PlayerIcon>
									</div>

								{/each}

							</div>
						</div>

					{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>
