<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/button.svelte';
	import NumberInput from '$lib/components/ui/number-input.svelte';
	import { loadBuildingMaterials, type BuildingMaterialsData } from '$lib/data/digimon-world-next-order/data';
	import { createLocalStorageState } from '$lib/states/local-storage.svelte';
	import { SvelteMap } from 'svelte/reactivity';

	type CalculatorState = {
		levels: Record<string, number | null>;
		inventory: Record<string, number | null>;
	};

	function numberRecord(value: unknown): Record<string, number | null> {
		if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

		return Object.fromEntries(
			Object.entries(value).flatMap(([key, amount]) =>
				typeof amount === 'number' && Number.isFinite(amount) ? [[key, amount]] : []
			)
		);
	}

	function normalizeCalculatorState(value: unknown): CalculatorState | null {
		if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

		const saved = value as Record<string, unknown>;
		return {
			levels: numberRecord(saved.levels),
			inventory: numberRecord(saved.inventory)
		};
	}

	const calculator = createLocalStorageState<CalculatorState>(
		{ levels: {}, inventory: {} },
		{
			name: 'materials-calculator',
			fallbackKeys: ['tool-state:/digimon/world-next-order/material-calculator:material-calculator'],
			normalize: normalizeCalculatorState
		}
	);

	let data = $state<BuildingMaterialsData>({ materialTypes: [], buildings: [] });

	const materialStyles = {
		liquid: 'bg-blue-400/10',
		metal: 'bg-yellow-500/10',
		stone: 'bg-red-300/10',
		wood: 'bg-green-500/10'
	} as const;

	onMount(async () => {
		data = await loadBuildingMaterials();

		for (const building of data.buildings) {
			const level = calculator.levels[building.id];
			calculator.levels[building.id] =
				typeof level === 'number' && Number.isFinite(level)
					? Math.max(1, Math.min(building.maxLevel, Math.trunc(level)))
					: 1;
		}

		for (const group of data.materialTypes) {
			for (const material of group.materials) {
				const amount = calculator.inventory[material.id] ?? calculator.inventory[material.name];
				calculator.inventory[material.id] =
					typeof amount === 'number' && Number.isFinite(amount) ? Math.max(0, Math.trunc(amount)) : 0;
				delete calculator.inventory[material.name];
			}
		}
	});

	const requiredByMaterial = $derived.by(() => {
		const totals = new SvelteMap<string, number>();

		for (const building of data.buildings) {
			const currentLevel = calculator.levels[building.id] ?? 1;

			for (const upgrade of building.upgrades) {
				if (upgrade.toLevel <= currentLevel) continue;

				for (const material of upgrade.materials) {
					totals.set(material.materialId, (totals.get(material.materialId) ?? 0) + material.amount);
				}
			}
		}

		return totals;
	});

	const summary = $derived.by(() => {
		let required = 0;
		let owned = 0;
		let remaining = 0;

		for (const group of data.materialTypes) {
			for (const material of group.materials) {
				const needed = requiredByMaterial.get(material.id) ?? 0;
				const available = calculator.inventory[material.id] ?? 0;
				required += needed;
				owned += available;
				remaining += Math.max(0, needed - available);
			}
		}

		return {
			required,
			owned,
			remaining,
			completed: data.buildings.filter((building) => (calculator.levels[building.id] ?? 1) >= building.maxLevel).length
		};
	});

	function setAllLevels(target: 'initial' | 'max') {
		for (const building of data.buildings) {
			calculator.levels[building.id] = target === 'max' ? building.maxLevel : 1;
		}
	}

	function clearInventory() {
		for (const material of Object.keys(calculator.inventory)) {
			calculator.inventory[material] = 0;
		}
	}
</script>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-5">
	<div class="flex flex-wrap gap-x-6 gap-y-1 text-sm">
		<div><span class="opacity-60">Required</span> {summary.required.toLocaleString()}</div>
		<div><span class="opacity-60">Owned</span> {summary.owned.toLocaleString()}</div>
		<div><span class="opacity-60">Remaining</span> {summary.remaining.toLocaleString()}</div>
		<div><span class="opacity-60">Buildings at max</span> {summary.completed}/{data.buildings.length}</div>
	</div>

	<section class="flex flex-col gap-3">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-lg font-semibold">Current building levels</h2>
			<div class="flex gap-2">
				<Button onClick={() => setAllLevels('initial')}>All level 1</Button>
				<Button onClick={() => setAllLevels('max')}>All max</Button>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
			{#each data.buildings as building (building.id)}
				<div class={(calculator.levels[building.id] ?? 1) >= building.maxLevel ? '[&_label]:text-accent' : ''}>
					<NumberInput
						label={building.name}
						bind:value={calculator.levels[building.id]}
						min={1}
						max={building.maxLevel}
						step={1}
					/>
				</div>
			{/each}
		</div>
	</section>

	<section class="flex flex-col gap-3">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-lg font-semibold">Materials</h2>
			<Button onClick={clearInventory}>Clear inventory</Button>
		</div>

		<div class="grid gap-3 xl:grid-cols-2">
			{#each data.materialTypes as group (group.id)}
				<div class="min-w-0 p-2 {materialStyles[group.id]}">
					<h3 class="mb-1.5 font-semibold">{group.label}</h3>
					<div>
						<div
							class="grid grid-cols-[minmax(4.75rem,1fr)_2.75rem_4.5rem_2.75rem] items-center gap-1.5 py-1.5 text-sm font-medium sm:grid-cols-[minmax(8rem,1fr)_5rem_7rem_5rem] sm:gap-2"
						>
							<span>Material</span>
							<span class="text-right">Need</span>
							<span>Have</span>
							<span class="text-right">Left</span>
						</div>

						{#each group.materials as material (material.id)}
							{@const required = requiredByMaterial.get(material.id) ?? 0}
							{@const owned = calculator.inventory[material.id] ?? 0}
							<div
								class="grid grid-cols-[minmax(4.75rem,1fr)_2.75rem_4.5rem_2.75rem] items-center gap-1.5 py-1 sm:grid-cols-[minmax(8rem,1fr)_5rem_7rem_5rem] sm:gap-2"
							>
								<span class="truncate" title={material.name}>{material.name}</span>
								<span class="text-right tabular-nums">{required.toLocaleString()}</span>
								<NumberInput bind:value={calculator.inventory[material.id]} min={0} step={1} />
								<span class="text-right font-semibold tabular-nums" class:text-accent={required > owned}>
									{Math.max(0, required - owned).toLocaleString()}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>
