<script lang="ts">
	import { onMount } from 'svelte';
	import AlternativesCell from './components/AlternativesCell.svelte';
	import TaskCell from './components/TaskCell.svelte';
	import CheckboxChipGroup from '$lib/components/ui/checkbox-chip-group.svelte';
	import CheckboxInput from '$lib/components/ui/checkbox-input.svelte';
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import NumberInput from '$lib/components/ui/number-input.svelte';
	import { loadSlayerTasks } from '$lib/data/osrs/data';
	import type { SlayerAssignment, SlayerMaster, SlayerTasksData } from '$lib/data/osrs/slayer-tasks.types';
	import { createLocalStorageState } from '$lib/states/local-storage.svelte';
	import {
		blockSlots,
		requirementLabel,
		unmetRequirements,
		weightedChances,
		type SlayerProfile
	} from '$lib/utils/osrs/slayer-tasks.utils';
	import { SvelteMap } from 'svelte/reactivity';

	type DisplayAlternative = {
		name: string;
		wikiPath?: string;
		isBoss: boolean;
		unavailable?: boolean;
		detail?: string;
	};

	type Row = SlayerAssignment & {
		blockTaskId: string;
		isBoss: boolean;
		masterName: string;
		status: 'Available' | 'Blocked' | 'Requirements' | 'Master locked';
		chance: number;
		chanceText: string;
		weightText: string;
		amountText: string;
		requirementsText: string;
		displayAlternatives: DisplayAlternative[];
	};

	const defaults = {
		levels: {
			Combat: 1,
			Slayer: 1,
			Agility: 1,
			Defence: 1,
			Firemaking: 1,
			Hitpoints: 1,
			Magic: 1,
			Ranged: 1,
			Sailing: 1,
			Strength: 1,
			Thieving: 1
		} as Record<string, number>,
		questPoints: 0,
		eliteLumbridgeDiary: false,
		quests: {} as Record<string, boolean>,
		unlocks: {} as Record<string, boolean>,
		other: {} as Record<string, boolean>,
		masters: { duradel: true } as Record<string, boolean>,
		blocks: {} as Record<string, Record<string, boolean>>,
		mortimerChoices: 2
	};

	const profile = createLocalStorageState(defaults);
	let data = $state<SlayerTasksData | null>(null);

	onMount(async () => {
		data = await loadSlayerTasks();
	});

	const player = $derived<SlayerProfile>({
		levels: profile.levels,
		quests: profile.quests,
		unlocks: profile.unlocks,
		other: profile.other
	});
	const explicitlySelectedMasterIds = $derived(Object.keys(profile.masters).filter((id) => profile.masters[id]));
	const selectedMasterIds = $derived(
		explicitlySelectedMasterIds.length ? explicitlySelectedMasterIds : (data?.masters ?? []).map((master) => master.id)
	);
	const mastersById = $derived(new Map((data?.masters ?? []).map((master) => [master.id, master])));

	function masterRequirements(master: SlayerMaster) {
		const unmet: string[] = [];
		const slayerCapeBypass = (profile.levels.Slayer ?? 1) >= 99;
		if (master.minimumCombat && (profile.levels.Combat ?? 3) < master.minimumCombat && !slayerCapeBypass) {
			unmet.push(`Combat ${master.minimumCombat}`);
		}
		if (master.minimumSlayer && (profile.levels.Slayer ?? 1) < master.minimumSlayer) {
			unmet.push(`Slayer ${master.minimumSlayer}`);
		}
		for (const quest of master.requirements ?? []) {
			const option = data?.quests.find((item) => item.label === quest);
			if (!option || !profile.quests[option.id]) unmet.push(quest);
		}
		return unmet;
	}

	function blocksFor(masterId: string) {
		return profile.blocks[masterId] ?? {};
	}

	function blockCount(masterId: string) {
		return Object.values(blocksFor(masterId)).filter(Boolean).length;
	}

	function slotsFor(master: SlayerMaster) {
		return blockSlots(profile.questPoints, profile.eliteLumbridgeDiary, master.maxBlockSlots ?? 7);
	}

	function isBlocked(assignment: SlayerAssignment) {
		return !!blocksFor(assignment.masterId)[assignment.taskId];
	}

	function taskBlockers(assignment: SlayerAssignment) {
		return unmetRequirements(assignment.requirements, player);
	}

	function isEligible(assignment: SlayerAssignment) {
		const master = mastersById.get(assignment.masterId);
		return !!master && !masterRequirements(master).length && !taskBlockers(assignment).length && !isBlocked(assignment);
	}

	const chancesByMaster = $derived.by(() => {
		const result = new SvelteMap<string, Map<string, number>>();
		for (const master of data?.masters ?? []) {
			const eligible = (data?.assignments ?? []).filter(
				(assignment) => assignment.masterId === master.id && isEligible(assignment)
			);
			const choices = master.id === 'mortimer' ? profile.mortimerChoices : 1;
			result.set(master.id, weightedChances(eligible, choices));
		}
		return result;
	});

	function assignmentStatus(assignment: SlayerAssignment): Row['status'] {
		const master = mastersById.get(assignment.masterId);
		if (isBlocked(assignment)) return 'Blocked';
		if (master && masterRequirements(master).length) return 'Master locked';
		if (taskBlockers(assignment).length) return 'Requirements';
		return 'Available';
	}

	function formatRange(value?: [number, number]) {
		if (!value) return '—';
		return value[0] === value[1] ? String(value[0]) : `${value[0]}–${value[1]}`;
	}

	function displayAlternatives(assignment: SlayerAssignment): DisplayAlternative[] {
		return assignment.alternatives;
	}

	function baseRow(assignment: SlayerAssignment): Row {
		const master = mastersById.get(assignment.masterId)!;
		const taskRequirements = taskBlockers(assignment);
		const masterBlockers = masterRequirements(master);
		const requirementsText = [...masterBlockers, ...taskRequirements.map(requirementLabel)].join(', ');
		const chance = chancesByMaster.get(assignment.masterId)?.get(assignment.taskId) ?? 0;
		return {
			...assignment,
			blockTaskId: assignment.taskId,
			isBoss: false,
			masterName: master.name,
			status: assignmentStatus(assignment),
			chance,
			chanceText: chance ? `${(chance * 100).toFixed(2)}%` : '—',
			weightText: String(assignment.weight),
			amountText: `${formatRange(assignment.amount)}${assignment.extendedAmount ? ` (${formatRange(assignment.extendedAmount)})` : ''}`,
			requirementsText: requirementsText || 'None',
			displayAlternatives: displayAlternatives(assignment)
		};
	}

	function bossRows(assignment: SlayerAssignment): Row[] {
		const master = mastersById.get(assignment.masterId)!;
		const parentTaskBlockers = taskBlockers(assignment);
		const masterBlockers = masterRequirements(master);
		const parentChance = chancesByMaster.get(assignment.masterId)?.get(assignment.taskId) ?? 0;
		const eligibleBosses = (assignment.bosses ?? []).filter(
			(boss) => !unmetRequirements(boss.requirements, player).length
		);
		const totalBossWeight = eligibleBosses.reduce((sum, boss) => sum + boss.weight, 0);

		return (assignment.bosses ?? []).map((boss) => {
			const bossBlockers = unmetRequirements(boss.requirements, player);
			const allBlockers = [
				...masterBlockers,
				...parentTaskBlockers.map(requirementLabel),
				...bossBlockers.map(requirementLabel)
			];
			const blocked = isBlocked(assignment);
			const status: Row['status'] = blocked
				? 'Blocked'
				: masterBlockers.length
					? 'Master locked'
					: parentTaskBlockers.length || bossBlockers.length
						? 'Requirements'
						: 'Available';
			const chance = status === 'Available' && totalBossWeight ? parentChance * (boss.weight / totalBossWeight) : 0;

			return {
				...assignment,
				taskId: boss.id,
				blockTaskId: assignment.taskId,
				name: boss.name,
				wikiPath: boss.wikiPath,
				weight: boss.weight,
				requirements: [...assignment.requirements, ...boss.requirements],
				bosses: undefined,
				alternatives: [],
				isBoss: true,
				masterName: master.name,
				status,
				chance,
				chanceText: chance ? `${(chance * 100).toFixed(2)}%` : '—',
				weightText: `${assignment.weight} → ${boss.weight}`,
				amountText: `${formatRange(assignment.amount)}${assignment.extendedAmount ? ` (${formatRange(assignment.extendedAmount)})` : ''}`,
				requirementsText: allBlockers.join(', ') || 'None',
				displayAlternatives: []
			};
		});
	}

	const rows = $derived.by<Row[]>(() =>
		(data?.assignments ?? [])
			.filter((assignment) => selectedMasterIds.includes(assignment.masterId))
			.flatMap((assignment) => (assignment.bosses?.length ? bossRows(assignment) : [baseRow(assignment)]))
	);

	const columns: Column<Row>[] = [
		{
			key: 'name',
			label: 'Task',
			width: '15%',
			searchValue: (row) =>
				[row.name, row.requirementsText, row.displayAlternatives.map((item) => item.name)].join(' '),
			renderComponent: (row) => ({
				component: TaskCell,
				props: { name: row.name, wikiPath: row.wikiPath, isBoss: row.isBoss }
			})
		},
		{ key: 'masterName', label: 'Master', width: '15%', value: (row) => row.masterName },
		{
			key: 'weight',
			label: 'Weight',
			width: '6%',
			sortValue: (row) => row.weight,
			value: (row) => row.weightText
		},
		{
			key: 'chance',
			label: 'Chance',
			width: '7%',
			sortValue: (row) => row.chance,
			value: (row) => row.chanceText
		},
		{ key: 'amountText', label: 'Amount (extended)', width: '13%', value: (row) => row.amountText },
		{
			key: 'status',
			label: 'Status',
			width: '9%',
			class: (row) =>
				row.status === 'Available' ? 'text-accent' : row.status === 'Blocked' ? 'text-red-300' : 'text-white/45',
			value: (row) => row.status
		},
		{
			key: 'alternatives',
			label: 'Alternatives / bosses',
			width: '21%',
			searchValue: (row) => row.displayAlternatives.map((item) => item.name).join(' '),
			renderComponent: (row) => ({
				component: AlternativesCell,
				props: { alternatives: row.displayAlternatives }
			})
		}
	];

	function toggleBlock(row: Row) {
		const master = mastersById.get(row.masterId);
		if (!master) return;
		const blocked = !!blocksFor(row.masterId)[row.blockTaskId];
		if (!blocked && blockCount(row.masterId) >= slotsFor(master)) return;
		profile.blocks = {
			...profile.blocks,
			[row.masterId]: { ...blocksFor(row.masterId), [row.blockTaskId]: !blocked }
		};
	}

	function rowClass(row: Row) {
		if (row.status === 'Blocked') return 'bg-red-950/25 text-red-100/50 hover:bg-red-950/40';
		if (row.status === 'Requirements' || row.status === 'Master locked') return 'opacity-40';
		return undefined;
	}

	function rowTooltip(row: Row) {
		if (row.status === 'Requirements' || row.status === 'Master locked') {
			return `Missing: ${row.requirementsText}`;
		}
		if (row.status === 'Blocked') {
			return [
				`Blocked for ${row.masterName}. Click to unblock.`,
				row.requirementsText !== 'None' ? `Missing: ${row.requirementsText}` : ''
			]
				.filter(Boolean)
				.join('\n');
		}
		return '';
	}
</script>

{#if data}
	<div class="flex flex-col gap-5">
		<div class="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)]">
			<div class="flex flex-col gap-4">
				<CheckboxChipGroup
					label="Slayer masters"
					options={data.masters.map((master) => ({ value: master.id, label: master.name }))}
					bind:checked={profile.masters}
					persist={false}
				/>

				<div class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
					{#each data.skills as skill (skill)}
						<NumberInput label={skill} bind:value={profile.levels[skill]} min={1} max={skill === 'Combat' ? 126 : 99} />
					{/each}
					<NumberInput label="Quest points" bind:value={profile.questPoints} min={0} max={300} />
					{#if selectedMasterIds.includes('mortimer')}
						<NumberInput label="Mortimer choices" bind:value={profile.mortimerChoices} min={2} max={3} />
					{/if}
				</div>

				<CheckboxInput
					label="Elite Lumbridge & Draynor Diary (+1 standard block slot)"
					bind:checked={profile.eliteLumbridgeDiary}
					persist={false}
				/>
			</div>

			<div class="flex flex-col gap-3 text-sm">
				<div class="font-medium">Block lists</div>
				<div class="grid grid-cols-2 gap-x-4 gap-y-1">
					{#each data.masters.filter((master) => selectedMasterIds.includes(master.id)) as master (master.id)}
						<div>{master.name}</div>
						<div class={blockCount(master.id) > slotsFor(master) ? 'text-red-300' : 'opacity-70'}>
							{blockCount(master.id)}/{slotsFor(master)} · {master.blockCost} points each
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="flex flex-col gap-4">
			<CheckboxChipGroup
				label="Quests"
				options={data.quests.map((item) => ({ value: item.id, label: item.label }))}
				bind:checked={profile.quests}
				persist={false}
			/>
			<CheckboxChipGroup
				label="Slayer unlocks"
				options={data.unlocks.map((item) => ({
					value: item.id,
					label: item.inverted ? `${item.label} (blocks task)` : item.label
				}))}
				bind:checked={profile.unlocks}
				persist={false}
			/>
			<CheckboxChipGroup
				label="Other access"
				options={data.otherRequirements.map((item) => ({ value: item.id, label: item.label }))}
				bind:checked={profile.other}
				persist={false}
			/>
		</div>

		<DataTable
			{columns}
			{rows}
			pageSize={75}
			onRowClick={toggleBlock}
			rowKey={(row) => `${row.masterId}:${row.taskId}`}
			{rowClass}
			{rowTooltip}
			resetPageOnRowsChange={false}
		/>
	</div>
{:else}
	<p class="text-center opacity-60">Loading Slayer tasks…</p>
{/if}
