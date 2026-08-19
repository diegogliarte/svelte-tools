<script lang="ts">
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import CheckboxChipGroup from '$lib/components/ui/checkbox-chip-group.svelte';
	import PokemonCell from '$lib/components/pokemon-red-blue-yellow/PokemonCell.svelte';
	import PokemonTypesCell from '$lib/components/pokemon-red-blue-yellow/PokemonTypesCell.svelte';
	import type { Gen1Move, Gen1Pokemon } from '$lib/data/pokemon-red-blue-yellow/data';
	import { addMissingFilterOptions, unique } from '$lib/utils/filters.utils.svelte';

	let { pokemon, moves }: { pokemon: Gen1Pokemon[]; moves: Gen1Move[] } = $props();
	type Row = Gen1Pokemon & Gen1Pokemon['stats'] & { pokemon: Gen1Pokemon; total: number; typeNames: string };
	let typeFilter = $state<Record<string, boolean>>({});
	const types = $derived(unique(pokemon.flatMap((entry) => entry.types)).sort());
	$effect(() => addMissingFilterOptions(typeFilter, types));
	const selectedTypes = $derived(Object.keys(typeFilter).filter((type) => typeFilter[type]));
	const rows = $derived(
		pokemon
			.filter((entry) => !selectedTypes.length || entry.types.some((type) => selectedTypes.includes(type)))
			.map((entry) => ({
				...entry,
				...entry.stats,
				pokemon: entry,
				total: Object.values(entry.stats).reduce((sum, value) => sum + value, 0),
				typeNames: entry.types.join(' / ')
			}))
	);

	const columns: Column<Row>[] = [
		{
			key: 'pokemon',
			label: 'Pokémon',
			width: '250px',
			searchValue: (row) => `${row.id} ${row.name}`,
			renderComponent: (row) => ({
				component: PokemonCell,
				props: { pokemon: row.pokemon, pokemonList: pokemon, moves }
			})
		},
		{
			key: 'typeNames',
			label: 'Type',
			width: '150px',
			renderComponent: (row) => ({ component: PokemonTypesCell, props: { types: row.types } })
		},
		{ key: 'hp', label: 'HP' },
		{ key: 'attack', label: 'Attack' },
		{ key: 'defense', label: 'Defense' },
		{ key: 'special', label: 'Special' },
		{ key: 'speed', label: 'Speed' },
		{ key: 'total', label: 'Total' }
	];
</script>

<div class="mb-4"><CheckboxChipGroup label="Type" options={types} bind:checked={typeFilter} /></div>
<DataTable {columns} {rows} rowKey={(row) => row.id} />
