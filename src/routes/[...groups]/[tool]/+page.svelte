<script lang="ts">
	import { findTool } from '$lib/core/tools-registry';
	import { toolsTree } from '$lib/core/tools-tree';

	let { params } = $props();

	const categoryPath = params.groups.split("/");
	const toolSlug = params.tool;

	const tool = findTool(categoryPath, toolSlug, toolsTree);
</script>

{#if tool}
	<h1 class="text-center text-large">{tool.title}</h1>
	<h2 class="text-center text-small">{tool.description}</h2>

	{@const Component = tool.component}

	<div class="flex flex-col items-center justify-center mx-auto max-w-2xl border-1 p-8 m-4 gap-8">
		<Component />
	</div>

{:else}
	<p>Tool not found</p>
{/if}
