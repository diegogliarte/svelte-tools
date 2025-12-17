<script lang="ts">
	import TextInput from '$lib/components/ui/text-input.svelte';
	import DigimonIcon from '$lib/components/digimon-story-ts/DigimonIcon.svelte';
	import MdiChevronRight from '~icons/mdi/chevron-right';

	import digimonRaw from '$lib/data/digimon-story-ts/digimon.json';
	import {
		indexDigimonById,
		getPreEvolutions,
		getEvolutions
	} from '$lib/utils/digimon-story-ts.utils';
	import type { Digimon } from '$lib/utils/digimon-story-ts.utils';

	const digimon: Digimon[] = digimonRaw as unknown as Digimon[];
	const digimonById = indexDigimonById(digimon);

	let search = $state('');
	let chain = $state<number[]>([]);

	const filteredDigimon = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (!q) return [];

		return digimon.filter(d =>
			d.name.toLowerCase().includes(q) ||
			d.slug.toLowerCase().includes(q)
		);
	});

	const leftEdge = $derived(chain.length ? digimonById.get(chain[0]) : null);
	const rightEdge = $derived(chain.length ? digimonById.get(chain[chain.length - 1]) : null);

	const preEvos = $derived(leftEdge ? getPreEvolutions(leftEdge, digimonById) : []);
	const evos = $derived(rightEdge ? getEvolutions(rightEdge, digimonById) : []);

	function notInChain(d: Digimon) {
		return !chain.includes(d.id);
	}

	function startChain(d: Digimon) {
		chain = [d.id];
		search = '';
	}

	function extendLeft(d: Digimon) {
		chain = [d.id, ...chain];
	}

	function extendRight(d: Digimon) {
		chain = [...chain, d.id];
	}

	function trimChain(d: Digimon) {
		const idx = chain.indexOf(d.id);
		if (idx === -1) return;

		// clicking left edge removes it
		if (idx === 0) {
			chain = chain.slice(1);
			return;
		}

		// clicking right edge removes it
		if (idx === chain.length - 1) {
			chain = chain.slice(0, -1);
			return;
		}

		// clicking middle trims to that point
		chain = chain.slice(0, idx);
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

{#if chain.length}
	<div class="flex justify-center items-center w-full gap-6 border p-2">
		<!-- Pre-evolutions -->
		<div class="flex flex-col gap-2">
			{#each preEvos.filter(notInChain) as d (d.id)}
				<div class="w-12">
				<DigimonIcon
					digimon={d}
					variant="viewer"
					onClick={() => extendLeft(d)}
				/>
				</div>
			{/each}
		</div>

		<!-- Chain -->
		<div class="flex items-center gap-4">
			{#each chain as id, i (id)}
				{@const d = digimonById.get(id)}
				{#if d}
					<div class="w-14">
					<DigimonIcon
						digimon={d}
						variant="viewer"
						selected
						onClick={() => trimChain(d)}
					/>
					</div>
				{/if}

				{#if i < chain.length - 1}
					<MdiChevronRight class="opacity-50 -mx-2" />
				{/if}
			{/each}
		</div>

		<!-- Evolutions -->
		<div class="flex flex-col gap-2">
			{#each evos.filter(notInChain) as d (d.id)}
				<div class="w-12">
					<DigimonIcon
						digimon={d}
						variant="viewer"
						onClick={() => extendRight(d)}
					/>
				</div>
			{/each}
		</div>
	</div>

{/if}

