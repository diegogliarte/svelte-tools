<script lang="ts">
	import Button from "$lib/components/ui/button.svelte";
	import type { Snippet } from 'svelte';
	import MdiClose from '~icons/mdi/close';

	interface Props {
		showModal?: boolean;
		title?: string;
		closable?: boolean;
		onClose?: () => void;
		children: Snippet;
	}

	let {
		showModal = $bindable(false),
		title = "",
		closable = true,
		onClose,
		children
	}: Props = $props();

	let dialog = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		if (showModal) dialog.showModal();
	});

	function close() {
		dialog?.close();
		onClose?.();
	}
</script>

<dialog
	bind:this={dialog}
	onclose={() => (showModal = false)}
	onclick={(e) => {
		if (e.target === dialog) close();
	}}
	class="
		backdrop:bg-bg/30 backdrop:backdrop-blur-xs
		p-0 border-none
		w-full h-full
		transition-all duration-200
		bg-transparent
		text-text
		flex justify-center items-center
		mx-auto my-auto
	"
>
	<div
		class="
			bg-bg border border-text
			p-4
			w-[min(90vw,800px)]
			max-h-[90vh]
			overflow-y-auto
			relative
		"
	>
		{#if title || closable}
			<div class="flex items-center justify-between mb-3">
				{#if title}
					<h2 class="text-large">{title}</h2>
				{/if}

				{#if closable}
					<button
						type="button"
						class="absolute top-2 right-2 text-large opacity-50 hover:opacity-100 hover:text-accent cursor-pointer"
						onclick={() => dialog.close()}
					>
						<MdiClose />
					</button>
				{/if}
			</div>
		{/if}

		{@render children()}
	</div>
</dialog>

<style>
    dialog:not([open]) {
        display: none;
    }
</style>
