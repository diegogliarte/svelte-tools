<script lang="ts">
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import Modal from '$lib/components/ui/modal.svelte';
	import ModalPortrait from '$lib/components/ui/modal-portrait.svelte';
	import SelectInput from '$lib/components/ui/select-input.svelte';
	import TypeBadge from '$lib/components/pokemon/TypeBadge.svelte';
	import { openModal } from '$lib/states/modal.svelte';
	import { gameOptions, type GenerationData, type MainPokemon } from '$lib/data/pokemon-main-series/data';
	import { getPokemonTypeColor } from '$lib/utils/pokemon.utils';
	let { pokemon, data, onClose }: { pokemon: MainPokemon; data: GenerationData; onClose?: () => void } = $props();
	let group = $state(data.versionGroups[0].value);
	const byId = $derived(new SvelteMap(data.pokemon.map((entry) => [entry.id, entry])));
	const moveByName = $derived(new SvelteMap(data.moves.map((move) => [move.name, move])));
	const selectedVersions = $derived(data.versionGroups.find((entry) => entry.value === group)?.versions ?? []);
	const versionLabels = new SvelteMap(gameOptions.map(({ value, label }) => [value, label]));
	const locations = $derived.by(() => {
		const grouped = new SvelteMap<string, (typeof data.encounters)[number] & { versions: string[] }>();
		for (const entry of data.encounters) {
			if (entry.pokemonId !== pokemon.id || !selectedVersions.includes(entry.version)) continue;
			const key = JSON.stringify([entry.location, entry.method, entry.minLevel, entry.maxLevel, entry.chance]);
			const existing = grouped.get(key);
			if (existing) {
				if (!existing.versions.includes(entry.version)) existing.versions.push(entry.version);
			} else grouped.set(key, { ...entry, versions: [entry.version] });
		}
		return [...grouped.entries()].map(([key, entry]) => ({
			...entry,
			key,
			version: entry.versions
				.toSorted((a, b) => selectedVersions.indexOf(a) - selectedVersions.indexOf(b))
				.map((version) => versionLabels.get(version) ?? version)
				.join(' / ')
		}));
	});
	const edges = $derived.by(() => {
		const found = new SvelteMap<string, MainPokemon['evolutions'][number]>();
		for (const entry of data.pokemon)
			for (const edge of entry.evolutions) found.set(`${edge.fromId}-${edge.toId}`, edge);
		return [...found.values()];
	});
	const paths = $derived.by(() => {
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
		const result: { pokemon: MainPokemon; method?: string }[][] = [],
			roots = [...connected].filter((id) => !edges.some((edge) => edge.toId === id && connected.has(edge.fromId)));
		function walk(id: number, path: { pokemon: MainPokemon; method?: string }[], method?: string) {
			const entry = byId.get(id);
			if (!entry) return;
			const nextPath = [...path, { pokemon: entry, method }],
				next = edges.filter((edge) => edge.fromId === id && connected.has(edge.toId));
			if (!next.length) result.push(nextPath);
			else for (const edge of next) walk(edge.toId, nextPath, edge.method);
		}
		for (const root of roots) walk(root, []);
		return result;
	});
	const evolvesFrom = $derived(
		paths.flatMap((path) => {
			const index = path.findIndex((entry) => entry.pokemon.id === pokemon.id);
			return index > 0 ? [path[index - 1]] : [];
		})
	);
	const groups = $derived.by(() => {
		const result = new SvelteMap<string, (typeof pokemon.learnset)[string]>();
		for (const move of pokemon.learnset[group] ?? [])
			result.set(move.method, [...(result.get(move.method) ?? []), move]);
		return [...result];
	});
	async function openPokemon(target: MainPokemon) {
		const { default: PokemonModal } = await import('./PokemonModal.svelte');
		openModal(PokemonModal, { pokemon: target, data });
	}
	async function openMove(name: string) {
		const move = moveByName.get(name);
		if (!move) return;
		const { default: MoveModal } = await import('./MoveModal.svelte');
		openModal(MoveModal, { move, data });
	}
	const labels: Record<string, string> = {
		hp: 'HP',
		attack: 'Attack',
		defense: 'Defense',
		special: 'Special',
		specialAttack: 'Sp. Atk',
		specialDefense: 'Sp. Def',
		speed: 'Speed'
	};
</script>

<Modal title={`#${String(pokemon.id).padStart(3, '0')} ${pokemon.name}`} {onClose}>
	<div class="mb-5 flex gap-4">
		<ModalPortrait
			src={pokemon.sprite}
			alt={pokemon.name}
			backgroundClass={getPokemonTypeColor(pokemon.types[0])}
			imageClass="object-contain [image-rendering:pixelated]"
		/>
		<div class="space-y-2 text-sm">
			<div class="flex gap-1">
				{#each pokemon.types as type (type)}<TypeBadge {type} />{/each}
			</div>
			<div>{pokemon.genus}</div>
			{#if pokemon.abilities.length}<div>Abilities: {pokemon.abilities.join(' · ')}</div>{/if}
			<div>Catch rate: {pokemon.captureRate} · Growth: {pokemon.growthRate}</div>
			<p class="max-w-xl opacity-70">{pokemon.description}</p>
		</div>
	</div>
	<h3 class="mb-2 font-bold">Base stats</h3>
	<div class="mb-5 grid grid-cols-3 gap-2 text-sm sm:grid-cols-7">
		{#each Object.entries(pokemon.stats) as [name, value] (name)}<div>
				<span class="text-xs opacity-60">{labels[name] ?? name}:</span> <b>{value}</b>
			</div>{/each}
		<div>
			<span class="text-xs opacity-60">Total:</span>
			<b>{Object.values(pokemon.stats).reduce((sum, value) => sum + value, 0)}</b>
		</div>
	</div>
	{#if paths.some((path) => path.length > 1)}<h3 class="mb-2 font-bold">Evolutions</h3>
		<div class="mb-5 flex flex-col items-center gap-3 text-xs">
			{#each paths as path, i (i)}<div class="flex items-center gap-2">
					{#each path as entry, index (entry.pokemon.id)}{#if index}<div class="max-w-24 text-center opacity-70">
								→<br />{entry.method}
							</div>{/if}<button
							type="button"
							class="w-16 cursor-pointer hover:text-accent"
							onclick={() => openPokemon(entry.pokemon)}
							><span class="block h-16 w-16 border border-text/35 {getPokemonTypeColor(entry.pokemon.types[0])}"
								><img
									src={entry.pokemon.sprite}
									alt={entry.pokemon.name}
									class="h-full w-full object-contain [image-rendering:pixelated]"
								/></span
							>{entry.pokemon.name}</button
						>{/each}
				</div>{/each}
		</div>{/if}
	<div class="mb-3 w-56">
		<SelectInput
			label="Game group"
			bind:value={group}
			allowEmpty={false}
			persist={false}
			options={data.versionGroups.map(({ value, label }) => ({ value, label }))}
		/>
	</div>
	{#if locations.length || evolvesFrom.length}<h3 class="mb-2 font-bold">Locations</h3>
		<div class="mb-5 max-h-44 overflow-auto text-xs">
			{#each evolvesFrom as entry (entry.pokemon.id)}<div class="border-b border-text/15 py-1">
					Evolve {entry.pokemon.name}
				</div>{/each}{#each locations as location (location.key)}<div
					class="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-text/15 py-1"
				>
					<span>{location.location}</span><span class="opacity-60">{location.version}</span><span
						>{location.method}</span
					><span
						>Lv. {location.minLevel}{location.maxLevel !== location.minLevel ? `–${location.maxLevel}` : ''} · {location.chance}%</span
					>
				</div>{/each}
		</div>{/if}
	<h3 class="mb-2 font-bold">Learnable moves</h3>
	<div class="grid gap-4 sm:grid-cols-2">
		{#each groups as [method, moves] (method)}<div>
				<h4 class="mb-1 text-sm text-accent">{method}</h4>
				{#each moves as move (`${move.name}-${move.level ?? 0}`)}<button
						type="button"
						class="block w-full cursor-pointer text-left text-xs hover:text-accent"
						onclick={() => openMove(move.name)}>{move.level ? `Lv. ${move.level}: ` : ''}{move.name}</button
					>{/each}
			</div>{/each}
	</div>
</Modal>
