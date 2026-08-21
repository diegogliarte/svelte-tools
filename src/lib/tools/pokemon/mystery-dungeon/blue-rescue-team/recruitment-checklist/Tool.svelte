<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { loadPokemons } from '$lib/data/pmd-blue/data';
	import type { Pokemon } from '$lib/utils/pmd-blue.utils';
	import FriendList from './components/friend-list.svelte';
	import RecruitmentChecklist from './components/recruitment-checklist.svelte';

	type DisplayMode = 'checklist' | 'friend-list';

	let displayMode = $state<DisplayMode>('checklist');
	let pokemons = $state<Pokemon[]>([]);

	onMount(async () => {
		pokemons = await loadPokemons();
	});
</script>

{#if pokemons.length}
	<div class="mb-4 flex gap-2">
		<Button active={displayMode === 'checklist'} onClick={() => (displayMode = 'checklist')}>Checklist</Button>
		<Button active={displayMode === 'friend-list'} onClick={() => (displayMode = 'friend-list')}>Friend List</Button>
	</div>

	{#if displayMode === 'checklist'}
		<RecruitmentChecklist {pokemons} />
	{:else}
		<FriendList {pokemons} />
	{/if}
{:else}
	<p class="text-center opacity-60">Loading Pokémon...</p>
{/if}
