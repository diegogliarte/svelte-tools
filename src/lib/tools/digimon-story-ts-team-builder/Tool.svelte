<script lang="ts">
	import TextInput from '$lib/components/ui/text-input.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import DigimonIcon from '$lib/components/digimon-story-ts/DigimonIcon.svelte';
	import { tooltipAction } from '$lib/actions/tooltip';
	import MdiChevronRight from '~icons/mdi/chevron-right';
	import MdiClose from '~icons/mdi/close';
	import MdiDiceMultiple from '~icons/mdi/dice-multiple';


	import digimonRaw from '$lib/data/digimon-story-ts/digimon.json';
	import type { Digimon } from '$lib/utils/digimon-story-ts.utils';
	import { getEvolutions, getPreEvolutions, indexDigimonById } from '$lib/utils/digimon-story-ts.utils';

	const digimon: Digimon[] = digimonRaw as unknown as Digimon[];
	const digimonById = indexDigimonById(digimon);

	const STORAGE_KEY = 'digimon-story-ts:team-builder';

	$effect(() => {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;

		try {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				team = parsed;
			}
		} catch {

		}
	});

	$effect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
	});


	let search = $state('');
	type Chain = number[];
	let team = $state<Chain[]>([]);

	const filteredDigimon = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (!q) return [];

		return digimon.filter(d =>
			d.name.toLowerCase().includes(q) ||
			d.slug.toLowerCase().includes(q)
		);
	});

	function startChain(d: Digimon) {
		team = [...team, [d.id]];
		search = '';
	}

	function updateChain(index: number, next: number[]) {
		if (next.length === 0) {
			team = team.filter((_, i) => i !== index);
			return;
		}

		team = team.map((c, i) => (i === index ? next : c));
	}


	function extendLeft(index: number, d: Digimon) {
		updateChain(index, [d.id, ...team[index]]);
	}

	function extendRight(index: number, d: Digimon) {
		updateChain(index, [...team[index], d.id]);
	}

	function trimChain(chain: number[], d: Digimon) {
		const index = team.indexOf(chain);
		if (index === -1) return;

		const idx = chain.indexOf(d.id);
		if (idx === -1) return;

		if (idx === 0) {
			updateChain(index, chain.slice(1));
			return;
		}

		if (idx === chain.length - 1) {
			updateChain(index, chain.slice(0, -1));
			return;
		}

		updateChain(index, chain.slice(0, idx));
	}


	function deleteChain(index: number) {
		team = team.filter((_, i) => i !== index);
	}

	function randomItem<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	function buildRandomChain(
		start: Digimon,
		used: Set<number>
	): number[] {
		const chain: number[] = [start.id];
		let current = start;

		const visited = new Set<number>([current.id]);
		used.add(current.id);

		while (current.evolutions?.length) {
			const candidates = current.evolutions
				.filter(id => !visited.has(id) && !used.has(id))
				.map(id => digimonById.get(id))
				.filter((d): d is Digimon => Boolean(d));

			if (!candidates.length) break;

			const next = randomItem(candidates);

			visited.add(next.id);
			used.add(next.id);
			chain.push(next.id);
			current = next;
		}

		return chain;
	}

	function generateRandomTeam() {
		const starters = digimon.filter(
			d => d.generation === 'In-Training I'
		);

		if (!starters.length) return;

		const TEAM_SIZE = 6;
		const used = new Set<number>();
		const chains: number[][] = [];

		while (chains.length < TEAM_SIZE && starters.length) {
			const availableStarters = starters.filter(d => !used.has(d.id));
			if (!availableStarters.length) break;

			const start = randomItem(availableStarters);
			const chain = buildRandomChain(start, used);

			chains.push(chain);
		}

		team = chains;
		search = '';
	}
</script>


<div class="flex items-center justify-between gap-2">
	<div class="w-64">
		<TextInput
			placeholder="Search Digimon..."
			bind:value={search}
		/>
	</div>

	<Button onClick={generateRandomTeam}>
		<span class="flex items-center">
			<MdiDiceMultiple/>Random Team
		</span>
	</Button>
</div>
{#if search && filteredDigimon.length}
	<div class="flex flex-wrap gap-2">
		{#each filteredDigimon as d (d.id)}
			<button
				type="button"
				class="w-12 hover:scale-110 transition"
				onclick={() => startChain(d)}
			>
				<DigimonIcon digimon={d} />
			</button>
		{/each}
	</div>
{:else if search}
	<div class="opacity-60 mb-6">
		No Digimon found
	</div>
{/if}

{#each team as c, i (i)}
	{@const leftEdge = digimonById.get(c[0])}
	{@const rightEdge = digimonById.get(c[c.length - 1])}

	{@const preEvos = leftEdge ? getPreEvolutions(leftEdge, digimonById) : []}
	{@const evos = rightEdge ? getEvolutions(rightEdge, digimonById) : []}

	{@const notInChain = (d: Digimon) => !c.includes(d.id)}

	<div class="relative border">
		<button
			type="button"
			class="absolute top-1 right-1 opacity-50 hover:opacity-100 hover:text-accent cursor-pointer"
			onclick={(e) => {
				e.stopPropagation();
				deleteChain(i);
			}}
		>
			<MdiClose />
		</button>

		<div class="flex justify-center items-center w-full gap-6 p-2">
			<!-- Pre-evolutions -->
			<div class="flex flex-col gap-2">
				{#each preEvos.filter(notInChain) as d (d.id)}
					<div class="w-14">
						<DigimonIcon
							digimon={d}
							variant="viewer"
							onClick={() => extendLeft(i, d)}
						/>
					</div>
				{/each}
			</div>

			<!-- Chain -->
			<div class="flex items-center gap-4">
				{#each c as id, i (id)}
					{@const d = digimonById.get(id)}
					{#if d}
						<div class="w-14">
							<DigimonIcon
								digimon={d}
								variant="viewer"
								selected
								onClick={() => trimChain(c, d)}
							/>
						</div>
					{/if}

					{#if i < c.length - 1}
						{@const next = digimonById.get(c[i + 1])}

						{@const evoRequirements =
							next?.evolution_conditions
								?.map(e =>
									Object.entries(e.requirements)
										.map(([k, v]) => `${k}: ${v}`)
										.join('\n')
								)
								.join('\n\n') ?? ''
						}
						<div
							class="relative"
							use:tooltipAction={{ text: evoRequirements, position: 'top'}}
						>
						<MdiChevronRight
							class="transition hover:text-accent -mx-2 cursor-help"

						/>
						</div>

					{/if}
				{/each}
			</div>


			<!-- Evolutions -->
			<div class="flex flex-col gap-2">
				{#each evos.filter(notInChain) as d (d.id)}
					<div class="w-14">
						<DigimonIcon
							digimon={d}
							variant="viewer"
							onClick={() => extendRight(i, d)}
						/>
					</div>
				{/each}
			</div>
		</div>
	</div>

{/each}

