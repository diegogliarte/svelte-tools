<script lang="ts">
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import DataTable, { type Column } from '$lib/components/ui/data-table.svelte';
	import CheckboxChipGroup from '$lib/components/ui/checkbox-chip-group.svelte';
	import NumberInput from '$lib/components/ui/number-input.svelte';
	import { createLocalStorageState } from '$lib/states/local-storage.svelte';

	import { buildEvolvesFromMap, computeRecruitRate, type Pokemon } from '$lib/utils/pmd-blue.utils';
	import RecruitPokemonCell from '$lib/components/pmd-blue/RecruitPokemonCell.svelte';
	import RecruitPokemonStatusCell from '$lib/components/pmd-blue/RecruitPokemonStatusCell.svelte';

	type ProgressStatus = 'Have' | 'Ready' | 'Pre-evo' | '—';
	type RecruitRow = Pokemon & {
		effectiveRate: number;
		progressStatus: ProgressStatus;
		baseRate: number;
		friendArea: string;
		locations: string;
		evolvesFrom: string;
		notes: string;
	};

	const _state = createLocalStorageState(
		{
			leaderLevel: 90,
			friendBow: false,
			hideUnrecruitable: false,
			collection: {
				owned: {} as Record<string, number>,
				readyToEvolve: {} as Record<string, boolean>
			}
		},
		{
			fallbackKeys: ['tool-state:/pokemon-mystery-dungeon/blue-rescue-team/recruitment-checklist']
		}
	);

	const recruitOptions = [
		{ value: 'friendBow', label: 'Friend Bow' },
		{ value: 'hideUnrecruitable', label: 'Hide unrecruitable' }
	];

	let recruitFilter = $state<Record<string, boolean>>({
		friendBow: _state.friendBow,
		hideUnrecruitable: _state.hideUnrecruitable
	});

	$effect(() => {
		_state.friendBow = !!recruitFilter.friendBow;
		_state.hideUnrecruitable = !!recruitFilter.hideUnrecruitable;
	});

	interface Props {
		pokemons: Pokemon[];
	}

	let { pokemons }: Props = $props();

	const pokemonByName = $derived(new Map<string, Pokemon>(pokemons.map((p) => [p.name, p])));

	const evolvesFromMap = $derived(buildEvolvesFromMap(pokemons));

	function ownedCount(pokemon: Pokemon) {
		return Number(_state.collection.owned[pokemon.name]) || 0;
	}

	function isOwned(pokemon: Pokemon) {
		return ownedCount(pokemon) > 0;
	}

	function isReadyToEvolve(pokemon: Pokemon) {
		return !!_state.collection.readyToEvolve[pokemon.name];
	}

	function setOwnedCount(pokemon: Pokemon, nextCount: number) {
		const count = Math.max(0, Math.min(nextCount, evolutionCapacity(pokemon)));
		_state.collection.owned = { ..._state.collection.owned, [pokemon.name]: count };

		if (!count) {
			_state.collection.readyToEvolve = { ..._state.collection.readyToEvolve, [pokemon.name]: false };
		}
	}

	function evolutionCapacity(pokemon: Pokemon) {
		const descendants = new SvelteSet<string>();

		function collectDescendants(current: Pokemon) {
			for (const evolution of current.evolution ?? []) {
				if (descendants.has(evolution.to)) continue;
				descendants.add(evolution.to);

				const next = pokemonByName.get(evolution.to);
				if (next) collectDescendants(next);
			}
		}

		collectDescendants(pokemon);
		return (
			1 +
			[...descendants].filter((name) => {
				const descendant = pokemonByName.get(name);
				return !descendant || !isOwned(descendant);
			}).length
		);
	}

	const preEvolutionIds = $derived.by(() => {
		const available = new SvelteSet<string>();

		for (const source of pokemons) {
			const copies = ownedCount(source);
			if (!copies) continue;

			const lowestRequiredCopies = new SvelteMap<string, number>([[source.name, 1]]);

			function visit(current: Pokemon, requiredCopies: number) {
				for (const evolution of current.evolution ?? []) {
					const next = pokemonByName.get(evolution.to);
					if (!next) continue;

					const nextRequiredCopies = requiredCopies + (isOwned(next) ? 0 : 1);
					const previousRequirement = lowestRequiredCopies.get(next.name);
					if (previousRequirement !== undefined && previousRequirement <= nextRequiredCopies) continue;

					lowestRequiredCopies.set(next.name, nextRequiredCopies);

					if (copies >= nextRequiredCopies) available.add(next.name);

					visit(next, nextRequiredCopies);
				}
			}

			visit(source, 1);
		}

		return available;
	});

	function hasPreEvolution(pokemon: Pokemon) {
		return preEvolutionIds.has(pokemon.name);
	}

	function toggleReadyToEvolve(pokemon: Pokemon) {
		if (!hasPreEvolution(pokemon)) return;

		_state.collection.readyToEvolve = {
			..._state.collection.readyToEvolve,
			[pokemon.name]: !isReadyToEvolve(pokemon)
		};
	}

	function progressStatus(pokemon: Pokemon): ProgressStatus {
		if (isOwned(pokemon)) return 'Have';
		if (isReadyToEvolve(pokemon) && hasPreEvolution(pokemon)) return 'Ready';
		if (hasPreEvolution(pokemon)) return 'Pre-evo';
		return '—';
	}

	function progressStatusClass(status: ProgressStatus) {
		if (status === 'Have') return 'text-green-300';
		if (status === 'Ready') return 'text-accent';
		if (status === 'Pre-evo') return 'text-yellow-200';
		return 'text-white/50';
	}

	function ownSearchParts(pokemon: Pokemon): string[] {
		const parts: string[] = [pokemon.name];

		if (pokemon.encounter.friendArea) {
			parts.push(pokemon.encounter.friendArea);
		}

		if (pokemon.encounter.note) {
			parts.push(pokemon.encounter.note);
		}

		if (pokemon.recruit.note) {
			parts.push(pokemon.recruit.note);
		}

		for (const loc of pokemon.encounter.locations ?? []) {
			if (loc.dungeon) parts.push(loc.dungeon);
			if (loc.floors) parts.push(loc.floors);
		}

		return parts;
	}

	function buildInheritedSearchParts(pokemonName: string, visited = new SvelteSet<string>()): string[] {
		if (visited.has(pokemonName)) return [];
		visited.add(pokemonName);

		const parts: string[] = [];
		const sources = evolvesFromMap[pokemonName] ?? [];

		for (const source of sources) {
			parts.push(source.from);
			parts.push(source.method);

			const prevo = pokemonByName.get(source.from);
			if (prevo) {
				parts.push(...ownSearchParts(prevo));
				parts.push(...buildInheritedSearchParts(prevo.name, visited));
			}
		}

		return parts;
	}

	const searchIndexByName = $derived.by(() => {
		const map: Record<string, string> = {};

		for (const pokemon of pokemons) {
			const allParts = [...ownSearchParts(pokemon), ...buildInheritedSearchParts(pokemon.name)];

			map[pokemon.name] = Array.from(new Set(allParts.filter(Boolean).map((s) => String(s).trim().toLowerCase()))).join(
				' '
			);
		}

		return map;
	});

	const rows = $derived.by(() => {
		let list: RecruitRow[] = pokemons.map((pokemon) => {
			const sources = evolvesFromMap[pokemon.name] ?? [];
			const locations = pokemon.encounter.locations.length
				? pokemon.encounter.locations
						.map((location) => (location.floors ? `${location.dungeon} (${location.floors})` : location.dungeon))
						.join('\n')
				: '—';

			return {
				...pokemon,
				effectiveRate: computeRecruitRate(pokemon, _state.leaderLevel, _state.friendBow),
				progressStatus: progressStatus(pokemon),
				baseRate: pokemon.recruit.rate,
				friendArea: pokemon.encounter.friendArea ?? '—',
				locations,
				evolvesFrom: sources.length ? sources.map((e) => `${e.from} (${e.method})`).join('\n') : '—',
				notes: pokemon.recruit.note ?? pokemon.encounter.note ?? '—'
			};
		});

		if (_state.hideUnrecruitable) {
			list = list.filter((pokemon) => pokemon.effectiveRate > 0);
		}

		return list;
	});

	const ownedPokemonCount = $derived(pokemons.filter((pokemon) => isOwned(pokemon)).length);
	const readyToEvolveCount = $derived(pokemons.filter((pokemon) => isReadyToEvolve(pokemon)).length);

	const pokemonColumn: Column<RecruitRow> = {
		key: 'name',
		label: 'Pokémon',

		searchValue: (pokemon) => searchIndexByName[pokemon.name] ?? pokemon.name.toLowerCase(),

		renderComponent: (pokemon) => ({
			component: RecruitPokemonCell,
			props: {
				pokemon,
				count: ownedCount(pokemon)
			}
		})
	};

	const baseRateColumn: Column<RecruitRow> = {
		key: 'baseRate',
		label: 'Base Rate',

		sortValue: (pokemon) => pokemon.baseRate,

		value: (pokemon) => `${pokemon.baseRate}%`
	};

	const progressStatusColumn: Column<RecruitRow> = {
		key: 'progressStatus',
		label: 'Status',
		sortValue: (pokemon) => ['Ready', 'Pre-evo', '—', 'Have'].indexOf(pokemon.progressStatus),
		class: (pokemon) => progressStatusClass(pokemon.progressStatus),
		renderComponent: (pokemon) => ({
			component: RecruitPokemonStatusCell,
			props: {
				status: pokemon.progressStatus,
				canToggleReady: !isOwned(pokemon) && hasPreEvolution(pokemon),
				onToggleReady: () => toggleReadyToEvolve(pokemon)
			}
		})
	};

	const effectiveRateColumn: Column<RecruitRow> = {
		key: 'effectiveRate',
		label: 'Effective Rate',

		sortValue: (pokemon) => pokemon.effectiveRate,

		class: (pokemon) => {
			const r = pokemon.effectiveRate;
			return r > 10 ? 'text-green-600' : r > 0 ? 'text-yellow-600' : 'text-red-600';
		},
		value: (pokemon) => `${pokemon.effectiveRate.toFixed(1)}%`
	};

	const friendAreaColumn: Column<RecruitRow> = {
		key: 'friendArea',
		label: 'Friend Area',

		sortValue: (pokemon) => pokemon.friendArea,

		value: (pokemon) => pokemon.friendArea
	};

	const locationsColumn: Column<RecruitRow> = {
		key: 'locations',
		label: 'Locations',
		class: 'whitespace-pre-line',

		value: (pokemon) => pokemon.locations
	};

	const evolvesFromColumn: Column<RecruitRow> = {
		key: 'evolvesFrom',
		label: 'Evolves From',
		class: 'whitespace-pre-line',

		value: (pokemon) => pokemon.evolvesFrom
	};

	const notesColumn: Column<RecruitRow> = {
		key: 'notes',
		label: 'Notes',
		width: '25%',

		value: (pokemon) => pokemon.notes
	};

	const columns: Column<RecruitRow>[] = [
		pokemonColumn,
		progressStatusColumn,
		baseRateColumn,
		effectiveRateColumn,
		friendAreaColumn,
		locationsColumn,
		evolvesFromColumn,
		notesColumn
	];

	function cyclePokemon(row: RecruitRow) {
		const nextCount = ownedCount(row) + 1;
		setOwnedCount(row, nextCount > evolutionCapacity(row) ? 0 : nextCount);
	}
</script>

{#if pokemons.length}
	<div class="flex flex-col gap-4">
		<div class="flex flex-wrap gap-x-6 gap-y-1 text-sm">
			<div><span class="opacity-60">Owned</span> {ownedPokemonCount}/{pokemons.length}</div>
			<div><span class="opacity-60">Ready to evolve</span> {readyToEvolveCount}</div>
		</div>

		<div class="flex flex-wrap items-end justify-center gap-6">
			<div class="w-48">
				<NumberInput label="Leader Level" bind:value={_state.leaderLevel} min={0} max={100} step={1} />
			</div>

			<div class="min-w-64">
				<CheckboxChipGroup
					label="Recruit Options"
					options={recruitOptions}
					bind:checked={recruitFilter}
					showActions={false}
				/>
			</div>
		</div>
	</div>

	<DataTable
		{columns}
		{rows}
		pageSize={50}
		onRowClick={cyclePokemon}
		rowKey={(pokemon) => pokemon.name}
		resetPageOnRowsChange={false}
	/>
{:else}
	<p class="text-center opacity-60">Loading Pokémon...</p>
{/if}
