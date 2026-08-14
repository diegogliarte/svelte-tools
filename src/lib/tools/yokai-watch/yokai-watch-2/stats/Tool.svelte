<script lang="ts">
	import { onMount } from 'svelte';
	import CheckboxChipGroup from '$lib/components/ui/checkbox-chip-group.svelte';
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import FavouriteFoodCell from '$lib/components/yokai-watch-2/FavouriteFoodCell.svelte';
	import YokaiCell from '$lib/components/yokai-watch-2/YokaiCell.svelte';
	import { loadYokaiWatch2Data, type Yokai } from '$lib/data/yokai-watch-2/data';
	import { addMissingFilterOptions, unique } from '$lib/utils/filters.utils.svelte';
	import { getYokaiSearchText } from '$lib/utils/yokai-watch-2.utils';

	type StatsRow = Yokai & {
		yokai: Yokai;
		HP: number | null;
		STR: number | null;
		SPR: number | null;
		DEF: number | null;
		SPD: number | null;
		TOTAL: number | null;
		baffleBoard: string;
	};

	let yokais = $state<Yokai[]>([]);
	let boardLocationsByYokaiId = $state(new Map<number, string>());
	let failed = $state(false);
	let tribeFilter = $state<Record<string, boolean>>({});
	let rankFilter = $state<Record<string, boolean>>({});
	let elementFilter = $state<Record<string, boolean>>({});

	const tribes = $derived(unique(yokais.map((yokai) => yokai.tribe).filter(Boolean)).sort());
	const ranks = $derived(unique(yokais.map((yokai) => yokai.rank).filter(Boolean)).sort());
	const elements = $derived(unique(yokais.map((yokai) => yokai.element).filter(Boolean)).sort());

	$effect(() => addMissingFilterOptions(tribeFilter, tribes));
	$effect(() => addMissingFilterOptions(rankFilter, ranks));
	$effect(() => addMissingFilterOptions(elementFilter, elements));

	function matchesFilter(filter: Record<string, boolean>, value: string) {
		return !Object.values(filter).some(Boolean) || Boolean(filter[value]);
	}

	function stat(value?: string) {
		if (!value) return null;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}

	const rows = $derived.by<StatsRow[]>(() =>
		yokais
			.filter(
				(yokai) =>
					matchesFilter(tribeFilter, yokai.tribe) &&
					matchesFilter(rankFilter, yokai.rank) &&
					matchesFilter(elementFilter, yokai.element)
			)
			.map((yokai) => {
				const values = {
					HP: stat(yokai.stats.hp),
					STR: stat(yokai.stats.str),
					SPR: stat(yokai.stats.spr),
					DEF: stat(yokai.stats.def),
					SPD: stat(yokai.stats.spd)
				};
				const stats = Object.values(values).filter((value): value is number => value !== null);

				return {
					...yokai,
					yokai,
					...values,
					TOTAL: stats.length ? stats.reduce((total, value) => total + value, 0) : null,
					baffleBoard: boardLocationsByYokaiId.get(yokai.id) ?? ''
				};
			})
	);

	const columns: Column<StatsRow>[] = [
		{
			key: 'yokai',
			label: 'Yo-kai',
			width: '260px',
			searchValue: (row) => getYokaiSearchText(row.yokai),
			renderComponent: (row) => ({ component: YokaiCell, props: { yokai: row.yokai } })
		},
		{ key: 'element', label: 'Element', width: '120px' },
		{
			key: 'favouriteFood',
			label: 'Favourite food',
			width: '180px',
			renderComponent: (row) => ({ component: FavouriteFoodCell, props: { food: row.favouriteFood } })
		},
		{ key: 'HP', label: 'HP', width: '70px', value: (row) => row.HP ?? '—' },
		{ key: 'STR', label: 'STR', width: '70px', value: (row) => row.STR ?? '—' },
		{ key: 'SPR', label: 'SPR', width: '70px', value: (row) => row.SPR ?? '—' },
		{ key: 'DEF', label: 'DEF', width: '70px', value: (row) => row.DEF ?? '—' },
		{ key: 'SPD', label: 'SPD', width: '70px', value: (row) => row.SPD ?? '—' },
		{ key: 'TOTAL', label: 'Total', width: '80px', value: (row) => row.TOTAL ?? '—' },
		{
			key: 'baffleBoard',
			label: 'Baffle Board',
			width: '260px',
			value: (row) => row.baffleBoard || '—',
			class: (row) => (row.baffleBoard ? 'text-accent' : undefined)
		}
	];

	onMount(async () => {
		try {
			const data = await loadYokaiWatch2Data();
			yokais = data.yokais;
			boardLocationsByYokaiId = new Map(data.baffleBoards.map((board) => [board.yokaiId, board.boardLocation]));
		} catch {
			failed = true;
		}
	});
</script>

<div class="grid gap-4 lg:grid-cols-3">
	<CheckboxChipGroup label="Tribe" options={tribes} bind:checked={tribeFilter} />
	<CheckboxChipGroup label="Rank" options={ranks} bind:checked={rankFilter} />
	<CheckboxChipGroup label="Element" options={elements} bind:checked={elementFilter} />
</div>

{#if failed}
	<p class="text-center text-red-500">Failed to load Yo-kai data.</p>
{:else if yokais.length === 0}
	<p class="text-center opacity-60">Loading Yo-kai…</p>
{:else}
	<DataTable {columns} {rows} pageSize={50} rowKey={(row) => row.id} />
{/if}
