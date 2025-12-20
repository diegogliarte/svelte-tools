<script lang="ts">
	import TextInput from '$lib/components/ui/text-input.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import CheckboxInput from '$lib/components/ui/checkbox-input.svelte';
	import NumberInput from '$lib/components/ui/number-input.svelte';
	import DigimonIcon from '$lib/components/digimon-story-ts/DigimonIcon.svelte';
	import { tooltipAction } from '$lib/actions/tooltip';

	import MdiChevronRight from '~icons/mdi/chevron-right';
	import MdiClose from '~icons/mdi/close';

	import digimonRaw from '$lib/data/digimon-story-ts/digimon.json';
	import type { Digimon } from '$lib/utils/digimon-story-ts.utils';
	import { indexDigimonById } from '$lib/utils/digimon-story-ts.utils';
	import { makeFilter, unique } from '$lib/utils/filters.utils.svelte.js';

	/* ---------------- data ---------------- */

	const digimon: Digimon[] = digimonRaw as unknown as Digimon[];
	const digimonById = indexDigimonById(digimon);

	let startQuery = $state('');
	let endQuery = $state('');
	let start: Digimon | null = $state(null);
	let end: Digimon | null = $state(null);

	type Route = {
		start: Digimon;
		end: Digimon;
		blocked: Set<number>;
	};

	let routes = $state<Route[]>([]);

	/* ---------------- filters ---------------- */

	const generations = unique(digimon.map(d => d.generation));
	const attributes = unique(digimon.map(d => d.attribute));
	let agentRank = $state<number>(10);

	let generationFilter = $state(makeFilter(generations, true));
	let attributeFilter = $state(makeFilter(attributes, true));

	function passesFilters(d: Digimon): boolean {
		const genSel = Object.keys(generationFilter).filter(k => generationFilter[k]);
		const attrSel = Object.keys(attributeFilter).filter(k => attributeFilter[k]);

		if (genSel.length && !genSel.includes(d.generation)) return false;
		if (attrSel.length && !attrSel.includes(d.attribute)) return false;
		return true;
	}

	/* ---------------- search ---------------- */

	const filteredStart = $derived.by(() => {
		const q = startQuery.trim().toLowerCase();
		if (!q) return [];
		return digimon.filter(d =>
			d.name.toLowerCase().includes(q) && passesFilters(d)
		);
	});

	const filteredEnd = $derived.by(() => {
		const q = endQuery.trim().toLowerCase();
		if (!q) return [];
		return digimon.filter(d =>
			d.name.toLowerCase().includes(q) && passesFilters(d)
		);
	});

	function passesAgentRank(d: Digimon): boolean {
		if (agentRank == null) return true;

		for (const evo of d.evolution_conditions ?? []) {
			for (const [k, v] of Object.entries(evo.requirements ?? {})) {
				if (k.toLowerCase().includes('agent')) {
					const match = v.replace(/\s+/g, '').match(/^(≥|>=|>)?(\d+)$/)[2];
					const required = Number(match);
					if (!Number.isNaN(required) && required > agentRank) {
						return false;
					}
				}
			}
		}

		return true;
	}


	/* ---------------- routing ---------------- */

	function buildGraph(): Record<number, Set<number>> {
		const g: Record<number, Set<number>> = {};
		for (const d of digimon) {
			if (!passesFilters(d)) continue;
			if (!passesAgentRank(d)) continue;

			g[d.id] = new Set([
				...(d.evolutions ?? []),
				...(d.pre_evolutions ?? [])
			]);
		}
		return g;
	}

	function findShortestPath(
		startId: number,
		endId: number,
		blocked: Set<number>
	): number[] {
		const graph = buildGraph();
		const queue: number[][] = [[startId]];
		const visited = new Set([startId]);

		while (queue.length) {
			const path = queue.shift()!;
			const current = path[path.length - 1];

			if (current === endId) return path;

			for (const next of graph[current] ?? []) {
				if (visited.has(next)) continue;
				if (blocked.has(next)) continue;

				visited.add(next);
				queue.push([...path, next]);
			}
		}
		return [];
	}

	/* ---------------- route creation ---------------- */

	$effect(() => {
		if (!start || !end) return;

		const blocked = new Set<number>();
		routes = [...routes, { start, end, blocked }];

		start = null;
		end = null;
		startQuery = '';
		endQuery = '';
	});

	function routePath(r: Route): number[] {
		return findShortestPath(r.start.id, r.end.id, r.blocked);
	}

	function toggleBlocked(route: Route, id: number) {
		const next = new Set(route.blocked);
		next.has(id) ? next.delete(id) : next.add(id);

		route.blocked = next;
	}

	function deleteRoute(index: number) {
		routes = routes.filter((_, i) => i !== index);
	}

	function reset() {
		start = null;
		end = null;
		startQuery = '';
		endQuery = '';
		routes = [];
	}
</script>

<!-- ---------------- UI ---------------- -->

<div class="space-y-6">

	<div class="flex gap-4">
		<TextInput placeholder="Start Digimon" bind:value={startQuery} />
		<TextInput placeholder="End Digimon" bind:value={endQuery} />
		<Button onClick={reset}>Reset</Button>
	</div>

	<!-- Filters -->
	<div class="flex flex-col items-center gap-4">
		<div class="flex flex-row gap-4">
			{#each generations as g (g)}
				<CheckboxInput label={g} bind:checked={generationFilter[g]} />
			{/each}
		</div>

		<div class="flex flex-row gap-4">
			{#each attributes as a (a)}
				<CheckboxInput label={a} bind:checked={attributeFilter[a]} />
			{/each}
		</div>

		<div class="w-64">
			<NumberInput bind:value={agentRank} label="Agent Rank" min={1} max={10}/>
		</div>

	</div>

	<!-- Preview -->
	<div class="flex justify-center gap-6 items-center">
		<div class="flex flex-col items-center gap-1">
			{#if start}
				<div class="w-14 h-14">
					<DigimonIcon digimon={start} />
				</div>
			{:else}
				<div class="w-14 h-14 border flex items-center justify-center text-xs">
					Start
				</div>
			{/if}
		</div>

		<MdiChevronRight/>

		<!-- End slot -->
		<div class="flex flex-col items-center gap-1">
			{#if end}
				<div class="w-14 h-14">
					<DigimonIcon digimon={end} />
				</div>
			{:else}
				<div class="w-14 h-14 border flex items-center justify-center text-xs">
					End
				</div>
			{/if}
		</div>
	</div>

	<!-- Search results -->
	<div class="flex gap-4 items-start">
		<div class="flex flex-1 gap-2 flex-wrap items-start self-start">
			{#each filteredStart as d (d.id)}
				<button
					class="w-12"
					onclick={() => {
						start = d;
						startQuery = '';
					}}
				>
					<DigimonIcon digimon={d} openModal={false} />
				</button>
			{/each}
		</div>

		<div class="flex flex-1 gap-2 flex-wrap items-start self-start">
			{#each filteredEnd as d (d.id)}
				<button
					class="w-12"
					onclick={() => {
						end = d;
						endQuery = '';
					}}
				>
					<DigimonIcon digimon={d} openModal={false} />
				</button>
			{/each}
		</div>
	</div>


	<!-- Routes -->
	{#each routes as r, i (i)}
		{@const path = routePath(r)}
		{@const hasPath = path.length > 0}

		<div class="border p-4 flex flex-col items-center gap-4 relative">

			<button
				type="button"
				class="absolute top-1 right-1 opacity-50 hover:opacity-100 hover:text-accent cursor-pointer"
				onclick={() => deleteRoute(i)}
			>
				<MdiClose />
			</button>

			<div class="flex items-center gap-4">
				{#if hasPath}
					{#each path as id, idx (id)}
						{@const d = digimonById.get(id)}
						{#if d}
							<div
								class="w-14 cursor-pointer"
								class:opacity-40={r.blocked.has(id)}
							>
								<DigimonIcon
									digimon={d}
									variant="viewer"
									onClick={() => toggleBlocked(r, id)}
								/>
							</div>
						{/if}

						{#if idx < path.length - 1}
							{@const next = digimonById.get(path[idx + 1])}
							<div
								use:tooltipAction={{
						text: next?.evolution_conditions
							?.map(e =>
								Object.entries(e.requirements)
									.map(([k, v]) => `${k}: ${v}`)
									.join('\n')
							)
							.join('\n\n') ?? '',
						position: 'top'
					}}
								class="relative"
							>
								<MdiChevronRight class="transition hover:text-accent -mx-2 cursor-help" />
							</div>
						{/if}
					{/each}
				{:else}
					<!-- Start (always visible) -->
					<div class="w-14">
						<DigimonIcon digimon={r.start} variant="viewer" />
					</div>

					<MdiChevronRight class="opacity-40" />

					<!-- End (always visible) -->
					<div class="w-14">
						<DigimonIcon digimon={r.end} variant="viewer" />
					</div>
				{/if}
			</div>

			{#if path.length === 0}
				<div class="text-red-400 text-sm">
					No valid route available.
				</div>
			{/if}

			{#if r.blocked.size}
				<div class="flex gap-2 flex-wrap opacity-50">
					{#each [...r.blocked] as id}
						{@const d = digimonById.get(id)}
						{#if d}
							<div class="w-10 cursor-pointer">
								<DigimonIcon
									digimon={d}
									variant="viewer"
									onClick={() => toggleBlocked(r, id)}
								/>
							</div>
						{/if}
					{/each}
				</div>
			{/if}

		</div>
	{/each}

</div>
