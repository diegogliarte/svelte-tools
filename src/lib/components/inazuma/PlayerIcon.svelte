<script lang="ts">
	import PlayerModal from "$lib/components/inazuma/PlayerModal.svelte";
	import type { Player } from '$lib/utils/inazuma-eleven-vr';

	interface Props {
		player: Player;           // Pass entire player object
		variant?: "default" | "viewer";
	}

	let {
		player,
		variant = "default",
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
	class="w-full cursor-pointer p-0 hover:border-accent"
	onclick={() => showModal = true}
>
	<img
		src={player.Image}
		alt={player.Name}
		loading="lazy"
		class="
			w-full h-full object-cover aspect-square pointer-events-none border
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
