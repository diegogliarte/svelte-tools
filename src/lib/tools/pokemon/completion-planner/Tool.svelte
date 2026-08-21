<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import Button from '$lib/components/ui/button.svelte';
	import SelectInput from '$lib/components/ui/select-input.svelte';
	import { createLocalStorageState } from '$lib/states/local-storage.svelte';
	import { gameOptions, loadGeneration, type GenerationData } from '$lib/data/pokemon-main-series/data';
	import { getPokemonTypeColor } from '$lib/utils/pokemon.utils';
	const _state = createLocalStorageState({ caught: {} as Record<string, Record<string, boolean>> });
	let game = $state('red'),
		view = $state<'all' | 'missing' | 'caught'>('all'),
		data = $state<GenerationData | null>(null);
	const generation = $derived(gameOptions.find((entry) => entry.value === game)?.generation ?? 1);
	const caught = $derived(_state.caught[game] ?? {});
	$effect(() => {
		const selected = generation;
		data = null;
		loadGeneration(selected).then((value) => {
			if (generation === selected) data = value;
		});
	});
	const available = $derived.by(() => {
		const result = new SvelteSet(
			(data?.encounters ?? []).filter((entry) => entry.version === game).map((entry) => entry.pokemonId)
		);
		const edges = (data?.pokemon ?? []).flatMap((entry) => entry.evolutions);
		let changed = true;
		while (changed) {
			changed = false;
			for (const edge of edges)
				if (result.has(edge.fromId) && !result.has(edge.toId)) {
					result.add(edge.toId);
					changed = true;
				}
		}
		return result;
	});
	const count = $derived((data?.pokemon ?? []).filter((entry) => caught[entry.id]).length);
	const visible = $derived(
		(data?.pokemon ?? []).filter((entry) => view === 'all' || (view === 'caught') === Boolean(caught[entry.id]))
	);
	function toggle(id: number) {
		_state.caught = { ..._state.caught, [game]: { ...caught, [id]: !caught[id] } };
	}
</script>

<div class="mb-4 flex flex-wrap items-end justify-between gap-4">
	<div class="flex flex-wrap items-end gap-4">
		<SelectInput
			label="Game"
			bind:value={game}
			allowEmpty={false}
			persist={false}
			options={gameOptions.map(({ value, label }) => ({ value, label }))}
		/>
		<div class="flex gap-2">
			<Button active={view === 'all'} onClick={() => (view = 'all')}>All</Button><Button
				active={view === 'missing'}
				onClick={() => (view = 'missing')}>Missing</Button
			><Button active={view === 'caught'} onClick={() => (view = 'caught')}>Caught</Button>
		</div>
	</div>
	<div><b class="text-accent">{count}</b> / {data?.pokemon.length ?? 0}</div>
</div>
{#if data}<div class="mb-3 h-1 bg-text/15">
		<div class="h-full bg-accent" style={`width:${(count / data.pokemon.length) * 100}%`}></div>
	</div>
	<div class="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1">
		{#each visible as entry (entry.id)}{@const owned = Boolean(caught[entry.id])}<button
				type="button"
				title={available.has(entry.id) ? entry.name : `${entry.name} requires trading or transfer`}
				aria-pressed={owned}
				class="flex min-h-24 cursor-pointer flex-col items-center justify-center border p-1 text-xxs transition {owned
					? 'border-accent bg-accent-dark text-accent'
					: 'border-text/15 hover:border-accent'} {available.has(entry.id) ? '' : 'opacity-15'}"
				onclick={() => toggle(entry.id)}
				><span class="h-16 w-16 {getPokemonTypeColor(entry.types[0])}"
					><img src={entry.sprite} alt="" class="h-full w-full object-contain {owned ? '' : 'grayscale'}" /></span
				><span class="max-w-full truncate">{entry.name}</span></button
			>{/each}
	</div>{:else}<p class="text-center opacity-60">Loading game…</p>{/if}
