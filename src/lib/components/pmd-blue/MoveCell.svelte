<script lang="ts">
	import Cell from '$lib/components/ui/cell.svelte';
	import { openModal } from '$lib/states/modal.svelte';
	import type { Move } from '$lib/data/pmd-blue/data';
	import TypeBadge from '$lib/components/pokemon/TypeBadge.svelte';

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
	<TypeBadge type={move.type} />
	<span>{move.name}</span>
</Cell>
