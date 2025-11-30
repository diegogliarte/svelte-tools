<script lang="ts">
	import { copy } from "$lib/utils/clipboard.utils";
	import MdiContentCopy from "~icons/mdi/content-copy";
	import MdiCheck from "~icons/mdi/check";

	interface Props {
		value: string | number;
	}

	let {
		value,
	}: Props = $props();

	let copied = $state(false);

	async function handleClick() {
		if (!value) return;

		if (await copy(value.toString())) {
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
		<MdiCheck class="text-accent w-4 h-4" />
	{:else}
		<MdiContentCopy class="w-4 h-4" />
	{/if}
</button>
