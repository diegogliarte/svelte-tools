<script lang="ts">
	interface Props {
		clues: string[];
	}

	let { clues }: Props = $props();
</script>

<ol class="space-y-1">
	{#each clues as clue, index (clue)}
		<li>{index + 1}. {clue}</li>
	{/each}
</ol>
