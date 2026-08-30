<script lang="ts">
	import MdiCrown from '~icons/mdi/crown';

	type Alternative = { name: string; wikiPath?: string; isBoss: boolean; unavailable?: boolean; detail?: string };
	interface Props {
		alternatives: Alternative[];
	}

	let { alternatives }: Props = $props();
</script>

{#if alternatives.length}
	<div class="flex flex-wrap gap-x-2 gap-y-1">
		{#each alternatives as alternative (alternative.name)}
			<span
				class="inline-flex items-center gap-0.5 {alternative.unavailable ? 'opacity-35' : ''}"
				title={alternative.detail}
			>
				{#if alternative.isBoss}<MdiCrown class="text-yellow-300" />{/if}
				{#if alternative.wikiPath}
					<a
						href={`https://oldschool.runescape.wiki/w/${alternative.wikiPath}`}
						target="_blank"
						rel="noreferrer"
						class="hover:text-accent hover:underline"
					>
						{alternative.name}
					</a>
				{:else}
					{alternative.name}
				{/if}
			</span>
		{/each}
	</div>
{:else}
	<span class="opacity-40">—</span>
{/if}
