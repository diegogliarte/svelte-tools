<script lang="ts">
	import { copy } from "$lib/utils/clipboard.utils";
	import Icon from "@iconify/svelte";

	interface Props {
		value: string;
	}

	let {
		value,
	}: Props = $props();

	let copied = $state(false);

	async function handleClick() {
		if (!value) return;

		if (await copy(value)) {
			copied = true;
			setTimeout(() => copied = false, 500);
		}
	}
</script>

<button
	type="button"
	class="
		cursor-pointer
		hover:text-accent
		transition-colors
	"
	onclick={handleClick}
	title="Copy"
>
	{#if copied}
		<Icon icon="mdi:check" class="text-accent" />
	{:else}
		<Icon icon="mdi:content-copy"/>
	{/if}
</button>
