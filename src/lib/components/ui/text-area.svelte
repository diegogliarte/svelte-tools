<script lang="ts">
	interface Props {
		value?: string;
		label?: string;
		placeholder?: string;
		readonly?: boolean;
		displayLines?: boolean;
	}

	let {
		value = $bindable(""),
		label = "",
		placeholder = "",
		readonly = false,
		displayLines = false
	}: Props = $props();

	const uid = $props.id();

	let lineCount = $derived(value.split("\n").length);
	let hoveredLine = $state<number | null>(null);

	function handleMouseMove(e: MouseEvent) {
		if (!displayLines) return;

		const textarea = e.currentTarget as HTMLTextAreaElement;
		const style = getComputedStyle(textarea);
		const lineHeight = parseFloat(style.lineHeight || "20");
		const offset = textarea.scrollTop;
		const y = e.offsetY + offset;
		hoveredLine = Math.floor(y / lineHeight) + 1;
	}

	function handleMouseLeave() {
		hoveredLine = null;
	}
</script>

<div class="flex flex-col w-full gap-0.5">
	{#if label}
		<label for={uid}>{label}</label>
	{/if}

	<div class="relative w-full flex border">

		{#if displayLines}
			<!-- Line numbers (same for both modes) -->
			<div class="flex flex-col p-2 text-xs select-none text-right min-w-[2.5rem] border-r">
				{#each Array(lineCount) as _, i (i)}
					<div>
						{i + 1}
					</div>
				{/each}
			</div>
		{/if}

		<textarea
			id={uid}
			bind:value
			{placeholder}
			{readonly}
			onmousemove={handleMouseMove}
			onmouseleave={handleMouseLeave}
			class="
				text-wrap
				flex-1 resize-none
				text-xs
				min-h-64
				outline-none p-2
				whitespace-pre font-mono
			"
		></textarea>
	</div>
</div>
