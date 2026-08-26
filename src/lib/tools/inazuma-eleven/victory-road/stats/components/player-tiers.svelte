<script lang="ts">
	import { onMount } from 'svelte';
	import PlayerIcon from '$lib/components/inazuma-eleven-vr/PlayerIcon.svelte';
	import type { Player } from '$lib/utils/inazuma-eleven-vr.utils';

	import { computeRoleTiers } from '$lib/utils/inazuma-eleven-vr.utils';
	import { loadPlayers } from '$lib/data/inazuma-eleven-vr/data';

	const ROLES = ['FW', 'MF', 'DF', 'GK'] as const;

	let players = $state<Player[]>([]);

	onMount(async () => {
		players = await loadPlayers();
	});
</script>

{#if players.length}
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
							<div class="grid grid-cols-2 gap-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
								{#each tier.players as p (p.Image)}
									<PlayerIcon player={p} />
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{:else}
	<p class="text-center opacity-60">Loading players...</p>
{/if}
