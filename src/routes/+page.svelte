<script lang="ts">
	import ToolCategorySection from "$lib/components/ToolCategorySection.svelte";
	import { toolsTree } from "$lib/core/tools-tree";
</script>

<svelte:head>
	<title>Home | Tools</title>
	<meta name="description" content="Browse all available tools." />

	<meta property="og:title" content="Home | Tools" />
	<meta property="og:description" content="Browse all available tools." />
</svelte:head>


<div class="flex flex-col">
	{#each toolsTree as category (category.name)}
		<ToolCategorySection {category} />
	{/each}
</div>
