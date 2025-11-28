<script lang="ts">
	import { labelGroups } from '$lib/states/label-groups.svelte.js';
	import CopyButton from "$lib/components/ui/copy-button.svelte";


	interface Props {
		label: string;
		value?: string | null;
		group?: string | null;
	}

	let {
		label,
		value = "",
		group,
	}: Props = $props();

	let labelEl: HTMLElement;

	$effect(() => {
		if (!labelEl || group == null) return;

		const width = labelEl.offsetWidth;
		const current = labelGroups[group] ?? 0;

		if (width > current) {
			labelGroups[group] = width;
		}
	});
</script>

<div class="w-full flex items-center">
	<div
		bind:this={labelEl}
		class="border border-r-0 p-1 text-center"
		style={`min-width:${labelGroups[group] ?? 0}px`}
	>
		{label}
	</div>

	<div
		class="
			flex-1
			truncate
			cursor-pointer
			border
			p-1
			mr-2
			outline-none hover:border-accent focus:border-accent focus:bg-accent-dark
		"
		tabindex="-1"
	>
		{value ?? "—"}
	</div>

	<div class="flex">
		<CopyButton value={value ?? ""} />
	</div>
</div>
