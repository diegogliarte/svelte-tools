<script lang="ts">
	import { tooltipAction} from '$lib/actions/tooltip';
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

	const evoBadge = $derived.by(() => {
		const types = digimon.evolution_conditions?.map(e => e.type) ?? [];
		if (types.includes('jogress')) return 'jogress';
		if (types.includes('item')) return 'item';
		return null;
	});

	const evoTooltip = $derived.by(() => {
		if (!evoBadge) return '';

		const conditions = digimon.evolution_conditions
			.filter(e => e.type === evoBadge);

		return conditions
			.map(e =>
				Object.entries(e.requirements)
					.filter(([k]) =>
						k.toLowerCase().includes('jogress') ||
						k.toLowerCase().includes('item')
					)
					.map(([, v]) => `${v}`)
					.join(' & ')
			)
			.join('\n\n');
	});
</script>

{#if variant === 'default'}
	<button
		type="button"
		class="w-full cursor-pointer p-0 border hover:border-accent transition"
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
				{selected ? 'border-accent hover:border-red-400' : 'hover:border-accent'}
				 transition
			"
			onclick={() => onClick?.(digimon)}
		>
			<img
				src={digimon.icon}
				alt={digimon.name}
				loading="lazy"
				class="w-full h-full object-cover pointer-events-none"
			/>

			<img
				src={`/digimon-story-ts/${toKebabCase(digimon.attribute)}.png`}
				alt={digimon.attribute}
				class="absolute -bottom-1 -right-2 w-4 h-4 bg-bg"
			/>

			{#if evoBadge}
				<div
					class="absolute -top-2 -right-2 text-xs w-4 h-4 bg-bg"
					use:tooltipAction={{ text: evoTooltip, position: 'top' }}
				>
					{evoBadge === 'jogress' ? '🧬' : '🎒'}
				</div>
			{/if}
		</button>

		<!-- Name (opens modal) -->
		<button
			type="button"
			class="text-xs w-18 text-center truncate cursor-pointer hover:text-accent transition"
			onclick={() => {
				if (openModal) showModal = true;
			}}
		>
			{digimon.name}
		</button>
	</div>

	{#if showModal}
		<DigimonModal
			digimon={digimon}
			bind:showModal
		/>
	{/if}
{/if}

