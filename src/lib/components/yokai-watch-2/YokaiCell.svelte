<script lang="ts">
	import Cell from '$lib/components/ui/cell.svelte';
	import type { BaffleBoard } from '$lib/data/yokai-watch-2/data';
	import { getYokaiRankClass, getYokaiTribeClass } from '$lib/utils/yokai-watch-2.utils';

	interface Props {
		yokai: BaffleBoard;
	}

	let { yokai }: Props = $props();
</script>

<Cell image={yokai.image} imageAlt={yokai.name} thumbnailClass={getYokaiTribeClass(yokai.tribe)}>
	<div>
		<div class="leading-none">{yokai.name}</div>

		<div class="mt-1 flex gap-1 text-xs">
			<span class="border px-1 {getYokaiTribeClass(yokai.tribe)}">{yokai.tribe}</span>
			<span class="border px-1 {getYokaiRankClass(yokai.rank)}">Rank {yokai.rank}</span>
		</div>
	</div>
</Cell>
