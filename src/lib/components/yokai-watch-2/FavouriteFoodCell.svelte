<script lang="ts">
	import { getFavouriteFoodIcon } from '$lib/utils/yokai-watch-2.utils';

	interface Props {
		food: string;
	}

	let { food }: Props = $props();
</script>

{#if food}
	<div class="flex flex-col items-center gap-1 text-center">
		<img src={getFavouriteFoodIcon(food)} alt={food} class="h-9 w-36 object-contain" loading="lazy" />
		<span class="text-xs text-accent">{food}</span>
	</div>
{:else}
	<span>—</span>
{/if}
