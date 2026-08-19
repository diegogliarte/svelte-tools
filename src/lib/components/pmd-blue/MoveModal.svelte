<script lang="ts">
	import { onMount } from 'svelte';
	import Modal from '$lib/components/ui/modal.svelte';
	import FlagBadges from './FlagBadges.svelte';
	import PokemonIcon from '$lib/components/pmd-blue/PokemonIcon.svelte';

	import {
		loadMoveFlags,
		loadPokemonMoves,
		loadPokemons,
		type Move,
		type MoveFlags,
		type PokemonMoves
	} from '$lib/data/pmd-blue/data';

	import type { Pokemon } from '$lib/utils/pmd-blue.utils';
	import { getPokemonTypeColor } from '$lib/utils/pokemon.utils';

	interface Props {
		move: Move;
		onClose?: () => void;
	}

	let { move, onClose }: Props = $props();

	let moveFlags = $state<MoveFlags>({ damageFlags: [], otherFlags: [] });
	let pokemons = $state<Pokemon[]>([]);
	let pokemonMoves = $state<PokemonMoves[]>([]);

	onMount(async () => {
		[moveFlags, pokemons, pokemonMoves] = await Promise.all([loadMoveFlags(), loadPokemons(), loadPokemonMoves()]);
	});

	const pokemonById = $derived(new Map(pokemons.map((p) => [p.game_id, p])));

	const damageMap = $derived(Object.fromEntries(moveFlags.damageFlags.map((f) => [f.id, f.description])));
	const otherMap = $derived(Object.fromEntries(moveFlags.otherFlags.map((f) => [f.id, f.description])));

	function formatHits(move: Move) {
		const min = move.min_hits;
		const max = move.max_hits;
		if (min != null && max != null) return min === max ? `${min}` : `${min}-${max}`;
		if (min != null) return `${min}`;
		if (max != null) return `${max}`;
		return '—';
	}

	function formatHitMode(mode?: string | null) {
		if (!mode) return '—';
		if (mode === 'fixed') return 'Fixed';
		if (mode === 'range') return 'Range';
		return mode;
	}

	const learnedBy = $derived.by(() => {
		const moveId = move.id;
		if (moveId == null) return { levelUp: [], tm: [] } as { levelUp: Pokemon[]; tm: Pokemon[] };

		const levelUp: Pokemon[] = [];
		const tm: Pokemon[] = [];

		for (const entry of pokemonMoves) {
			const p = pokemonById.get(entry.pokemon_id);
			if (!p) continue;

			if (entry.levelup_moves?.some((m) => m.move_id === moveId)) {
				levelUp.push(p);
			}

			if (entry.aux_moves?.includes(moveId)) {
				tm.push(p);
			}
		}

		return { levelUp, tm };
	});
</script>

<Modal title={move?.name} {onClose}>
	<div class="mb-4 flex items-center gap-2">
		<div class="h-3 w-3 {getPokemonTypeColor(move.type)}"></div>
		<div class="text-sm">{move.type} · {move.class}</div>
	</div>

	<h3 class="mb-1 font-bold">Stats</h3>
	<div class="mb-4 grid grid-cols-2 gap-1 text-xs sm:grid-cols-3">
		<div>Power: <b>{move.power}</b></div>
		<div>PP: <b>{move.maxPP}</b></div>
		<div>Crit: <b>{move.crit}</b></div>
		<div>Acc1: <b>{move.acc1}</b></div>
		<div>Acc2: <b>{move.acc2}</b></div>
		<div>Targets: <b>{move.targets}</b></div>
		<div>Hits: <b>{formatHits(move)}</b></div>
		<div>Hit Mode: <b>{formatHitMode(move.hit_count_mode)}</b></div>
	</div>

	<h3 class="mb-1 font-bold">Flags</h3>
	<div class="flex flex-row gap-4 text-xs">
		<div>
			<div class="mb-1 font-semibold">Damage Flags</div>
			<FlagBadges flags={move.damageFlags} map={damageMap} />
		</div>

		<div>
			<div class="mb-1 font-semibold">Other Flags</div>
			<FlagBadges flags={move.otherFlags} map={otherMap} />
		</div>
	</div>

	<h3 class="mt-4 mb-2 font-bold">Learned By</h3>

	<div class="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
		{#if learnedBy.levelUp.length}
			<div>
				<div class="mb-1 font-semibold">Level Up</div>

				<div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
					{#each learnedBy.levelUp as p (p.id)}
						<PokemonIcon pokemon={p} />
					{/each}
				</div>
			</div>
		{/if}

		{#if learnedBy.tm.length}
			<div>
				<div class="mb-1 font-semibold">TM</div>

				<div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
					{#each learnedBy.tm as p (p.id)}
						<PokemonIcon pokemon={p} />
					{/each}
				</div>
			</div>
		{/if}

		{#if !learnedBy.levelUp.length && !learnedBy.tm.length}
			<div class="opacity-70">No Pokémon learn this move</div>
		{/if}
	</div>
</Modal>
