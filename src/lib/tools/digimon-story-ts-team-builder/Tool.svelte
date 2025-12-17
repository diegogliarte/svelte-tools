<script lang="ts">
	import TextInput from '$lib/components/ui/text-input.svelte';
	import DigimonIcon from '$lib/components/digimon-story-ts/DigimonIcon.svelte';
	import { tooltipAction } from '$lib/actions/tooltip';
	import MdiChevronRight from '~icons/mdi/chevron-right';
	import MdiClose from '~icons/mdi/close';


	import digimonRaw from '$lib/data/digimon-story-ts/digimon.json';
	import type { Digimon } from '$lib/utils/digimon-story-ts.utils';
	import { getEvolutions, getPreEvolutions, indexDigimonById } from '$lib/utils/digimon-story-ts.utils';

	const digimon: Digimon[] = digimonRaw as unknown as Digimon[];
	const digimonById = indexDigimonById(digimon);

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
		console.log(chain, d);
		const index = team.indexOf(chain);
		console.log(index);
		if (index === -1) return;

		const idx = chain.indexOf(d.id);
		if (idx === -1) return;

		console.log(idx);

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
</script>


<div class="w-64 mb-4">
	<TextInput
		placeholder="Search Digimon..."
		bind:value={search}
	/>
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

	<div class="relative p-2 border">
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

