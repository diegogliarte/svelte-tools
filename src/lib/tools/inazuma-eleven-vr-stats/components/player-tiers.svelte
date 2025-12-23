<script lang="ts">
	import PlayerIcon from '$lib/components/inazuma-eleven-vr/PlayerIcon.svelte';
	import type { Player } from '$lib/utils/inazuma-eleven-vr.utils';

	import { computeRoleTiers } from '$lib/utils/inazuma-eleven-vr.utils';
	import rawPlayers from '$lib/data/inazuma-eleven-vr/players.json';

	const ROLES = ["FW", "MF", "DF", "GK"] as const;

	const players: Player[] = rawPlayers as Player[];

</script>

<div class="flex flex-col gap-12">
	{#each ROLES as role (role)}
		<div>
			<h2 class="text-large">{role}</h2>

			<div class="grid grid-cols-3 gap-6">

				{#each computeRoleTiers(role, players) as tier, i (i)}
					<div>
						<h3>
							Tier {i + 1} ({tier.value})
						</h3>

						<!-- 👇 4-column grid of players -->
						<div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1">
							{#each tier.players as p (p.Image)}
								<PlayerIcon
									player={p}
								/>
							{/each}
						</div>

					</div>
				{/each}

			</div>
		</div>
	{/each}
</div>
