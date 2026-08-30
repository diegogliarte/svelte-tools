<script lang="ts">
	import MdiCrown from '~icons/mdi/crown';

	interface Props {
		name: string;
		wikiPath?: string;
		isBoss?: boolean;
	}

	let { name, wikiPath, isBoss = false }: Props = $props();
</script>

<div class="flex items-center gap-1.5">
	{#if isBoss}
		<span title="Boss assignment"><MdiCrown class="shrink-0 text-yellow-300" /></span>
	{/if}
	{#if wikiPath}
		<a
			href={`https://oldschool.runescape.wiki/w/${wikiPath}`}
			target="_blank"
			rel="noreferrer"
			class="hover:text-accent hover:underline"
		>
			{name}
		</a>
	{:else}
		<span>{name}</span>
	{/if}
</div>
