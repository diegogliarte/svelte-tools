<script lang="ts">
	import Cell from '$lib/components/ui/cell.svelte';
	import { openModal } from '$lib/states/modal.svelte';
	import type { Gen1Move, Gen1Pokemon } from '$lib/data/pokemon-red-blue-yellow/data';

	let { pokemon, pokemonList, moves }: { pokemon: Gen1Pokemon; pokemonList: Gen1Pokemon[]; moves: Gen1Move[] } =
		$props();

	async function open() {
		const { default: PokemonModal } = await import('./PokemonModal.svelte');
		openModal(PokemonModal, { pokemon, pokemonList, moves });
	}
</script>

<Cell image={pokemon.sprite} imageAlt={pokemon.name} thumbnailClass="[image-rendering:pixelated]" onClick={open}>
	<div><span class="opacity-50">#{String(pokemon.id).padStart(3, '0')}</span> {pokemon.name}</div>
</Cell>
