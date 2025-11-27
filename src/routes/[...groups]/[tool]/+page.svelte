<script lang="ts">
	import { findTool } from "$lib/core/tools-registry";
	import { toolsTree } from "$lib/core/tools-tree";

	let { params } = $props();

	console.log(params);
	const categoryPath = params.groups.split("/");
	const toolSlug = params.tool;

	const tool = findTool(categoryPath, toolSlug, toolsTree);
</script>

{#if tool}
	<h1>{tool.title}</h1>
	<p>{tool.description}</p>

	{@const Component = tool.component}
	<Component />
{:else}
	<p>Tool not found</p>
{/if}
