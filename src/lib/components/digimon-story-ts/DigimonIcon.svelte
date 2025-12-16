<script lang="ts">
	import DigimonModal from '$lib/components/digimon-story-ts/DigimonModal.svelte';

	import type { Digimon } from '$lib/utils/digimon-story-ts.utils';

	interface Props {
		digimon: Digimon;
	}

	let {
		digimon,
	}: Props = $props();

	let showModal = $state(false);
</script>

<button
	type="button"
	class="w-full cursor-pointer p-0 hover:border-accent"
	onclick={() => showModal = true}
>
	<img
		src={digimon.icon}
		alt={digimon.name}
		loading="lazy"
		class="w-full h-full object-cover aspect-square pointer-events-none border"
	/>
</button>

{#if showModal}
	<DigimonModal
		digimon={digimon}
		bind:showModal
	/>
{/if}
