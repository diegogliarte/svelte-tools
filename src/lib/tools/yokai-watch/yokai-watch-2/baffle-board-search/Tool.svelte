<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import QuizCluesCell from '$lib/components/yokai-watch-2/QuizCluesCell.svelte';
	import TextLinesCell from '$lib/components/yokai-watch-2/TextLinesCell.svelte';
	import YokaiCell from '$lib/components/yokai-watch-2/YokaiCell.svelte';
	import { loadBaffleBoards, type BaffleBoard } from '$lib/data/yokai-watch-2/data';
	import { getYokaiSearchText } from '$lib/utils/yokai-watch-2.utils';

	let boards = $state<BaffleBoard[]>([]);
	let loading = $state(true);
	let failed = $state(false);

	const columns: Column<BaffleBoard>[] = [
		{
			key: 'name',
			label: 'Yo-kai',
			width: '260px',
			searchValue: getYokaiSearchText,
			renderComponent: (board) => ({
				component: YokaiCell,
				props: { yokai: board }
			})
		},
		{
			key: 'boardLocation',
			label: 'Board location',
			width: '260px',
			class: 'whitespace-pre-line',
			value: (board) => board.boardLocation.replace(': ', ':\n'),
			searchValue: (board) => board.boardLocation
		},
		{
			key: 'clues',
			label: 'Quiz clues',
			width: '340px',
			searchValue: (board) => board.clues.join(' '),
			renderComponent: (board) => ({
				component: QuizCluesCell,
				props: { clues: board.clues }
			})
		},
		{
			key: 'yokaiLocations',
			label: 'Yo-kai locations',
			width: '360px',
			searchValue: (board) => board.yokaiLocations.join(' '),
			renderComponent: (board) => ({
				component: TextLinesCell,
				props: { lines: board.yokaiLocations }
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
			boards = await loadBaffleBoards();
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
	<DataTable {columns} rows={boards} pageSize={50} rowKey={(board) => board.id} />
{/if}
