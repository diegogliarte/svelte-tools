<script lang="ts">
	import { toolsTree } from "$lib/core/tools-tree";
	import { page } from "$app/state";
	import MdiChevronDown from "~icons/mdi/chevron-down";
	import MdiChevronRight from "~icons/mdi/chevron-right";

	interface Props {
		visible: boolean;
	}

	let { visible = $bindable() }: Props = $props();

	let collapsed: Record<string, boolean> = {};

	function toggleCategory(cat: string) {
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
	p-1 flex flex-col gap-1 text-small
"
>

	{#each toolsTree as category}
		<div>
			<button
				class="w-full flex items-center text-left hover:text-accent py-1"
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
					{#each category.tools as tool}
						<a
							href={tool.href}
							class="
								py-0.5 hover:text-accent
								{page.url.pathname === tool.href ? 'text-accent' : ''}
							"
						>
							{tool.title}
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/each}

</div>
