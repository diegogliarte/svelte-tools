<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import SelectInput from '$lib/components/ui/select-input.svelte';
	import CheckboxChipGroup from '$lib/components/ui/checkbox-chip-group.svelte';
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import PokemonCell from '$lib/components/pokemon-main-series/PokemonCell.svelte';
	import MoveCell from '$lib/components/pokemon-main-series/MoveCell.svelte';
	import PokemonTypesCell from '$lib/components/pokemon-main-series/PokemonTypesCell.svelte';
	import { addMissingFilterOptions, unique } from '$lib/utils/filters.utils.svelte';
	import {
		generationOptions,
		loadGeneration,
		type GenerationData,
		type MainMove,
		type MainPokemon
	} from '$lib/data/pokemon-main-series/data';

	let generation = $state('1'),
		mode = $state<'pokemon' | 'moves'>('pokemon'),
		data = $state<GenerationData | null>(null);
	let typeFilter = $state<Record<string, boolean>>({}),
		moveTypeFilter = $state<Record<string, boolean>>({}),
		categoryFilter = $state<Record<string, boolean>>({});
	const types = $derived(data ? unique(data.pokemon.flatMap((entry) => entry.types)).sort() : []);
	const moveTypes = $derived(data ? unique(data.moves.map((entry) => entry.type)).sort() : []);
	const categories = $derived(data ? unique(data.moves.map((entry) => entry.category)).sort() : []);
	$effect(() => {
		addMissingFilterOptions(typeFilter, types);
		addMissingFilterOptions(moveTypeFilter, moveTypes);
		addMissingFilterOptions(categoryFilter, categories);
	});
	$effect(() => {
		const selected = Number(generation);
		data = null;
		loadGeneration(selected).then((value) => {
			if (Number(generation) === selected) data = value;
		});
	});
	const selected = (filter: Record<string, boolean>, options: string[]) => options.filter((key) => filter[key]);
	const pokemonRows = $derived.by(() =>
		(data?.pokemon ?? [])
			.filter(
				(entry) =>
					!selected(typeFilter, types).length || entry.types.some((type) => selected(typeFilter, types).includes(type))
			)
			.map((entry) => ({
				...entry,
				...entry.stats,
				pokemon: entry,
				typeNames: entry.types.join(' / '),
				total: Object.values(entry.stats).reduce((sum, value) => sum + value, 0)
			}))
	);
	const moveRows = $derived(
		(data?.moves ?? []).filter(
			(entry) =>
				(!selected(moveTypeFilter, moveTypes).length || selected(moveTypeFilter, moveTypes).includes(entry.type)) &&
				(!selected(categoryFilter, categories).length || selected(categoryFilter, categories).includes(entry.category))
		)
	);
	type PokemonRow = MainPokemon & Record<string, unknown> & { pokemon: MainPokemon; typeNames: string; total: number };
	const pokemonColumns = $derived.by<Column<PokemonRow>[]>(() => {
		if (!data) return [];
		const statLabels: Record<string, string> = {
			hp: 'HP',
			attack: 'Attack',
			defense: 'Defense',
			special: 'Special',
			specialAttack: 'Sp. Atk',
			specialDefense: 'Sp. Def',
			speed: 'Speed'
		};
		return [
			{
				key: 'pokemon',
				label: 'Pokémon',
				width: '250px',
				searchValue: (row) => `${row.id} ${row.name}`,
				renderComponent: (row) => ({ component: PokemonCell, props: { pokemon: row.pokemon, data } })
			},
			{
				key: 'typeNames',
				label: 'Type',
				width: '150px',
				renderComponent: (row) => ({ component: PokemonTypesCell, props: { types: row.types } })
			},
			...Object.keys(data.pokemon[0]?.stats ?? {}).map(
				(key) => ({ key, label: statLabels[key] ?? key }) as Column<PokemonRow>
			),
			{ key: 'total', label: 'Total' }
		];
	});
	const moveColumns: Column<MainMove>[] = [
		{
			key: 'name',
			label: 'Move',
			width: '240px',
			renderComponent: (move) => ({ component: MoveCell, props: { move, data: data! } })
		},
		{ key: 'type', label: 'Type' },
		{ key: 'category', label: 'Category' },
		{ key: 'power', label: 'Power', value: (move) => move.power ?? '—' },
		{ key: 'accuracy', label: 'Accuracy', value: (move) => (move.accuracy == null ? '—' : `${move.accuracy}%`) },
		{ key: 'pp', label: 'PP' },
		{ key: 'target', label: 'Target' }
	];
</script>

<div class="mb-4 flex flex-wrap items-end gap-4">
	<SelectInput
		label="Generation"
		bind:value={generation}
		allowEmpty={false}
		persist={false}
		options={generationOptions}
	/>
	<div class="flex gap-2">
		<Button active={mode === 'pokemon'} onClick={() => (mode = 'pokemon')}>Pokémon</Button><Button
			active={mode === 'moves'}
			onClick={() => (mode = 'moves')}>Moves</Button
		>
	</div>
</div>
{#if !data}<p class="text-center opacity-60">Loading generation…</p>
{:else if mode === 'pokemon'}
	<div class="mb-4"><CheckboxChipGroup label="Type" options={types} bind:checked={typeFilter} /></div>
	<DataTable columns={pokemonColumns} rows={pokemonRows} rowKey={(row) => row.id} />
{:else}
	<div class="mb-4 grid gap-4 lg:grid-cols-2">
		<CheckboxChipGroup label="Type" options={moveTypes} bind:checked={moveTypeFilter} /><CheckboxChipGroup
			label="Category"
			options={categories}
			bind:checked={categoryFilter}
		/>
	</div>
	<DataTable columns={moveColumns} rows={moveRows} rowKey={(move) => move.id} />
{/if}
