<script lang="ts">
	import ToolCategorySection from "$lib/components/ToolCategorySection.svelte";
	import { toolsTree } from "$lib/core/tools-tree";
</script>

<h1 class="text-large mb-12">All Tools</h1>

<div class="flex flex-col">
	{#each toolsTree as category (category)}
		<ToolCategorySection {category} />
	{/each}
</div>
