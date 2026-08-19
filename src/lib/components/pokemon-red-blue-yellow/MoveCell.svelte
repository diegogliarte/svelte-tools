<script lang="ts">
	import Cell from '$lib/components/ui/cell.svelte';
	import { openModal } from '$lib/states/modal.svelte';
	import type { Gen1Move, Gen1Pokemon } from '$lib/data/pokemon-red-blue-yellow/data';
	import TypeBadge from './TypeBadge.svelte';

	let { move, pokemonList, moves }: { move: Gen1Move; pokemonList: Gen1Pokemon[]; moves: Gen1Move[] } = $props();
	async function open() {
		const { default: MoveModal } = await import('./MoveModal.svelte');
		openModal(MoveModal, { move, pokemonList, moves });
	}
</script>

<Cell onClick={open}><TypeBadge type={move.type} /><span>{move.name}</span></Cell>
