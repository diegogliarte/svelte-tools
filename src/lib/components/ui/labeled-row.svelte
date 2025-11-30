<script lang="ts">
	import { labelGroups } from '$lib/states/label-groups.svelte.js';
	import CopyButton from "$lib/components/ui/copy-button.svelte";


	interface Props {
		label? : string;
		value?: string | number | null;
		group?: string | null;
		isCopyable?: boolean;
		valueAlign?: "left" | "center" | "right";
	}

	let {
		label = "",
		value = "",
		group,
		isCopyable = true,
		valueAlign = "left"
	}: Props = $props();

	const alignmentClass = {
		left: "text-left",
		center: "text-center",
		right: "text-right"
	}[valueAlign];

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
	{#if label}
		<div
			bind:this={labelEl}
			class="border border-r-0 p-1 text-center"
			style={`min-width:${labelGroups[group] ?? 0}px`}
		>
			{label}
		</div>
	{/if}

	<div
		class="
			flex-1
			truncate
			cursor-pointer
			border
			p-1
			outline-none hover:border-accent focus:border-accent focus:bg-accent-dark
			{alignmentClass}
		"
		tabindex="-1"
	>
		{value ?? "—"}
	</div>

	{#if isCopyable}
		<div class="flex ml-2">
			<CopyButton value={value ?? ""} />
		</div>
	{/if}
</div>
