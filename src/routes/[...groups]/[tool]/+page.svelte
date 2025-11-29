<script lang="ts">
	import { findTool } from '$lib/core/tools-registry';
	import { toolsTree } from '$lib/core/tools-tree';

	let { params } = $props();

	const categoryPath = params.groups.split("/");
	const toolSlug = params.tool;

	const tool = findTool(categoryPath, toolSlug, toolsTree);
</script>

<svelte:head>
	<title>{tool?.title ?? "Not Found"} | Tools</title>
	<meta name="description" content={tool?.description ?? "Not Found"} />

	<meta property="og:title" content={tool?.title ?? "Not Found"} />
	<meta property="og:description" content={tool?.description ?? "Not Found"} />
</svelte:head>


{#if tool}
	<h1 class="text-center text-large">{tool.title}</h1>
	<h2 class="text-center">{tool.description}</h2>

	{@const Component = tool.component}

	<div class="flex flex-col mx-auto max-w-2xl {!tool.removeBorder ? 'border-1' : '' } border-text p-8 m-4 mt-16 gap-8">
		<Component />
	</div>

{:else}
	<p>Tool not found</p>
{/if}
