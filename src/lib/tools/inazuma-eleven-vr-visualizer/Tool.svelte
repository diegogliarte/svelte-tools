<script lang="ts">
	import players from "$lib/data/inazuma-eleven-vr/players.json";
	import TextInput from "$lib/components/ui/text-input.svelte";
	import { tooltipAction } from "$lib/actions/tooltip";

	let search = $state("");

	const elementColor = {
		Mountain: "bg-yellow-800/75",
		Fire: "bg-red-800/75",
		Forest: "bg-green-800/75",
		Wind: "bg-sky-800/75"
	};

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


	// -------------------------------------------------
	// SEARCH FILTERS
	// -------------------------------------------------
	function filterTeams() {
		const q = search.trim().toLowerCase();
		if (!q) return teamOrder;

		return teamOrder.filter(team => {
			if (team.toLowerCase().includes(q)) return true;
			return teamMap[team].some(p =>
				p.Name.toLowerCase().includes(q) ||
				(p.Nickname ?? "").toLowerCase().includes(q)
			);
		});
	}

	function filterPlayers(team: string) {
		const q = search.trim().toLowerCase();
		if (!q) return teamMap[team];

		return teamMap[team].filter(p =>
			p.Name.toLowerCase().includes(q) ||
			(p.Nickname ?? "").toLowerCase().includes(q) ||
			team.toLowerCase().includes(q)
		);
	}
</script>

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

									<div
										use:tooltipAction={{ text: p.Name, position: "top", trigger: "click" }}
										class="group w-16 aspect-square "
									>
										<img
											src={p.Image}
											alt={p.Name}
											class="w-full h-full object-cover {elementColor[p.Element] ?? 'bg-neutral-700'} pointer-events-none transition transform border group-hover:scale-300 group-hover:z-50"
										/>
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
