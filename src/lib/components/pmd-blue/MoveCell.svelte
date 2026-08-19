<script lang="ts">
	import Cell from '$lib/components/ui/cell.svelte';
	import { openModal } from '$lib/states/modal.svelte';
	import type { Move } from '$lib/data/pmd-blue/data';
	import { getPokemonTypeColor } from '$lib/utils/pokemon.utils';

	interface Props {
		move: Move;
	}

	let { move }: Props = $props();

	async function open() {
		const { default: MoveModal } = await import('./MoveModal.svelte');
		openModal(MoveModal, { move });
	}
</script>

<Cell onClick={open}>
	<div class="h-2.5 w-2.5 {getPokemonTypeColor(move.type)}"></div>
	<span>{move.name}</span>
</Cell>
