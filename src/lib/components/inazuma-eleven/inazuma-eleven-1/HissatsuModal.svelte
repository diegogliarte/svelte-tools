<script lang="ts">
	import Modal from '$lib/components/ui/modal.svelte';
	import ElementBadge from '$lib/components/inazuma-eleven/ElementBadge.svelte';
	import PlayerCell from './PlayerCell.svelte';
	import type { Move, Player } from '$lib/utils/inazuma-eleven-1.utils';

	let { move, players, onClose }: { move: Move; players: Player[]; onClose?: () => void } = $props();
	const learnedBy = $derived(players.filter((player) => player.moves.some((entry) => entry.id === move.id)));
</script>

<Modal title={move.name} {onClose}>
	<div class="mb-4 flex items-center gap-2">
		<ElementBadge element={move.element} />
		<span class="text-sm">{move.type}</span>
	</div>

	<div class="mb-4 grid grid-cols-2 gap-1 text-xs sm:grid-cols-3">
		<div>Power: <b>{move.power}</b></div>
		<div>Max Power: <b>{move.maxPower}</b></div>
		<div>TP: <b>{move.tp}</b></div>
		<div>Growth: <b>{move.growth}</b></div>
		<div>Foul Rate: <b>{move.foulRate}%</b></div>
	</div>

	{#if move.description}<p class="mb-4 text-sm opacity-70">{move.description}</p>{/if}

	<h3 class="mb-2 font-bold">Learned By</h3>
	{#if learnedBy.length}
		<div class="grid gap-2 sm:grid-cols-2">
			{#each learnedBy as player (player.id)}
				<PlayerCell {player} />
			{/each}
		</div>
	{:else}
		<p class="text-sm opacity-60">No player learns this hissatsu naturally.</p>
	{/if}
</Modal>
