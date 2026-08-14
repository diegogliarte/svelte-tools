<script lang="ts">
	import Cell from '$lib/components/ui/cell.svelte';
	import type { Yokai } from '$lib/data/yokai-watch-2/data';
	import { openModal } from '$lib/states/modal.svelte';
	import { getYokaiRankClass, getYokaiTribeClass } from '$lib/utils/yokai-watch-2.utils';

	interface Props {
		yokai: Yokai;
	}

	let { yokai }: Props = $props();

	async function open() {
		const { default: YokaiModal } = await import('$lib/components/yokai-watch-2/YokaiModal.svelte');
		openModal(YokaiModal, { yokai });
	}
</script>

<Cell image={yokai.image} imageAlt={yokai.name} thumbnailClass={getYokaiTribeClass(yokai.tribe)} onClick={open}>
	<div>
		<div class="leading-none">{yokai.name}</div>

		<div class="mt-1 flex flex-wrap gap-1 text-xs">
			{#if yokai.tribe}
				<span class="border px-1 {getYokaiTribeClass(yokai.tribe)}">{yokai.tribe}</span>
			{/if}
			{#if yokai.rank}
				<span class="border px-1 {getYokaiRankClass(yokai.rank)}">Rank {yokai.rank}</span>
			{/if}
		</div>
	</div>
</Cell>
