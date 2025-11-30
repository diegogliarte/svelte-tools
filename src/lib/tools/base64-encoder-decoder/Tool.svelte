<script lang="ts">
	import TextInput from '$lib/components/ui/text-input.svelte';
	import LabeledRow from '$lib/components/ui/labeled-row.svelte';

	let text = $state("");
	let encoded = $state("");
	let decoded = $state("");

	$effect(() => {
		try {
			encoded = text ? btoa(text) : "-";
		} catch {
			encoded = "Invalid input for Base64 encoding";
		}

		try {
			decoded = text ? atob(text) : "-";
		} catch {
			decoded = "Invalid Base64 string";
		}
	});
</script>

<TextInput
	bind:value={text}
	label="Text"
	placeholder="Enter text…"
/>

<div class="flex flex-col gap-1">
	<LabeledRow
		label="Base64 Encoded"
		value={encoded}
		group="base64-tool"
	/>

	<LabeledRow
		label="Base64 Decoded"
		value={decoded}
		group="base64-tool"
	/>
</div>
