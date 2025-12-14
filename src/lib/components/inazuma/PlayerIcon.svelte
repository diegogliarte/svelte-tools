<script lang="ts">
	import { tooltipAction } from "$lib/actions/tooltip";
	import PlayerModal from "$lib/components/inazuma/PlayerModal.svelte";
	import type { Player } from '$lib/utils/inazuma-eleven-vr';

	interface Props {
		player: Player;           // Pass entire player object
		tooltip?: boolean;
		variant?: "default" | "viewer";
		openModal?: boolean;    // default: true → auto open modal on click
	}

	let {
		player,
		tooltip = true,
		variant = "default",
		openModal = true,
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
	use:tooltipAction={{
		text: tooltip ? player.Name : "",
		position: variant === "viewer" ? "top" : "bottom",
		trigger: variant === "viewer" ? "click" : "hover"
	}}
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
