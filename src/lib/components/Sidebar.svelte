<script lang="ts">
	import { toolsTree } from "$lib/core/tools-tree";
	import { page } from "$app/state";
	import MdiChevronDown from "~icons/mdi/chevron-down";
	import MdiChevronRight from "~icons/mdi/chevron-right";

	interface Props {
		visible: boolean;
	}

	let { visible = $bindable() }: Props = $props();

	let collapsed: Record<string, boolean> = $state({});

	function toggleCategory(cat: string) {
		console.log("toggling", cat);
		collapsed[cat] = !collapsed[cat];
	}
</script>

<div
	class="
	h-screen
	border-r
	overflow-y-auto
	transition-transform
	{visible ? '' : 'hidden'}
	w-40
	p-1 flex flex-col gap-1 text-small
	z-50
"
>

	{#each toolsTree as category (category)}
		<div>
			<button
				class="w-full flex items-center text-left hover:text-accent py-1 cursor-pointer"
				onclick={() => toggleCategory(category.name)}
			>
				{#if collapsed[category.name]}
					<MdiChevronRight />
				{:else}
					<MdiChevronDown />
				{/if}
				<span>
					{category.name}
				</span>
			</button>

			<!-- Tools -->
			{#if !collapsed[category.name]}
				<div class="border-l border-text pl-2 flex flex-col">
					{#each category.tools as tool (tool.href)}
						<a
							href={tool.href}
							class="
								py-0.5 hover:text-accent truncate
								{page.url.pathname === tool.href ? 'text-accent' : ''}
							"
							title={tool.title}
						>
							{tool.title}
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/each}

</div>
