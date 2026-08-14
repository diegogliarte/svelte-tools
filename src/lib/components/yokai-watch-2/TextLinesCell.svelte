<script lang="ts">
	interface Props {
		lines: string[];
	}

	let { lines }: Props = $props();
</script>

{#if lines.length > 0}
	<ul class="space-y-1">
		{#each lines as line (line)}
			<li>{line}</li>
		{/each}
	</ul>
{:else}
	<span>—</span>
{/if}
