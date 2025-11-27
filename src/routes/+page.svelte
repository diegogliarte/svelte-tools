<script lang="ts">
	import { toolsTree } from "$lib/core/tools-tree";
	import { generateToolURLs } from "$lib/core/tools-registry";

	const entries = generateToolURLs(toolsTree);
</script>

<h1>All Tools</h1>

<ul>
	{#each entries as { url, tool } (url)}
		<li>
			<a href={url}>
				{tool.title}
			</a>
			— {tool.description}
		</li>
	{/each}
</ul>
