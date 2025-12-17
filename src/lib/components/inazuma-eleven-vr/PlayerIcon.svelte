<script lang="ts">
	import PlayerModal from "$lib/components/inazuma-eleven-vr/PlayerModal.svelte";
	import type { Player } from '$lib/utils/inazuma-eleven-vr.utils';

	interface Props {
		player: Player;
		variant?: "default" | "viewer";
		openModal?: boolean;
	}

	let {
		player,
		variant = "default",
		openModal = true
	}: Props = $props();

	const elementColor: Record<string, string> = {
		Mountain: "bg-yellow-800/75",
		Fire: "bg-red-800/75",
		Forest: "bg-green-800/75",
		Wind: "bg-sky-800/75"
	};

	let showModal = $state(false);
</script>

<!-- BUTTON / ICON -->
<button
	type="button"
	class="w-full cursor-pointer p-0 group"
	onclick={() => {
			if (openModal) showModal = true;
		}}>
	<img
		src={player.Image}
		alt={player.Name}
		loading="lazy"
		class="
			w-full h-full object-cover aspect-square pointer-events-none group-hover:border-accent border
			{elementColor[player.Element] ?? 'bg-neutral-700'}
			{variant === 'viewer' ? 'group-hover:scale-300 group-hover:z-50 transition transform' : ''}
		"
	/>
</button>

{#if showModal}
	<PlayerModal
		player={player}
		bind:showModal
	/>
{/if}
