<script lang="ts">
	import Cell from '$lib/components/ui/cell.svelte';
	import TypeBadge from '$lib/components/pokemon/TypeBadge.svelte';
	import { openModal } from '$lib/states/modal.svelte';
	import type { GenerationData, MainMove } from '$lib/data/pokemon-main-series/data';
	let { move, data }: { move: MainMove; data: GenerationData } = $props();
	async function open() {
		const { default: MoveModal } = await import('./MoveModal.svelte');
		openModal(MoveModal, { move, data });
	}
</script>

<Cell onClick={open}><TypeBadge type={move.type} /><span>{move.name}</span></Cell>
