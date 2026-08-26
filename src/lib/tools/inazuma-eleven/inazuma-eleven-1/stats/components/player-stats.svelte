<script lang="ts">
	import CheckboxChipGroup from '$lib/components/ui/checkbox-chip-group.svelte';
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import PlayerCell from '$lib/components/inazuma-eleven/inazuma-eleven-1/PlayerCell.svelte';
	import { addMissingFilterOptions, sortNoneLast, unique } from '$lib/utils/filters.utils.svelte.js';
	import type { Player } from '$lib/utils/inazuma-eleven-1.utils';

	type Row = Player & Player['stats'];
	let { players }: { players: Player[] } = $props();

	const rows = $derived(players.map((player) => ({ ...player, ...player.stats })));
	const positions = $derived(sortNoneLast(unique(players.map((player) => player.position))));
	const elements = $derived(sortNoneLast(unique(players.map((player) => player.element))));
	const genders = $derived(unique(players.map((player) => player.gender)));
	const teams = $derived(sortNoneLast(unique(players.map((player) => player.team))));
	const recruitmentMethods = $derived(sortNoneLast(unique(players.map((player) => player.recruitment))));

	let positionFilter = $state<Record<string, boolean>>({});
	let elementFilter = $state<Record<string, boolean>>({});
	let genderFilter = $state<Record<string, boolean>>({});
	let teamFilter = $state<Record<string, boolean>>({});
	let recruitmentFilter = $state<Record<string, boolean>>({});

	$effect(() => {
		addMissingFilterOptions(positionFilter, positions, true);
		addMissingFilterOptions(elementFilter, elements, true);
		addMissingFilterOptions(genderFilter, genders, true);
		addMissingFilterOptions(teamFilter, teams, true);
		addMissingFilterOptions(recruitmentFilter, recruitmentMethods, true);
	});

	const filteredRows = $derived(
		rows.filter(
			(player) =>
				(!Object.values(positionFilter).some(Boolean) || positionFilter[player.position]) &&
				(!Object.values(elementFilter).some(Boolean) || elementFilter[player.element]) &&
				(!Object.values(genderFilter).some(Boolean) || genderFilter[player.gender]) &&
				(!Object.values(teamFilter).some(Boolean) || teamFilter[player.team]) &&
				(!Object.values(recruitmentFilter).some(Boolean) || recruitmentFilter[player.recruitment])
		)
	);

	const columns: Column<Row>[] = [
		{
			key: 'name',
			label: 'Player',
			width: '260px',
			searchValue: (player) =>
				`${player.name} ${player.nickname} ${player.team} ${player.recruitment} ${player.locations.join(' ')}`,
			renderComponent: (player) => ({ component: PlayerCell, props: { player } })
		},
		{ key: 'fp', label: 'FP' },
		{ key: 'tp', label: 'TP' },
		{ key: 'kick', label: 'Kick' },
		{ key: 'body', label: 'Body' },
		{ key: 'guard', label: 'Guard' },
		{ key: 'control', label: 'Control' },
		{ key: 'speed', label: 'Speed' },
		{ key: 'guts', label: 'Guts' },
		{ key: 'stamina', label: 'Stamina' },
		{ key: 'total', label: 'Total' },
		{ key: 'freedom', label: 'Freedom' }
	];
</script>

{#if players.length}
	<div class="grid gap-4 lg:grid-cols-2">
		<CheckboxChipGroup label="Positions" options={positions} bind:checked={positionFilter} />
		<CheckboxChipGroup label="Elements" options={elements} bind:checked={elementFilter} />
		<CheckboxChipGroup label="Genders" options={genders} bind:checked={genderFilter} />
		<CheckboxChipGroup label="Teams" options={teams} bind:checked={teamFilter} />
		<CheckboxChipGroup label="Recruitment" options={recruitmentMethods} bind:checked={recruitmentFilter} />
	</div>
	<DataTable {columns} rows={filteredRows} pageSize={50} />
{:else}
	<p class="text-center opacity-60">Loading players...</p>
{/if}
