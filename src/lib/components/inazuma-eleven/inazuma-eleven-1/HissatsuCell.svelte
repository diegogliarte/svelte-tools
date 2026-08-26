<script lang="ts">
	import Cell from '$lib/components/ui/cell.svelte';
	import ElementBadge from '$lib/components/inazuma-eleven/ElementBadge.svelte';
	import { openModal } from '$lib/states/modal.svelte';
	import type { Move, Player } from '$lib/utils/inazuma-eleven-1.utils';

	let { move, players }: { move: Move; players: Player[] } = $props();

	async function open() {
		const { default: HissatsuModal } = await import('./HissatsuModal.svelte');
		openModal(HissatsuModal, { move, players });
	}
</script>

<Cell onClick={open}>
	<ElementBadge element={move.element} />
	<span>{move.name}</span>
</Cell>
