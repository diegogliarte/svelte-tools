<script lang="ts">
	import type { ToolCategory } from "$lib/tools/types";

	export let category: ToolCategory;
	export let parentPath: string = "";

	const categoryPath = parentPath
		? `${parentPath}/${category.name}`
		: category.name;

	function toolUrl(title: string) {
		const slug = title.toLowerCase().replace(/\s+/g, "-");
		const path = categoryPath.toLowerCase().replace(/\s+/g, "-");
		return `/${path}/${slug}`;
	}
</script>

<section class="mb-4 last:mb-0">
	<h3 class="text-medium mb-1">{category.name}</h3>

	<!-- Tools directly inside this category -->
	{#if category.tools.length > 0}
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
			{#each category.tools as tool (tool)}
				<a
					href={toolUrl(tool.title)}
					class="
					border px-2 py-1
					hover:border-accent hover:bg-accent-dark
					transition-colors
				"
				>
					<div class="font-medium truncate">{tool.title}</div>
					<div class="text-small line-clamp-2">{tool.description}</div>
				</a>
			{/each}
		</div>
	{/if}

	<!-- Recursive subgroups -->
	{#each category.subgroups as subgroup (subgroup)}
		<svelte:self category={subgroup} parentPath={categoryPath} />
	{/each}
</section>
