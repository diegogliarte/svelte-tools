<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { loadGen1Data, type Gen1Move, type Gen1Pokemon } from '$lib/data/pokemon-red-blue-yellow/data';
	import PokemonStats from './components/pokemon-stats.svelte';
	import MoveStats from './components/move-stats.svelte';

	let pokemon = $state<Gen1Pokemon[]>([]);
	let moves = $state<Gen1Move[]>([]);
	let displayMode = $state<'pokemon' | 'moves'>('pokemon');
	let failed = $state(false);
	onMount(async () => {
		try {
			({ pokemon, moves } = await loadGen1Data());
		} catch {
			failed = true;
		}
	});
</script>

<div class="mb-4 flex gap-2">
	<Button active={displayMode === 'pokemon'} onClick={() => (displayMode = 'pokemon')}>Pokémon</Button>
	<Button active={displayMode === 'moves'} onClick={() => (displayMode = 'moves')}>Moves</Button>
</div>
{#if failed}<p class="text-center text-red-500">Failed to load Pokémon data.</p>
{:else if !pokemon.length}<p class="text-center opacity-60">Loading Pokémon…</p>
{:else if displayMode === 'pokemon'}<PokemonStats {pokemon} {moves} />
{:else}<MoveStats {pokemon} {moves} />{/if}
