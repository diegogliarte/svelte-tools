<script lang="ts">
	import Modal from '$lib/components/ui/modal.svelte';
	import SelectInput from '$lib/components/ui/select-input.svelte';
	import TypeBadge from '$lib/components/pokemon/TypeBadge.svelte';
	import PokemonLearnerGrid from '$lib/components/pokemon/PokemonLearnerGrid.svelte';
	import { openModal } from '$lib/states/modal.svelte';
	import type { GenerationData, MainMove, MainPokemon } from '$lib/data/pokemon-main-series/data';
	let { move, data, onClose }: { move: MainMove; data: GenerationData; onClose?: () => void } = $props();
	let group = $state(data.versionGroups[0].value);
	const learnerGroups = $derived.by(() => {
		const methods = [
			...new Set(
				data.pokemon.flatMap((pokemon) =>
					(pokemon.learnset[group] ?? []).filter((entry) => entry.name === move.name).map((entry) => entry.method)
				)
			)
		];
		return methods.map((label) => ({
			label,
			pokemon: data.pokemon.filter((pokemon) =>
				(pokemon.learnset[group] ?? []).some((entry) => entry.name === move.name && entry.method === label)
			)
		}));
	});
	async function openPokemon(pokemon: MainPokemon) {
		const { default: PokemonModal } = await import('./PokemonModal.svelte');
		openModal(PokemonModal, { pokemon, data });
	}
</script>

<Modal title={move.name} {onClose}>
	<div class="mb-4 flex items-center gap-2">
		<TypeBadge type={move.type} /><span class="text-sm">{move.category}</span>
	</div>
	<div class="mb-4 grid grid-cols-2 gap-1 text-xs sm:grid-cols-3">
		<div>Power: <b>{move.power ?? '—'}</b></div>
		<div>PP: <b>{move.pp}</b></div>
		<div>Accuracy: <b>{move.accuracy == null ? '—' : `${move.accuracy}%`}</b></div>
		<div>Target: <b>{move.target}</b></div>
	</div>
	<p class="mb-4 text-sm opacity-70">{move.description}</p>
	<h3 class="mb-2 font-bold">Learned By</h3>
	<div class="mb-3 w-52">
		<SelectInput
			label="Learnset"
			bind:value={group}
			allowEmpty={false}
			persist={false}
			options={data.versionGroups.map(({ value, label }) => ({ value, label }))}
		/>
	</div>
	<div class="grid gap-4 sm:grid-cols-2">
		{#each learnerGroups as section (section.label)}
			<div>
				<h4 class="mb-1 text-sm text-accent">{section.label}</h4>
				<PokemonLearnerGrid
					learners={section.pokemon.map((entry) => ({
						id: entry.id,
						name: entry.name,
						image: entry.sprite,
						primaryType: entry.types[0]
					}))}
					onSelect={(learner) => {
						const pokemon = data.pokemon.find((entry) => entry.id === learner.id);
						if (pokemon) openPokemon(pokemon);
					}}
				/>
			</div>
		{/each}
	</div>
</Modal>
