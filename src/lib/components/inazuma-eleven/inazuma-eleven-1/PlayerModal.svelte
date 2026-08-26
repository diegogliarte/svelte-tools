<script lang="ts">
	import Modal from '$lib/components/ui/modal.svelte';
	import ModalPortrait from '$lib/components/ui/modal-portrait.svelte';
	import { getElementClass, type Player } from '$lib/utils/inazuma-eleven-1.utils';

	let { player, onClose }: { player: Player; onClose?: () => void } = $props();

	const stats = [
		['FP', 'fp'],
		['TP', 'tp'],
		['Kick', 'kick'],
		['Body', 'body'],
		['Guard', 'guard'],
		['Control', 'control'],
		['Speed', 'speed'],
		['Guts', 'guts'],
		['Stamina', 'stamina'],
		['Total', 'total'],
		['Freedom', 'freedom']
	] as const;
</script>

<Modal title={player.name} {onClose}>
	<div class="mb-4 flex gap-4">
		<ModalPortrait
			src={player.image}
			alt={`${player.name} portrait`}
			backgroundClass={getElementClass(player.element)}
		/>
		<div class="flex flex-col justify-center gap-1 text-xs">
			<div>{player.nickname}</div>
			<div>{player.position} · {player.element}</div>
			<div>{player.gender} · Age {player.age}</div>
			<div>Team: <span class="text-accent">{player.team}</span></div>
			<div>Recruitment: <span class="text-accent">{player.recruitment}</span></div>
		</div>
	</div>

	<p class="mb-4 text-sm">{player.description}</p>

	<h3 class="mb-1 font-bold">Level 99 stats</h3>
	<div class="mb-4 grid grid-cols-2 gap-1 text-xs sm:grid-cols-5">
		{#each stats as [label, key] (key)}
			<div>{label}: <b>{player.stats[key]}</b></div>
		{/each}
	</div>

	<h3 class="mb-1 font-bold">Moves</h3>
	<ul class="mb-4 grid gap-1 text-xs sm:grid-cols-2">
		{#each player.moves as move (move.id)}
			<li>{move.name} — {move.level === 100 ? 'Event' : `Lv. ${move.level}`}</li>
		{/each}
	</ul>

	<h3 class="mb-1 font-bold">Recruitment / locations</h3>
	{#if player.locations.length}
		<ul class="list-inside list-disc text-xs">
			{#each player.locations as location (location)}
				<li>{location}</li>
			{/each}
		</ul>
	{:else}
		<p class="text-xs opacity-60">Story, password, or another special recruitment method.</p>
	{/if}
</Modal>
