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
		collapsed[cat] = !collapsed[cat];
	}
</script>

<div
	class="
		sticky
		top-0
		min-w-sidebar
		w-sidebar
		h-screen
		border-r
		transition-transform
		{visible ? '' : 'hidden'}
		p-1 flex flex-col gap-1 text-xs
		overflow-y-auto
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
