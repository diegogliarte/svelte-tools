<script lang="ts">
	import Modal from '$lib/components/ui/modal.svelte';
	import TypeBadge from './TypeBadge.svelte';
	import type { Gen1Move, Gen1Pokemon } from '$lib/data/pokemon-red-blue-yellow/data';
	import { openModal } from '$lib/states/modal.svelte';

	let {
		move,
		pokemonList,
		moves,
		onClose
	}: { move: Gen1Move; pokemonList: Gen1Pokemon[]; moves: Gen1Move[]; onClose?: () => void } = $props();
	const learnedBy = $derived.by(() => {
		const learnsWith = (pokemon: Gen1Pokemon, method: string) =>
			Object.values(pokemon.learnset).some((moves) =>
				moves.some((entry) => entry.name === move.name && entry.method === method)
			);
		return {
			level: pokemonList.filter((pokemon) => learnsWith(pokemon, 'Level Up')),
			machine: pokemonList.filter((pokemon) => learnsWith(pokemon, 'Machine'))
		};
	});

	async function openPokemon(pokemon: Gen1Pokemon) {
		const { default: PokemonModal } = await import('./PokemonModal.svelte');
		openModal(PokemonModal, { pokemon, pokemonList, moves });
	}
</script>

<Modal title={move.name} {onClose}>
	<div class="mb-4 flex items-center gap-2">
		<TypeBadge type={move.type} /><span class="text-sm">{move.category}</span>
	</div>
	<h3 class="mb-1 font-bold">Stats</h3>
	<div class="mb-4 grid grid-cols-2 gap-1 text-xs sm:grid-cols-3">
		<div>Power: <b>{move.power ?? '—'}</b></div>
		<div>PP: <b>{move.pp}</b></div>
		<div>Accuracy: <b>{move.accuracy == null ? '—' : `${move.accuracy}%`}</b></div>
		<div>Target: <b>{move.target}</b></div>
	</div>
	<p class="mb-4 text-sm opacity-70">{move.description}</p>
	<h3 class="mb-2 font-bold">Learned by</h3>
	<div class="grid gap-4 sm:grid-cols-2">
		<div>
			<h4 class="mb-1 text-sm text-accent">Level Up</h4>
			{#if learnedBy.level.length}
				<div class="grid grid-cols-2 gap-1 text-xs">
					{#each learnedBy.level as pokemon (pokemon.id)}
						<button
							type="button"
							class="flex cursor-pointer items-center gap-1 text-left hover:text-accent"
							onclick={() => openPokemon(pokemon)}
							><img src={pokemon.sprite} alt="" class="h-8 w-8 [image-rendering:pixelated]" />{pokemon.name}</button
						>
					{/each}
				</div>
			{:else}<p class="text-xs opacity-50">None</p>{/if}
		</div>
		<div>
			<h4 class="mb-1 text-sm text-accent">Machine</h4>
			{#if learnedBy.machine.length}
				<div class="grid grid-cols-2 gap-1 text-xs">
					{#each learnedBy.machine as pokemon (pokemon.id)}
						<button
							type="button"
							class="flex cursor-pointer items-center gap-1 text-left hover:text-accent"
							onclick={() => openPokemon(pokemon)}
							><img src={pokemon.sprite} alt="" class="h-8 w-8 [image-rendering:pixelated]" />{pokemon.name}</button
						>
					{/each}
				</div>
			{:else}<p class="text-xs opacity-50">None</p>{/if}
		</div>
	</div>
</Modal>
