<script lang="ts">
	import DigimonModal from '$lib/components/digimon-story-ts/DigimonModal.svelte';
	import type { Digimon } from '$lib/utils/digimon-story-ts.utils';
	import { toKebabCase } from '$lib/utils/text.utils';

	interface Props {
		digimon: Digimon;
		variant?: 'default' | 'viewer';
		selected?: boolean;
		onClick?: (digimon: Digimon) => void;
		openModal?: boolean;
	}

	let {
		digimon,
		variant = 'default',
		selected = false,
		onClick,
		openModal = true
	}: Props = $props();

	let showModal = $state(false);
</script>

{#if variant === 'default'}
	<button
		type="button"
		class="w-full cursor-pointer p-0 border hover:border-accent"
		onclick={() => {
			if (openModal) showModal = true;
		}}
	>
		<img
			src={digimon.icon}
			alt={digimon.name}
			loading="lazy"
			class="w-full h-full object-cover aspect-square pointer-events-none"
		/>
	</button>

	{#if showModal}
		<DigimonModal
			digimon={digimon}
			bind:showModal
		/>
	{/if}

{:else}
	<div class="flex flex-col items-center gap-1">
		<button
			type="button"
			class="
				cursor-pointer
				relative border
				{selected ? 'border-accent' : ''}
				hover:scale-110 transition
			"
			onclick={() => onClick?.(digimon)}
		>
			<img
				src={digimon.icon}
				alt={digimon.name}
				loading="lazy"
				class="w-full h-full object-cover pointer-events-none"
			/>

			<!-- Attribute icon -->
			<img
				src={`/digimon-story-ts/${toKebabCase(digimon.attribute)}.png`}
				alt={digimon.attribute}
				class="absolute bottom-0 right-0 w-4 h-4 bg-bg"
			/>
		</button>

		<div
			class="text-xs w-18 text-center truncate"
		>
			{digimon.name}
		</div>
	</div>
{/if}
