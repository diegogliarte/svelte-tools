<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import NumberInput from '$lib/components/ui/number-input.svelte';
	import SelectInput from '$lib/components/ui/select-input.svelte';
	import FileDrop from '$lib/components/ui/file-drop.svelte';
	import { untrack } from 'svelte';

	import JSZip from 'jszip';
	import { labelGroups } from '$lib/states/label-groups.svelte';

	type Result = {
		name: string;
		original: File;
		originalUrl: string;
		convertedBlob: Blob | null;
		convertedUrl: string | null;
	};

	let files = $state<File[] | null>(null);
	let results = $state<Result[]>([]);
	let selectedIdx = $state<number | null>(null);

	let quality = $state(80);
	let format = $state('image/webp');
	let convertingIdx = $state<number | null>(null);

	const formatOptions = [
		{ value: 'image/webp', label: 'WebP' },
		{ value: 'image/jpeg', label: 'JPEG' },
		{ value: 'image/png', label: 'PNG' }
	];

	function toggleSelect(idx: number) {
		selectedIdx = selectedIdx === idx ? null : idx;
	}

	const selectedResult = $derived(
		selectedIdx !== null ? results[selectedIdx] ?? null : null
	);

	/* ---------------------------------------------
	   Phase 1: initialize results when files change
	----------------------------------------------*/
	$effect(() => {
		if (!files || !files.length || !quality || !format) return;

		untrack(() => {
			convertRunId++;

			for (const r of results) {
				URL.revokeObjectURL(r.originalUrl);
				if (r.convertedUrl) {
					URL.revokeObjectURL(r.convertedUrl);
				}
			}

			if (files.length !== results.length) {
				selectedIdx = 0;
			}

			results = files.map(file => ({
				name: file.name.replace(/\.\w+$/, getExtension(format)),
				original: file,
				originalUrl: URL.createObjectURL(file),
				convertedBlob: null,
				convertedUrl: null
			}));

			convertAll(selectedIdx, convertRunId);
		});
	});

	let convertRunId = $state(0);
	async function convertAll(startIdx: number = 0, runId: number) {
		selectedIdx = startIdx;

		const total = results.length;

		for (let offset = 0; offset < total; offset++) {
			if (runId !== convertRunId) return;

			const i = (startIdx + offset) % total;
			const r = results[i];

			convertingIdx = i;

			const { blob, url } = await convert(
				r.original,
				format,
				quality / 100
			);

			results[i] = {
				...r,
				name: r.original.name.replace(/\.\w+$/, getExtension(format)),
				convertedBlob: blob,
				convertedUrl: url
			};

			results = [...results]; // force reactivity
		}

		convertingIdx = null;
	}

	function getExtension(mime: string) {
		switch (mime) {
			case 'image/jpeg':
				return '.jpg';
			case 'image/png':
				return '.png';
			default:
				return '.webp';
		}
	}

	function convert(
		file: File,
		mime: string,
		quality: number
	): Promise<{ blob: Blob; url: string }> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;

				const ctx = canvas.getContext('2d');
				if (!ctx) return reject();

				ctx.drawImage(img, 0, 0);

				canvas.toBlob(
					blob => {
						if (!blob) return reject();
						resolve({
							blob,
							url: URL.createObjectURL(blob)
						});
					},
					mime,
					quality
				);
			};

			img.onerror = reject;
			img.src = URL.createObjectURL(file);
		});
	}

	async function downloadAll() {
		if (!results.length || convertingIdx !== null) return;

		const zip = new JSZip();

		for (const r of results) {
			if (!r.convertedBlob) continue;
			zip.file(r.name, r.convertedBlob);
		}

		const blob = await zip.generateAsync({ type: 'blob' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = 'converted-images.zip';
		a.click();

		URL.revokeObjectURL(url);
	}

	let comparePos = $state(50);
	let isDraggingCompare = $state(false);

	function startCompareDrag(e: MouseEvent) {
		isDraggingCompare = true;
		updateComparePos(e);
	}

	function stopCompareDrag() {
		isDraggingCompare = false;
	}

	function updateComparePos(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const x = e.clientX - rect.left;

		comparePos = Math.min(
			100,
			Math.max(0, (x / rect.width) * 100)
		);
	}
</script>

<!-- FILE INPUT -->
<FileDrop label="Images" accept="image/*" bind:files>

</FileDrop>

<!-- CONTROLS -->
<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-baseline-last">
	<SelectInput
		label="Output format"
		options={formatOptions}
		bind:value={format}
		allowEmpty={false}
	/>

	<NumberInput
		label="Quality"
		min={1}
		max={100}
		step={1}
		bind:value={quality}
	/>

	<Button
		disabled={convertingIdx !== null || !results.length}
		onClick={downloadAll}
	>
		{#if convertingIdx !== null}
			Converting ({convertingIdx + 1}/{results.length})
		{:else}
			Download all
		{/if}
	</Button>
</div>

<!-- COMPARISON -->
{#if selectedResult}
	<div class="flex flex-col gap-2 items-center">
		<div class="text-sm">Comparison</div>

		<div
			class="relative border overflow-hidden select-none w-full max-w-80 cursor-ew-resize"
			onmousedown={startCompareDrag}
			onmousemove={(e) => isDraggingCompare && updateComparePos(e)}
			onmouseup={stopCompareDrag}
			onmouseleave={stopCompareDrag}
		>
			<img
				src={selectedResult.originalUrl}
				alt="Original"
				class="block w-full"
				draggable="false"
			/>

			{#if selectedResult.convertedUrl}
				<img
					src={selectedResult.convertedUrl}
					alt="Converted"
					class="absolute inset-0 w-full"
					style={`clip-path: inset(0 ${100 - comparePos}% 0 0);`}
					draggable="false"
				/>
			{/if}

			<div
				class="absolute top-0 bottom-0 pointer-events-none"
				style={`left: ${comparePos}%; width: 24px; transform: translateX(-12px);`}
			>
				<div class="absolute inset-y-0 left-1/2 w-px bg-accent"></div>
			</div>
		</div>

		<div class="flex justify-between text-xs max-w-80 w-full">
			<span>Converted</span>
			<span>Original</span>
		</div>
	</div>
{/if}

<!-- RESULT GRID -->
{#if results.length}
	<div class="grid grid-cols-2 md:grid-cols-5 sm:grid-cols-4 gap-2">
		{#each results as r, idx (idx)}
			<div
				class="border p-2 cursor-pointer hover:border-accent {selectedIdx === idx ? 'border-accent bg-accent-dark' : ''}"
				onclick={() => toggleSelect(idx)}
			>
				<div class="truncate text-sm">{r.name}</div>

				<div class="text-xs">
					{#if r.convertedBlob}
						{(r.convertedBlob.size / 1024).toFixed(1)} KB
						<span class="ml-1">
							(
							{(
								100 -
								(r.convertedBlob.size / r.original.size) * 100
							).toFixed(0)}
							%
							)
						</span>
					{:else}
						Converting…
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
