<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import { loadPokemons } from '$lib/data/pmd-blue/data';

	import { type Pokemon, computeLevel100Stats } from '$lib/utils/pmd-blue.utils';
	import PokemonCell from '$lib/components/pmd-blue/PokemonCell.svelte';

	let pokemons = $state<Pokemon[]>([]);

	onMount(async () => {
		pokemons = await loadPokemons();
	});

	const rows = $derived(
		pokemons.map((p) => {
			const lvl100 = computeLevel100Stats(p);

			const lvl1_total = p.base_hp + p.base_atk + p.base_def + p.base_sp_atk + p.base_sp_def;

			const lvl100_total = lvl100.hp + lvl100.atk + lvl100.def + lvl100.sp_atk + lvl100.sp_def;

			return {
				...p,

				lvl1_hp: p.base_hp,
				lvl1_atk: p.base_atk,
				lvl1_def: p.base_def,
				lvl1_sp_atk: p.base_sp_atk,
				lvl1_sp_def: p.base_sp_def,

				lvl100_hp: lvl100.hp,
				lvl100_atk: lvl100.atk,
				lvl100_def: lvl100.def,
				lvl100_sp_atk: lvl100.sp_atk,
				lvl100_sp_def: lvl100.sp_def,

				lvl1_total,
				lvl100_total
			};
		})
	);

	const columns: Column[] = [
		{
			key: 'name',
			label: 'Name',
			searchValue: (p) => String(p.name ?? ''),
			renderComponent: (p) => ({
				component: PokemonCell,
				props: { pokemon: p }
			})
		},

		{ key: 'lvl1_hp', label: 'HP (1)' },
		{ key: 'lvl1_atk', label: 'Atk (1)' },
		{ key: 'lvl1_def', label: 'Def (1)' },
		{ key: 'lvl1_sp_atk', label: 'SpA (1)' },
		{ key: 'lvl1_sp_def', label: 'SpD (1)' },
		{ key: 'lvl1_total', label: 'Total (1)' },

		{ key: 'lvl100_hp', label: 'HP (100)' },
		{ key: 'lvl100_atk', label: 'Atk (100)' },
		{ key: 'lvl100_def', label: 'Def (100)' },
		{ key: 'lvl100_sp_atk', label: 'SpA (100)' },
		{ key: 'lvl100_sp_def', label: 'SpD (100)' },
		{ key: 'lvl100_total', label: 'Total (100)' }
	];
</script>

{#if pokemons.length}
	<DataTable {columns} {rows} pageSize={50} />
{:else}
	<p class="text-center opacity-60">Loading Pokemon...</p>
{/if}
