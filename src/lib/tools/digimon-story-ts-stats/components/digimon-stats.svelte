<script lang="ts">
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import CheckboxInput from '$lib/components/ui/checkbox-input.svelte';
	import SelectInput from '$lib/components/ui/select-input.svelte';

	import digimonRaw from '$lib/data/digimon-story-ts/digimon.json';
	import { makeFilter, unique, sortNoneLast } from '$lib/utils/filters.utils.svelte.js';
	import DigimonCell from '$lib/components/digimon-story-ts/DigimonCell.svelte';

	type Digimon = typeof digimonRaw[number];

	const digimon: Digimon[] = digimonRaw;

	const generations = unique(digimon.map(d => d.generation));
	const attributes  = unique(digimon.map(d => d.attribute));
	const types       = unique(digimon.map(d => d.type));
	const personalities = unique(digimon.map(d => d.base_personality));

	let generationFilter   = $state(makeFilter(generations));
	let attributeFilter    = $state(makeFilter(attributes));
	let typeFilter         = $state(makeFilter(types));
	let personalityFilter  = $state(makeFilter(personalities));

	let statLevel = $state<'lv1' | 'lv99'>('lv99');

	let ridableOnly = $state(false);

	const filteredRows = $derived.by(() => {
		const genSel  = Object.keys(generationFilter).filter(k => generationFilter[k]);
		const attrSel = Object.keys(attributeFilter).filter(k => attributeFilter[k]);
		const typeSel = Object.keys(typeFilter).filter(k => typeFilter[k]);
		const persSel = Object.keys(personalityFilter).filter(k => personalityFilter[k]);

		return digimon.filter(d =>
			(genSel.length  ? genSel.includes(d.generation) : true) &&
			(attrSel.length ? attrSel.includes(d.attribute) : true) &&
			(typeSel.length ? typeSel.includes(d.type) : true) &&
			(persSel.length ? persSel.includes(d.base_personality) : true) &&
			(!ridableOnly || d.ridable)
		);
	});

	const rows = $derived.by(() =>
		filteredRows.map(d => ({
			...d,
			...d.base_stats[statLevel]
		}))
	);

	const digimonColumn: Column = {
		key: 'name',
		label: 'Digimon',
		width: '260px',
		searchValue: d => `${d.name} ${d.generation} ${d.attribute} ${d.type}`,
		renderComponent: d => ({
			component: DigimonCell,
			props: { digimon: d }
		})
	};

	const attributeColumn: Column<Digimon> = {
		key: 'attribute',
		label: 'Attr',
		sortValue: d => d.attribute,
		render: d => `
		<div class="flex items-center gap-1 leading-none">
			<img
				src="/digimon-story-ts/${d.attribute.toLowerCase().replace(' ', '-')}.png"
				alt="${d.attribute}"
				class="h-[1.5em] w-[1.5em] shrink-0"
			/>
			<span>${d.attribute}</span>
		</div>
	`
	};


	const typeColumn: Column<Digimon> = {
		key: 'type',
		label: 'Type',
		sortValue: d => d.type
	};


	const totalColumn: Column<any> = {
		key: 'TOTAL',
		label: 'Total',

		sortValue: d =>
			d.HP + d.SP + d.ATK + d.DEF + d.INT + d.SPI + d.SPD,

		render: d =>
			String(d.HP + d.SP + d.ATK + d.DEF + d.INT + d.SPI + d.SPD)
	};


	const ridableColumn: Column<Digimon> = {
		key: 'ridable',
		label: 'Ridable',

		sortValue: d => d.ridable ? 1 : 0,
		render: d => d.ridable ? '✓' : '—'
	};


	const columns = $derived([
		digimonColumn,
		attributeColumn,
		typeColumn,

		{ key: 'HP',  label: 'HP' },
		{ key: 'SP',  label: 'SP' },
		{ key: 'ATK', label: 'ATK' },
		{ key: 'DEF', label: 'DEF' },
		{ key: 'INT', label: 'INT' },
		{ key: 'SPI', label: 'SPI' },
		{ key: 'SPD', label: 'SPD' },

		totalColumn,
		ridableColumn,
	]);

</script>

<!-- FILTERS -->
<div class="flex justify-around flex-col sm:flex-row gap-2 mb-4">
	<div class="flex flex-row sm:flex-col flex-wrap gap-1">
		{#each generations as g (g)}
			<CheckboxInput label={g} bind:checked={generationFilter[g]} />
		{/each}
	</div>

	<div class="flex flex-row sm:flex-col gap-1">
		{#each attributes as a (a)}
			<CheckboxInput label={a} bind:checked={attributeFilter[a]} />
		{/each}
	</div>

	<CheckboxInput
		label="Ridable only"
		bind:checked={ridableOnly}
	/>

	<SelectInput
		label="Stats Level"
		bind:value={statLevel}
		options={[
			{ value: 'lv1',  label: 'Lv. 1' },
			{ value: 'lv99', label: 'Lv. 99' }
		]}
	/>
</div>

<DataTable {columns} rows={rows} pageSize={50} />
