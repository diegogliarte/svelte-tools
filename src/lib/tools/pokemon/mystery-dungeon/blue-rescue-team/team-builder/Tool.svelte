<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import SelectInput from '$lib/components/ui/select-input.svelte';
	import PokemonIcon from '$lib/components/pmd-blue/PokemonIcon.svelte';

	import { loadPmdCoreData, type Ability, type Move, type PokemonMoves } from '$lib/data/pmd-blue/data';

	import type { Pokemon } from '$lib/utils/pmd-blue.utils';

	type Option = {
		value: string;
		label: string;
	};

	let pokemons = $state<Pokemon[]>([]);
	let moves = $state<Move[]>([]);
	let pokemonMoves = $state<PokemonMoves[]>([]);
	let abilities = $state<Ability[]>([]);

	onMount(async () => {
		const data = await loadPmdCoreData();
		pokemons = data.pokemons;
		moves = data.moves;
		pokemonMoves = data.pokemonMoves;
		abilities = data.abilities;
	});

	let selectedPokemon = $state('');
	let selectedAbility1 = $state('');
	let selectedAbility2 = $state('');
	let selectedMove1 = $state('');
	let selectedMove2 = $state('');
	let selectedMove3 = $state('');
	let selectedMove4 = $state('');

	const moveById = $derived(new Map(moves.map((m) => [String(m.id), m])));
	const abilityById = $derived(new Map(abilities.map((a) => [String(a.id), a])));
	const pokemonByName = $derived(new Map(pokemons.map((p) => [p.name, p])));
	const pokemonMovesById = $derived(new Map(pokemonMoves.map((p) => [String(p.pokemon_id), p])));

	// ✅ Sketch ID
	const sketchMoveId = $derived(moves.find((m) => m.name === 'Sketch')?.id);
	const sketchMoveIdStr = $derived(sketchMoveId ? String(sketchMoveId) : null);

	const pokemonMoveIds = $derived(
		new Map<string, Set<string>>(
			pokemons.map((pokemon) => {
				const entry = pokemonMovesById.get(String(pokemon.game_id));
				const ids = new SvelteSet<string>();

				for (const move of entry?.levelup_moves ?? []) ids.add(String(move.move_id));
				for (const moveId of entry?.aux_moves ?? []) ids.add(String(moveId));

				return [pokemon.name, ids];
			})
		)
	);

	function sortOptions(options: Option[]) {
		return options.sort((a, b) => a.label.localeCompare(b.label));
	}

	function uniqueOptions(options: Option[]) {
		const seen = new SvelteSet<string>();
		return sortOptions(
			options.filter((opt) => {
				if (!opt.value || seen.has(opt.value)) return false;
				seen.add(opt.value);
				return true;
			})
		);
	}

	function selectedMoves(exclude: number | null = null) {
		return [
			exclude === 1 ? '' : selectedMove1,
			exclude === 2 ? '' : selectedMove2,
			exclude === 3 ? '' : selectedMove3,
			exclude === 4 ? '' : selectedMove4
		].filter(Boolean);
	}

	// ✅ Detect sketch usage context
	const isSketchSelected = $derived.by(() =>
		[selectedMove1, selectedMove2, selectedMove3, selectedMove4].includes(sketchMoveIdStr ?? '')
	);

	const isSmeargleSelected = $derived.by(() => selectedPokemon === 'Smeargle');

	function matchesPokemon(
		pokemon: Pokemon,
		{
			pokemonName = selectedPokemon,
			ability1 = selectedAbility1,
			ability2 = selectedAbility2,
			moveIds = selectedMoves()
		}: {
			pokemonName?: string;
			ability1?: string;
			ability2?: string;
			moveIds?: string[];
		} = {}
	) {
		if (pokemonName && pokemon.name !== pokemonName) return false;

		if (ability1 && String(pokemon.ability_1_id ?? '') !== ability1) return false;
		if (ability2 && String(pokemon.ability_2_id ?? '') !== ability2) return false;

		const moveSet = pokemonMoveIds.get(pokemon.name) ?? new Set<string>();

		// ✅ Sketch = wildcard (FILTERING ONLY)
		if (sketchMoveIdStr && moveSet.has(sketchMoveIdStr)) {
			return true;
		}

		return moveIds.every((id) => moveSet.has(id));
	}

	function filteredPokemons(args?: { pokemonName?: string; ability1?: string; ability2?: string; moveIds?: string[] }) {
		return pokemons.filter((pokemon) => matchesPokemon(pokemon, args));
	}

	const pokemonOptions = $derived.by(() =>
		uniqueOptions(
			filteredPokemons({
				pokemonName: '',
				ability1: selectedAbility1,
				ability2: selectedAbility2,
				moveIds: selectedMoves()
			}).map((p) => ({ value: p.name, label: p.name }))
		)
	);

	const ability1Options = $derived.by(() =>
		uniqueOptions(
			filteredPokemons({
				pokemonName: selectedPokemon,
				ability1: '',
				ability2: selectedAbility2,
				moveIds: selectedMoves()
			})
				.map((p) => {
					const id = String(p.ability_1_id ?? '');
					const ability = abilityById.get(id);
					return ability ? { value: id, label: ability.name } : null;
				})
				.filter(Boolean) as Option[]
		)
	);

	const ability2Options = $derived.by(() =>
		uniqueOptions(
			filteredPokemons({
				pokemonName: selectedPokemon,
				ability1: selectedAbility1,
				ability2: '',
				moveIds: selectedMoves()
			})
				.map((p) => {
					const id = String(p.ability_2_id ?? '');
					const ability = abilityById.get(id);
					return ability ? { value: id, label: ability.name } : null;
				})
				.filter(Boolean) as Option[]
		)
	);

	function includeCurrentOption(options: Option[], currentValue: string, getLabel: (value: string) => string | null) {
		if (!currentValue) return options;
		if (options.some((o) => o.value === currentValue)) return options;

		const label = getLabel(currentValue);
		return label ? uniqueOptions([...options, { value: currentValue, label }]) : options;
	}

	function moveTargetIcon(target?: string | null) {
		if (!target) return '';
		const t = target.toLowerCase();
		if (t.includes('all in room')) return '■';
		if (t.includes('foes in room')) return '⊡';
		if (t.includes('line of sight')) return '➜';
		return '';
	}

	function moveHitModeIcon(mode?: string | null) {
		return mode && mode !== 'Single' ? '✹' : '';
	}

	function formatHitMode(move?: Move) {
		if (!move?.hit_count_mode || move.hit_count_mode === 'Single') return '';
		return move.hit_count_mode;
	}

	function moveOptions(slot: number) {
		const usedElsewhere = new Set(selectedMoves(slot));
		const options: Option[] = [];

		for (const pokemon of filteredPokemons({
			pokemonName: selectedPokemon,
			ability1: selectedAbility1,
			ability2: selectedAbility2,
			moveIds: selectedMoves(slot)
		})) {
			const moveSet = pokemonMoveIds.get(pokemon.name) ?? new Set<string>();
			const hasSketch = sketchMoveIdStr && moveSet.has(sketchMoveIdStr);

			const moveIdsToUse = isSmeargleSelected && hasSketch ? moves.map((m) => String(m.id)) : moveSet;

			for (const moveId of moveIdsToUse) {
				if (usedElsewhere.has(moveId)) continue;

				const move = moveById.get(moveId);
				if (!move) continue;

				const targetIcon = moveTargetIcon(move.targets);
				const hitModeIcon = moveHitModeIcon(move.hit_count_mode);

				const isSketchSource = hasSketch && !moveSet.has(moveId) && (isSketchSelected || isSmeargleSelected);

				const sketchIcon = isSketchSource ? '✎' : '';

				options.push({
					value: moveId,
					label: `${move.name}${sketchIcon ? ` ${sketchIcon}` : ''} ${targetIcon ? ` ${targetIcon}` : ''}${
						hitModeIcon ? ` ${hitModeIcon}` : ''
					}`
				});
			}
		}

		const currentValue =
			slot === 1 ? selectedMove1 : slot === 2 ? selectedMove2 : slot === 3 ? selectedMove3 : selectedMove4;

		return includeCurrentOption(uniqueOptions(options), currentValue, (value) => moveById.get(value)?.name ?? null);
	}

	const move1Options = $derived.by(() => moveOptions(1));
	const move2Options = $derived.by(() => moveOptions(2));
	const move3Options = $derived.by(() => moveOptions(3));
	const move4Options = $derived.by(() => moveOptions(4));

	const selectedPokemonData = $derived.by(() => pokemonByName.get(selectedPokemon));
	const selectedAbility1Data = $derived.by(() => abilityById.get(selectedAbility1));
	const selectedAbility2Data = $derived.by(() => abilityById.get(selectedAbility2));
	const selectedMove1Data = $derived.by(() => moveById.get(selectedMove1));
	const selectedMove2Data = $derived.by(() => moveById.get(selectedMove2));
	const selectedMove3Data = $derived.by(() => moveById.get(selectedMove3));
	const selectedMove4Data = $derived.by(() => moveById.get(selectedMove4));
</script>

{#snippet detailCard(description?: string)}
	<div class="text-xs opacity-80">
		{description}
	</div>
{/snippet}

{#snippet moveCard(move: Move)}
	<div class="text-xs opacity-80">
		{move.type ?? '—'} · Power {move.power ?? '—'} · {move.maxPP ?? '—'}PP · {move.targets ?? '—'}
		{#if formatHitMode(move)}
			· {formatHitMode(move)}
		{/if}
	</div>
{/snippet}

{#if pokemons.length && moves.length}
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<div class="flex flex-col gap-4">
			<div class="flex flex-row items-center gap-2">
				<div class="flex aspect-square h-full items-center justify-center text-center">
					{#if selectedPokemonData}
						<PokemonIcon pokemon={selectedPokemonData} />
					{:else}
						<div class="text-xs">No Data</div>
					{/if}
				</div>

				<div class="w-full">
					<SelectInput options={pokemonOptions} placeholder="Pokémon" allowEmpty={true} bind:value={selectedPokemon} />
				</div>
			</div>

			<div class="flex flex-col gap-1">
				<SelectInput
					options={ability1Options}
					placeholder="Ability 1"
					allowEmpty={true}
					bind:value={selectedAbility1}
				/>

				{#if selectedAbility1Data}
					{@render detailCard(selectedAbility1Data.description)}
				{/if}
			</div>

			<div class="flex flex-col gap-1">
				<SelectInput
					options={ability2Options}
					placeholder="Ability 2"
					allowEmpty={true}
					bind:value={selectedAbility2}
				/>

				{#if selectedAbility2Data}
					{@render detailCard(selectedAbility2Data.description)}
				{/if}
			</div>
		</div>

		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<SelectInput options={move1Options} placeholder="Move 1" allowEmpty={true} bind:value={selectedMove1} />
				{#if selectedMove1Data}
					{@render moveCard(selectedMove1Data)}
				{/if}
			</div>

			<div class="flex flex-col gap-2">
				<SelectInput options={move2Options} placeholder="Move 2" allowEmpty={true} bind:value={selectedMove2} />
				{#if selectedMove2Data}
					{@render moveCard(selectedMove2Data)}
				{/if}
			</div>

			<div class="flex flex-col gap-2">
				<SelectInput options={move3Options} placeholder="Move 3" allowEmpty={true} bind:value={selectedMove3} />
				{#if selectedMove3Data}
					{@render moveCard(selectedMove3Data)}
				{/if}
			</div>

			<div class="flex flex-col gap-2">
				<SelectInput options={move4Options} placeholder="Move 4" allowEmpty={true} bind:value={selectedMove4} />
				{#if selectedMove4Data}
					{@render moveCard(selectedMove4Data)}
				{/if}
			</div>
		</div>
	</div>
{:else}
	<p class="text-center opacity-60">Loading PokÃ©mon...</p>
{/if}
