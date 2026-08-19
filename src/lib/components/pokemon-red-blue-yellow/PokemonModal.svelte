<script lang="ts">
	import { onMount } from 'svelte';
	import Modal from '$lib/components/ui/modal.svelte';
	import ModalPortrait from '$lib/components/ui/modal-portrait.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import TypeBadge from './TypeBadge.svelte';
	import {
		loadGen1Encounters,
		type Gen1Encounter,
		type Gen1Move,
		type Gen1Pokemon,
		type LearnableMove
	} from '$lib/data/pokemon-red-blue-yellow/data';
	import { openModal } from '$lib/states/modal.svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';

	let {
		pokemon,
		pokemonList,
		moves,
		onClose
	}: { pokemon: Gen1Pokemon; pokemonList: Gen1Pokemon[]; moves: Gen1Move[]; onClose?: () => void } = $props();
	let version = $state<'red-blue' | 'yellow'>('red-blue');
	let encounters = $state<Gen1Encounter[]>([]);
	const byId = $derived(new SvelteMap(pokemonList.map((entry) => [entry.id, entry])));
	const moveByName = $derived(new SvelteMap(moves.map((move) => [move.name, move])));
	const evolutionPaths = $derived.by(() => {
		const edgeMap = new SvelteMap<string, Gen1Pokemon['evolutions'][number]>();
		for (const entry of pokemonList)
			for (const edge of entry.evolutions) edgeMap.set(`${edge.fromId}-${edge.toId}`, edge);
		const edges = [...edgeMap.values()];
		const connected = new SvelteSet([pokemon.id]);
		let changed = true;
		while (changed) {
			changed = false;
			for (const edge of edges)
				if (connected.has(edge.fromId) || connected.has(edge.toId)) {
					if (!connected.has(edge.fromId)) {
						connected.add(edge.fromId);
						changed = true;
					}
					if (!connected.has(edge.toId)) {
						connected.add(edge.toId);
						changed = true;
					}
				}
		}
		const paths: { pokemon: Gen1Pokemon; method?: string }[][] = [];
		const roots = [...connected].filter((id) => !edges.some((edge) => connected.has(edge.fromId) && edge.toId === id));
		function walk(id: number, path: { pokemon: Gen1Pokemon; method?: string }[], method?: string) {
			const entry = byId.get(id);
			if (!entry) return;
			const nextPath = [...path, { pokemon: entry, method }];
			const next = edges.filter((edge) => edge.fromId === id && connected.has(edge.toId));
			if (!next.length) {
				paths.push(nextPath);
				return;
			}
			for (const edge of next) walk(edge.toId, nextPath, edge.method);
		}
		for (const root of roots) walk(root, []);
		return paths;
	});
	const groups = $derived.by(() => {
		const result = new SvelteMap<string, LearnableMove[]>();
		for (const move of pokemon.learnset[version]) result.set(move.method, [...(result.get(move.method) ?? []), move]);
		return [...result];
	});
	const locations = $derived.by(() => {
		const grouped = new SvelteMap<string, { encounter: Gen1Encounter; versions: SvelteSet<string> }>();
		for (const encounter of encounters.filter((entry) => entry.pokemonId === pokemon.id)) {
			const key = `${encounter.location}-${encounter.method}-${encounter.minLevel}-${encounter.maxLevel}-${encounter.chance}`;
			const current = grouped.get(key);
			if (current) current.versions.add(encounter.version);
			else grouped.set(key, { encounter, versions: new SvelteSet([encounter.version]) });
		}
		return [...grouped.values()].sort((a, b) => a.encounter.location.localeCompare(b.encounter.location));
	});
	const evolvesFrom = $derived.by(() => {
		const entries = new SvelteMap<number, { pokemon: Gen1Pokemon; method: string }>();
		for (const path of evolutionPaths) {
			const index = path.findIndex((entry) => entry.pokemon.id === pokemon.id);
			if (index > 0) {
				entries.set(path[index - 1].pokemon.id, {
					pokemon: path[index - 1].pokemon,
					method: path[index].method ?? 'Evolve'
				});
			}
		}
		return [...entries.values()];
	});

	onMount(async () => {
		encounters = await loadGen1Encounters();
	});

	async function openMove(name: string) {
		const move = moveByName.get(name);
		if (!move) return;
		const { default: MoveModal } = await import('./MoveModal.svelte');
		openModal(MoveModal, { move, pokemonList, moves });
	}

	async function openPokemon(target: Gen1Pokemon) {
		const { default: PokemonModal } = await import('./PokemonModal.svelte');
		openModal(PokemonModal, { pokemon: target, pokemonList, moves });
	}
</script>

<Modal title={`#${String(pokemon.id).padStart(3, '0')} ${pokemon.name}`} {onClose}>
	<div class="mb-5 flex gap-4">
		<ModalPortrait src={pokemon.sprite} alt={pokemon.name} />
		<div class="space-y-2 text-sm">
			<div class="flex gap-1">
				{#each pokemon.types as type (type)}<TypeBadge {type} />{/each}
			</div>
			<div>{pokemon.genus}</div>
			<div>Catch rate: {pokemon.captureRate} · Growth: {pokemon.growthRate}</div>
			<p class="max-w-xl opacity-70">{pokemon.description}</p>
		</div>
	</div>

	<h3 class="mb-2 font-bold">Base stats</h3>
	<div class="mb-5 grid grid-cols-3 gap-2 text-sm sm:grid-cols-6">
		{#each Object.entries(pokemon.stats) as [name, value] (name)}
			<div><span class="text-xs capitalize opacity-60">{name}:</span> <b>{value}</b></div>
		{/each}
		<div>
			<span class="text-xs opacity-60">Total:</span>
			<b>{Object.values(pokemon.stats).reduce((sum, value) => sum + value, 0)}</b>
		</div>
	</div>

	{#if evolutionPaths.some((path) => path.length > 1)}
		<h3 class="mb-2 font-bold">Evolutions</h3>
		<div class="mb-5 flex flex-col items-center gap-3 text-xs">
			{#each evolutionPaths as path, pathIndex (pathIndex)}
				<div class="flex items-center justify-center gap-2">
					{#each path as entry, index (entry.pokemon.id)}
						{#if index}<div class="max-w-24 text-center opacity-70">→<br />{entry.method}</div>{/if}
						<button
							type="button"
							class="w-16 cursor-pointer text-center hover:text-accent"
							onclick={() => openPokemon(entry.pokemon)}
						>
							<img
								src={entry.pokemon.sprite}
								alt={entry.pokemon.name}
								class="h-16 w-16 border border-transparent [image-rendering:pixelated] hover:border-accent"
							/>
							<span class={entry.pokemon.id === pokemon.id ? 'font-bold text-accent' : ''}>{entry.pokemon.name}</span>
						</button>
					{/each}
				</div>
			{/each}
		</div>
	{/if}

	{#if locations.length || evolvesFrom.length}
		<h3 class="mb-2 font-bold">Locations</h3>
		<div class="mb-5 max-h-44 overflow-auto text-xs">
			{#each evolvesFrom as evolution (evolution.pokemon.id)}
				<div class="grid grid-cols-[1fr_auto] gap-3 border-b border-text/15 py-1">
					<span>Evolve {evolution.pokemon.name}</span>
					<span class="opacity-60">{evolution.method}</span>
				</div>
			{/each}
			{#each locations as location (`${location.encounter.location}-${location.encounter.method}-${[...location.versions].join()}`)}
				<div class="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-text/15 py-1">
					<span>{location.encounter.location}</span>
					<span class="opacity-60"
						>{[...location.versions].map((entry) => entry.charAt(0).toUpperCase() + entry.slice(1)).join(' / ')}</span
					>
					<span>{location.encounter.method}</span>
					<span
						>Lv. {location.encounter.minLevel}{location.encounter.maxLevel !== location.encounter.minLevel
							? `–${location.encounter.maxLevel}`
							: ''} · {location.encounter.chance}%</span
					>
				</div>
			{/each}
		</div>
	{/if}

	<div class="mb-3 flex items-center gap-2">
		<h3 class="mr-2 font-bold">Learnable moves</h3>
		<Button active={version === 'red-blue'} onClick={() => (version = 'red-blue')}>Red / Blue</Button>
		<Button active={version === 'yellow'} onClick={() => (version = 'yellow')}>Yellow</Button>
	</div>
	<div class="grid gap-4 sm:grid-cols-2">
		{#each groups as [method, moves] (method)}
			<div>
				<h4 class="mb-1 text-sm text-accent">{method}</h4>
				<div class="flex flex-wrap gap-1">
					{#each moves as move (`${move.name}-${move.level ?? 0}`)}
						<button
							type="button"
							class="w-full cursor-pointer text-left text-xs hover:text-accent"
							onclick={() => openMove(move.name)}>{move.level ? `Lv. ${move.level}: ` : ''}{move.name}</button
						>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</Modal>
