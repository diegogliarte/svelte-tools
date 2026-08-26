<script lang="ts">
	import Cell from '$lib/components/ui/cell.svelte';
	import ElementBadge from '$lib/components/inazuma-eleven/ElementBadge.svelte';
	import { openModal } from '$lib/states/modal.svelte';
	import type { Hissatsu } from '$lib/utils/inazuma-eleven-vr.utils';

	let { hissatsu }: { hissatsu: Hissatsu } = $props();

	async function open() {
		const { default: HissatsuModal } = await import('./HissatsuModal.svelte');
		openModal(HissatsuModal, { hissatsu });
	}
</script>

<Cell onClick={open}>
	<ElementBadge element={hissatsu.Element} />
	<span>{hissatsu.Name}</span>
</Cell>
