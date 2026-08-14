<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import FavouriteFoodCell from '$lib/components/yokai-watch-2/FavouriteFoodCell.svelte';
	import QuizCluesCell from '$lib/components/yokai-watch-2/QuizCluesCell.svelte';
	import TextLinesCell from '$lib/components/yokai-watch-2/TextLinesCell.svelte';
	import YokaiCell from '$lib/components/yokai-watch-2/YokaiCell.svelte';
	import { loadYokaiWatch2Data, type BaffleBoard, type Yokai } from '$lib/data/yokai-watch-2/data';
	import { getYokaiSearchText } from '$lib/utils/yokai-watch-2.utils';

	type BaffleBoardRow = BaffleBoard & {
		yokai: Yokai;
		yokaiLocations: string[];
		favouriteFood: string;
	};

	let rows = $state<BaffleBoardRow[]>([]);
	let loading = $state(true);
	let failed = $state(false);

	const columns: Column<BaffleBoardRow>[] = [
		{
			key: 'yokai',
			label: 'Yo-kai',
			width: '260px',
			searchValue: (row) => getYokaiSearchText(row.yokai),
			renderComponent: (row) => ({
				component: YokaiCell,
				props: { yokai: row.yokai }
			})
		},
		{
			key: 'boardLocation',
			label: 'Board location',
			width: '260px',
			class: 'whitespace-pre-line',
			value: (row) => row.boardLocation.replace(': ', ':\n'),
			searchValue: (row) => row.boardLocation
		},
		{
			key: 'clues',
			label: 'Quiz clues',
			width: '340px',
			searchValue: (row) => row.clues.join(' '),
			renderComponent: (row) => ({
				component: QuizCluesCell,
				props: { clues: row.clues }
			})
		},
		{
			key: 'yokaiLocations',
			label: 'Yo-kai locations',
			width: '360px',
			searchValue: (row) => row.yokaiLocations.join(' '),
			renderComponent: (row) => ({
				component: TextLinesCell,
				props: { lines: row.yokaiLocations }
			})
		},
		{
			key: 'favouriteFood',
			label: 'Favourite food',
			width: '180px',
			renderComponent: (row) => ({
				component: FavouriteFoodCell,
				props: { food: row.favouriteFood }
			})
		},
		{
			key: 'effect',
			label: 'Board effect',
			width: '280px'
		}
	];

	onMount(async () => {
		try {
			const data = await loadYokaiWatch2Data();
			const yokaiById = new Map(data.yokais.map((yokai) => [yokai.id, yokai]));

			rows = data.baffleBoards.flatMap((board) => {
				const yokai = yokaiById.get(board.yokaiId);
				return yokai
					? [
							{
								...board,
								yokai,
								yokaiLocations: yokai.locations,
								favouriteFood: yokai.favouriteFood
							}
						]
					: [];
			});
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<p class="text-center opacity-60">Loading Baffle Boards…</p>
{:else if failed}
	<p class="text-center text-red-500">Failed to load Baffle Board data.</p>
{:else}
	<DataTable {columns} {rows} pageSize={50} rowKey={(row) => row.id} />
{/if}
