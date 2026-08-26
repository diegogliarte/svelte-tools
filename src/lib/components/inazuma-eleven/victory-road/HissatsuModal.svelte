<script lang="ts">
	import Modal from '$lib/components/ui/modal.svelte';
	import ElementBadge from '$lib/components/inazuma-eleven/ElementBadge.svelte';
	import type { Hissatsu } from '$lib/utils/inazuma-eleven-vr.utils';

	let { hissatsu, onClose }: { hissatsu: Hissatsu; onClose?: () => void } = $props();
	const shops = $derived([hissatsu['Shop 1'], hissatsu['Shop 2']].filter(Boolean));
</script>

<Modal title={hissatsu.Name} {onClose}>
	<div class="mb-4 flex items-center gap-2">
		<ElementBadge element={hissatsu.Element} />
		<span class="text-sm">{hissatsu.Type}{hissatsu['Sub-Type'] ? ` · ${hissatsu['Sub-Type']}` : ''}</span>
	</div>

	{#if hissatsu['Japanese Name']}<p class="mb-4 text-sm opacity-70">{hissatsu['Japanese Name']}</p>{/if}

	<div class="mb-4 grid grid-cols-2 gap-1 text-xs sm:grid-cols-3">
		<div>Power: <b>{hissatsu.Power}</b></div>
		<div>Tension: <b>{hissatsu.Tension}</b></div>
		{#if hissatsu['Duration (s)'] != null}<div>Duration: <b>{hissatsu['Duration (s)']}s</b></div>{/if}
	</div>

	{#if shops.length}
		<h3 class="mb-1 font-bold">Shops</h3>
		<ul class="mb-4 list-inside list-disc text-sm">
			{#each shops as shop (shop)}<li>{shop}</li>{/each}
		</ul>
	{/if}

	{#if hissatsu.Movie}
		<video src={hissatsu.Movie} controls playsinline class="w-full border" aria-label={`${hissatsu.Name} preview`}
		></video>
	{/if}
</Modal>
