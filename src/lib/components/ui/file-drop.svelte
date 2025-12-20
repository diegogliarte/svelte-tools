<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		files?: File[] | null;
		label?: string;
		accept?: string;
		multiple?: boolean;
		disabled?: boolean;
		children?: Snippet;
	}

	let {
		files = $bindable<File[] | null>(null),
		label = '',
		accept = '',
		multiple = true,
		disabled = false,
		children
	}: Props = $props();

	const uid = $props.id();
	let isDragging = $state(false);

	function onFilesSelected(fileList: FileList | null) {
		if (!fileList) return;
		files = Array.from(fileList);
	}

	function handleInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		onFilesSelected(input.files);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		if (disabled) return;

		isDragging = false;
		onFilesSelected(e.dataTransfer?.files ?? null);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (!disabled) isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}
</script>

<div class="flex flex-col gap-0.5">
	{#if label}
		<label for={uid}>{label}</label>
	{/if}

	<label
		for={uid}
		class="
			block w-full px-4 py-4
			border cursor-pointer border-dashed
			transition
			select-none
			text-center
			{disabled ? 'opacity-50 cursor-not-allowed' : ''}
			{isDragging ? 'border-accent bg-accent-dark' : ''}
			hover:border-accent
		"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
	>
		{#if children}
			{@render children()}
		{:else}
			<span class="text-sm">
				Drop files here or click to select
			</span>
		{/if}
	</label>

	<input
		id={uid}
		type="file"
		class="hidden"
		{accept}
		{multiple}
		{disabled}
		onchange={handleInputChange}
	/>
</div>
