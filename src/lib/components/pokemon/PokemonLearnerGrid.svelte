<script lang="ts">
	import { getPokemonTypeColor } from '$lib/utils/pokemon.utils';
	type Learner = { id: string | number; name: string; image: string; primaryType?: string };
	let { learners, onSelect }: { learners: Learner[]; onSelect?: (learner: Learner) => void } = $props();
</script>

<div class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
	{#each learners as learner (learner.id)}
		<button
			type="button"
			disabled={!onSelect}
			class="flex items-center gap-2 text-left transition {onSelect ? 'cursor-pointer hover:text-accent' : ''}"
			onclick={() => onSelect?.(learner)}
		>
			<span
				class="h-12 w-12 shrink-0 border border-text/35 {learner.primaryType
					? getPokemonTypeColor(learner.primaryType)
					: 'bg-accent-dark'}"
				><img src={learner.image} alt="" class="h-full w-full object-contain [image-rendering:pixelated]" /></span
			>
			<span>{learner.name}</span>
		</button>
	{/each}
</div>
