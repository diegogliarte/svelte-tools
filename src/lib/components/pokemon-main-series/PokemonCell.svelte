<script lang="ts">
	import Cell from '$lib/components/ui/cell.svelte';
	import { openModal } from '$lib/states/modal.svelte';
	import type { GenerationData, MainPokemon } from '$lib/data/pokemon-main-series/data';
	import { getPokemonTypeColor } from '$lib/utils/pokemon.utils';
	let { pokemon, data }: { pokemon: MainPokemon; data: GenerationData } = $props();
	async function open() {
		const { default: PokemonModal } = await import('./PokemonModal.svelte');
		openModal(PokemonModal, { pokemon, data });
	}
</script>

<Cell
	image={pokemon.sprite}
	imageAlt={pokemon.name}
	thumbnailClass={`${getPokemonTypeColor(pokemon.types[0])} [image-rendering:pixelated]`}
	onClick={open}><div><span class="opacity-50">#{String(pokemon.id).padStart(3, '0')}</span> {pokemon.name}</div></Cell
>
