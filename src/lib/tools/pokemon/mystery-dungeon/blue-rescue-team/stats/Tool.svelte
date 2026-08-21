<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';

	import PokemonStats from './components/pokemon-stats.svelte';
	import MoveStats from './components/move-stats.svelte';

	let displayMode = $state<'pokemon-stats' | 'move-stats'>('pokemon-stats');
</script>

<div class="flex gap-2">
	<Button active={displayMode === 'pokemon-stats'} onClick={() => (displayMode = 'pokemon-stats')}>Pokémon</Button>

	<Button active={displayMode === 'move-stats'} onClick={() => (displayMode = 'move-stats')}>Moves</Button>
</div>

{#if displayMode === 'pokemon-stats'}
	<PokemonStats />
{:else if displayMode === 'move-stats'}
	<MoveStats />
{/if}
