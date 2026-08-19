<script lang="ts">
	import TypeBadge from '$lib/components/pokemon/TypeBadge.svelte';
	let { types }: { types: string[] } = $props();
</script>

<div class="flex gap-1">
	{#each types as type (type)}<TypeBadge {type} />{/each}
</div>
