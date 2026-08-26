<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import SelectInput from '$lib/components/ui/select-input.svelte';
	import CheckboxChipGroup from '$lib/components/ui/checkbox-chip-group.svelte';

	import { loadPlayers } from '$lib/data/inazuma-eleven-vr/data';
	import PlayerCell from '$lib/components/inazuma-eleven-vr/PlayerCell.svelte';
	import { addMissingFilterOptions, sortNoneLast, unique } from '$lib/utils/filters.utils.svelte.js';
	import { calculateATDFStats, type Player } from '$lib/utils/inazuma-eleven-vr.utils';

	let rawPlayers = $state<Player[]>([]);

	onMount(async () => {
		rawPlayers = await loadPlayers();
	});

	const players = $derived(rawPlayers.filter((p) => p.Name !== '???'));

	const positions = $derived(sortNoneLast(unique(players.map((p) => p.Position ?? '?'))));
	const elements = $derived(sortNoneLast(unique(players.map((p) => p.Element ?? 'None'))));
	const roles = $derived(sortNoneLast(unique(players.map((p) => p.Role ?? 'None'))));
	const genders = $derived(sortNoneLast(unique(players.map((p) => p.Gender ?? 'None'))));

	let positionFilter = $state<Record<string, boolean>>({});
	let elementFilter = $state<Record<string, boolean>>({});
	let roleFilter = $state<Record<string, boolean>>({});
	let genderFilter = $state<Record<string, boolean>>({});

	let statMode = $state<'normal' | 'atdf'>('normal');

	$effect(() => {
		addMissingFilterOptions(positionFilter, positions, true);
		addMissingFilterOptions(elementFilter, elements, true);
		addMissingFilterOptions(roleFilter, roles, true);
		addMissingFilterOptions(genderFilter, genders, true);
	});

	// ---------------------------------------
	// FILTERED DATA
	// ---------------------------------------
	let filteredRows = $derived.by(() => {
		const posSelected = Object.keys(positionFilter).filter((k) => positionFilter[k]);
		const elemSelected = Object.keys(elementFilter).filter((k) => elementFilter[k]);
		const roleSelected = Object.keys(roleFilter).filter((k) => roleFilter[k]);
		const genderSelected = Object.keys(genderFilter).filter((k) => genderFilter[k]);

		return players.filter(
			(p) =>
				(posSelected.length ? posSelected.includes(p.Position ?? '?') : true) &&
				(elemSelected.length ? elemSelected.includes(p.Element ?? 'None') : true) &&
				(roleSelected.length ? roleSelected.includes(p.Role ?? 'None') : true) &&
				(genderSelected.length ? genderSelected.includes(p.Gender ?? 'None') : true)
		);
	});

	// ---------------------------------------
	// COMPUTED STATS (ATDF)
	// ---------------------------------------
	let computedRows = $derived.by(() =>
		filteredRows.map((p) => {
			const base = {
				kick: p.Kick,
				control: p.Control,
				technique: p.Technique,
				pressure: p.Pressure,
				physical: p.Physical,
				agility: p.Agility,
				intelligence: p.Intelligence,
				total: p.Total
			};

			const atdf = calculateATDFStats(base);
			return { ...p, ...atdf };
		})
	);

	const playerColumn: Column = {
		key: 'player',
		label: 'Player',
		width: '280px',
		searchValue: (p) => `${p.Name} ${p.Nickname} ${p.Position} ${p.RomajiName}`,
		renderComponent: (p) => ({
			component: PlayerCell,
			props: { player: p }
		})
	};

	const normalColumns: Column[] = [
		playerColumn,
		{ key: 'Kick', label: 'Kick' },
		{ key: 'Control', label: 'Control' },
		{ key: 'Technique', label: 'Technique' },
		{ key: 'Pressure', label: 'Pressure' },
		{ key: 'Physical', label: 'Physical' },
		{ key: 'Agility', label: 'Agility' },
		{ key: 'Intelligence', label: 'Intelligence' },
		{ key: 'Total', label: 'Total' }
	];

	const atdfColumns: Column[] = [
		playerColumn,
		{ key: 'shootAT', label: 'Shoot AT' },
		{ key: 'focusAT', label: 'Focus AT' },
		{ key: 'focusDF', label: 'Focus DF' },
		{ key: 'wallDF', label: 'Wall DF' },
		{ key: 'scrambleAT', label: 'Scramble AT' },
		{ key: 'scrambleDF', label: 'Scramble DF' },
		{ key: 'kp', label: 'KP' }
	];

	let columns = $derived(statMode === 'normal' ? normalColumns : atdfColumns);
</script>

{#if players.length}
	<div class="flex flex-col gap-4">
		<div class="grid gap-4 lg:grid-cols-2">
			<CheckboxChipGroup label="Positions" options={positions} bind:checked={positionFilter} />

			<CheckboxChipGroup label="Elements" options={elements} bind:checked={elementFilter} />

			<CheckboxChipGroup label="Roles" options={roles} bind:checked={roleFilter} />

			<CheckboxChipGroup label="Genders" options={genders} bind:checked={genderFilter} />
		</div>

		<div class="w-48">
			<SelectInput
				label="Stats Mode"
				bind:value={statMode}
				options={[
					{ value: 'normal', label: 'Normal Stats' },
					{ value: 'atdf', label: 'ATDF Stats' }
				]}
			/>
		</div>
	</div>

	<DataTable {columns} rows={computedRows} pageSize={50} />
{:else}
	<p class="text-center opacity-60">Loading players...</p>
{/if}
