<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import CheckboxChipGroup from '$lib/components/ui/checkbox-chip-group.svelte';

	import { loadMoveFlags, loadMoves, type Move, type MoveFlags } from '$lib/data/pmd-blue/data';

	import { addMissingFilterOptions, sortNoneLast, unique } from '$lib/utils/filters.utils.svelte.js';
	import MoveCell from '$lib/components/pmd-blue/MoveCell.svelte';
	import FlagBadges from '$lib/components/pmd-blue/FlagBadges.svelte';

	type MoveRow = Move & {
		hitModeDisplay: string;
		hitsDisplay: string;
	};

	let moves = $state<Move[]>([]);
	let moveFlags = $state<MoveFlags>({ damageFlags: [], otherFlags: [] });

	onMount(async () => {
		[moves, moveFlags] = await Promise.all([loadMoves(), loadMoveFlags()]);
	});

	const damageFlags = $derived(moveFlags.damageFlags);
	const otherFlags = $derived(moveFlags.otherFlags);

	const damageMap = $derived(Object.fromEntries(damageFlags.map((f) => [f.id, f.description])));
	const otherMap = $derived(Object.fromEntries(otherFlags.map((f) => [f.id, f.description])));

	function formatHits(move: { min_hits?: number | null; max_hits?: number | null; hit_count_mode?: string | null }) {
		const min = move.min_hits;
		const max = move.max_hits;

		if (min != null && max != null) return min === max ? `${min}` : `${min}-${max}`;
		if (min != null) return `${min}`;
		if (max != null) return `${max}`;
		return '—';
	}

	const rows = $derived(
		moves.map((m) => ({
			...m,
			type: m.type?.trim() || 'None',
			class: m.class?.trim() || 'None',
			targets: m.targets?.trim() || 'None',
			hitModeDisplay: m.hit_count_mode?.trim() || 'None',
			hitsDisplay: formatHits(m)
		}))
	);

	const types = $derived(sortNoneLast(unique(rows.map((r) => r.type))));
	const classes = $derived(sortNoneLast(unique(rows.map((r) => r.class))));
	const targets = $derived(sortNoneLast(unique(rows.map((r) => r.targets))));
	const hitModes = $derived(sortNoneLast(unique(rows.map((r) => r.hitModeDisplay))));

	let typeFilter = $state<Record<string, boolean>>({});
	let classFilter = $state<Record<string, boolean>>({});
	let targetFilter = $state<Record<string, boolean>>({});
	let hitModeFilter = $state<Record<string, boolean>>({});

	$effect(() => {
		addMissingFilterOptions(typeFilter, types);
		addMissingFilterOptions(classFilter, classes);
		addMissingFilterOptions(targetFilter, targets);
		addMissingFilterOptions(hitModeFilter, hitModes);
	});

	let filteredRows = $derived.by(() => {
		const allowedTypes = Object.keys(typeFilter).filter((k) => typeFilter[k]);
		const allowedClasses = Object.keys(classFilter).filter((k) => classFilter[k]);
		const allowedTargets = Object.keys(targetFilter).filter((k) => targetFilter[k]);
		const allowedHitModes = Object.keys(hitModeFilter).filter((k) => hitModeFilter[k]);

		return rows.filter(
			(r) =>
				(allowedTypes.length ? allowedTypes.includes(r.type) : true) &&
				(allowedClasses.length ? allowedClasses.includes(r.class) : true) &&
				(allowedTargets.length ? allowedTargets.includes(r.targets) : true) &&
				(allowedHitModes.length ? allowedHitModes.includes(r.hitModeDisplay) : true)
		);
	});

	const columns: Column<MoveRow>[] = [
		{
			key: 'name',
			label: 'Name',
			width: '200px',
			searchValue: (m) =>
				`${m.name} ${m.type} ${m.class} ${m.hit_count_mode ?? ''} ${m.min_hits ?? ''} ${m.max_hits ?? ''}`,
			renderComponent: (m) => ({
				component: MoveCell,
				props: { move: m }
			})
		},
		{ key: 'type', label: 'Type' },
		{
			key: 'class',
			label: 'Class',
			class: (m) =>
				m.class === 'Physical' ? 'text-red-400' : m.class === 'Special' ? 'text-blue-400' : 'text-yellow-400',
			value: (m) => m.class
		},
		{ key: 'power', label: 'Power' },
		{ key: 'maxPP', label: 'PP' },
		{ key: 'acc1', label: 'Acc 1' },
		{ key: 'acc2', label: 'Acc 2' },
		{ key: 'crit', label: 'Crit' },
		{ key: 'hitsDisplay', label: 'Hits' },
		{ key: 'hitModeDisplay', label: 'Hit Mode' },

		{
			key: 'damageFlags',
			label: 'Damage Flags',
			renderComponent: (m) => ({
				component: FlagBadges,
				props: {
					flags: m.damageFlags,
					map: damageMap
				}
			})
		},
		{
			key: 'otherFlags',
			label: 'Other Flags',
			renderComponent: (m) => ({
				component: FlagBadges,
				props: {
					flags: m.otherFlags,
					map: otherMap
				}
			})
		},

		{ key: 'targets', label: 'Targets' }
	];
</script>

{#if moves.length}
	<div class="flex flex-col gap-4">
		<div class="grid gap-4 lg:grid-cols-2">
			<CheckboxChipGroup label="Type" options={types} bind:checked={typeFilter} />

			<CheckboxChipGroup label="Class" options={classes} bind:checked={classFilter} />

			<CheckboxChipGroup label="Targets" options={targets} bind:checked={targetFilter} />

			<CheckboxChipGroup label="Hit Mode" options={hitModes} bind:checked={hitModeFilter} />
		</div>
	</div>

	<DataTable {columns} rows={filteredRows} pageSize={50} />
{:else}
	<p class="text-center opacity-60">Loading moves...</p>
{/if}
