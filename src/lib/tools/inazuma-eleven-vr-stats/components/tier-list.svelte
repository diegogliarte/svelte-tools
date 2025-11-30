<script lang="ts">
	import { calculateATDFStats } from "$lib/utils/inazuma-eleven-vr";
	import players from "$lib/data/inazuma-eleven-vr/players.json";

	const tierStat = {
		FW: "shootAT",
		MF: "focusAT",
		DF: "focusDF",
		GK: "kp"
	};

	const elementColor = {
		Mountain: "bg-yellow-800/75",
		Fire: "bg-red-800/75",
		Forest: "bg-green-800/75",
		Wind: "bg-sky-800/75"
	};

	const processed = players
		.filter(p => p.Name !== "???")
		.map(p => {
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
			return { ...p, power: calculateATDFStats(base) };
		});

	function computeRoleTiers(role: "FW" | "MF" | "DF" | "GK") {
		const statKey = tierStat[role];

		const rolePlayers = processed
			.filter(p => p.Position === role)
			.map(p => ({
				player: p,
				value: p.power[statKey]
			}));

		const uniqueValues = Array.from(
			new Set(rolePlayers.map(p => p.value))
		)
			.sort((a, b) => b - a)
			.slice(0, 3);

		return uniqueValues.map(v => ({
			value: v,
			players: rolePlayers
				.filter(p => p.value === v)
				.map(p => p.player)
				.sort((a, b) => {
					const elemCompare = a.Element.localeCompare(b.Element);
					if (elemCompare !== 0) return elemCompare;
					return a.Name.localeCompare(b.Name);
				})
		}));
	}
</script>

<div class="flex flex-col gap-12">
	{#each ["FW", "MF", "DF", "GK"] as role (role)}
		<div>
			<h2 class="text-large">{role}</h2>

			<!-- 3 columns = Tier 1 / Tier 2 / Tier 3 -->
			<div class="grid grid-cols-3 gap-6">

				{#each computeRoleTiers(role) as tier, i (i)}
					<div>
						<div class="">
							Tier {i + 1} ({tier.value})
						</div>

						<!-- 👇 4-column grid of players -->
						<div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-1">
							{#each tier.players as p (p.Image)}
								<div class="border hover:border-accent transition w-full {elementColor[p.Element] ?? ''}">
									<img
										src={p.Image}
										alt={p.Name}
										title={p.Name}
										class="player-img"
									/>
								</div>
							{/each}
						</div>

					</div>
				{/each}

			</div>
		</div>
	{/each}
</div>
