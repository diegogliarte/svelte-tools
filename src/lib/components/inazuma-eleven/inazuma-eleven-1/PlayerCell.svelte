<script lang="ts">
	import Cell from '$lib/components/ui/cell.svelte';
	import { openModal } from '$lib/states/modal.svelte';
	import { getElementClass, type Player } from '$lib/utils/inazuma-eleven-1.utils';

	const positionColor = {
		GK: 'bg-yellow-900',
		DF: 'bg-blue-900',
		MF: 'bg-green-900',
		FW: 'bg-red-900',
		'?': 'bg-neutral-700'
	} satisfies Record<Player['position'], string>;

	let { player }: { player: Player } = $props();

	async function open() {
		const { default: PlayerModal } = await import('./PlayerModal.svelte');
		openModal(PlayerModal, { player });
	}
</script>

<Cell image={player.image} imageAlt={player.name} thumbnailClass={getElementClass(player.element)} onClick={open}>
	<div>
		<div class="leading-none">{player.name}</div>
		<div class="inline-block border px-1 text-xs {positionColor[player.position]}">
			{player.position}
		</div>
	</div>
</Cell>
