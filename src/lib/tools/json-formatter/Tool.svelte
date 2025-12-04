<script lang="ts">
	import TextArea from "$lib/components/ui/text-area.svelte";

	let input = $state("");
	let formatted = $state("");

	$effect(() => {
		if (!input) {
			formatted = "";
			return;
		}

		try {
			formatted = JSON.stringify(JSON.parse(input), null, 4);
		} catch {
			formatted = "Invalid JSON";
		}
	});
</script>

<div class="flex gap-4">
	<TextArea
		label="JSON Input"
		bind:value={input}
		placeholder="Paste JSON…"
		displayLines
	/>

	<TextArea
		label="Formatted JSON"
		value={formatted}
		readonly
		displayLines
	/>
</div>
