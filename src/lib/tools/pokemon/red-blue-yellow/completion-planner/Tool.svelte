<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import Button from '$lib/components/ui/button.svelte';
	import SelectInput from '$lib/components/ui/select-input.svelte';
	import { createLocalStorageState } from '$lib/states/local-storage.svelte';
	import {
		loadGen1Encounters,
		loadGen1Pokemon,
		type Gen1Encounter,
		type Gen1Pokemon
	} from '$lib/data/pokemon-red-blue-yellow/data';

	const _state = createLocalStorageState({ caught: {} as Record<string, boolean> });
	let pokemon = $state<Gen1Pokemon[]>([]);
	let encounters = $state<Gen1Encounter[]>([]);
	let version = $state('all');
	let view = $state<'all' | 'missing' | 'caught'>('all');
	const caughtCount = $derived(pokemon.filter((entry) => _state.caught[entry.id]).length);
	const available = $derived.by(() => {
		const result = new SvelteSet(
			encounters.filter((entry) => version === 'all' || entry.version === version).map((entry) => entry.pokemonId)
		);
		const edges = pokemon.flatMap((entry) => entry.evolutions);
		let changed = true;
		while (changed) {
			changed = false;
			for (const edge of edges) {
				if (result.has(edge.fromId) && !result.has(edge.toId)) {
					result.add(edge.toId);
					changed = true;
				}
			}
		}
		return result;
	});
	const visible = $derived(
		pokemon.filter((entry) => view === 'all' || (view === 'caught') === Boolean(_state.caught[entry.id]))
	);
	function toggle(id: number) {
		_state.caught = { ..._state.caught, [id]: !_state.caught[id] };
	}
	onMount(async () => {
		[pokemon, encounters] = await Promise.all([loadGen1Pokemon(), loadGen1Encounters()]);
	});
</script>

<div class="mb-4 flex flex-wrap items-end justify-between gap-4">
	<div class="flex flex-wrap items-end gap-4">
		<SelectInput
			label="Availability"
			bind:value={version}
			allowEmpty={false}
			persist={false}
			options={[
				{ value: 'all', label: 'All versions' },
				{ value: 'red', label: 'Red' },
				{ value: 'blue', label: 'Blue' },
				{ value: 'yellow', label: 'Yellow' }
			]}
		/>
		<div class="flex gap-2">
			<Button active={view === 'all'} onClick={() => (view = 'all')}>All</Button><Button
				active={view === 'missing'}
				onClick={() => (view = 'missing')}>Missing</Button
			><Button active={view === 'caught'} onClick={() => (view = 'caught')}>Caught</Button>
		</div>
	</div>
	<div><b class="text-accent">{caughtCount}</b> / 151</div>
</div>

<div class="mb-3 h-1 bg-text/15">
	<div class="h-full bg-accent transition-all" style={`width:${(caughtCount / 151) * 100}%`}></div>
</div>
{#if pokemon.length}
	<div class="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1">
		{#each visible as entry (entry.id)}
			{@const caught = Boolean(_state.caught[entry.id])}
			{@const obtainable = version === 'all' || available.has(entry.id)}
			<button
				type="button"
				title={obtainable ? entry.name : `${entry.name} has no ${version} encounter or available pre-evolution`}
				aria-pressed={caught}
				class="relative flex min-h-24 cursor-pointer flex-col items-center justify-center border p-1 text-xxs transition {caught
					? 'border-accent bg-accent-dark text-accent'
					: 'border-text/15 hover:border-accent'} {obtainable ? '' : 'opacity-35'}"
				onclick={() => toggle(entry.id)}
			>
				<img src={entry.sprite} alt="" class="h-14 w-14 [image-rendering:pixelated] {caught ? '' : 'grayscale'}" />
				<span class="max-w-full truncate">{entry.name}</span>
			</button>
		{/each}
	</div>
{:else}<p class="text-center opacity-60">Loading Pokédex…</p>{/if}
