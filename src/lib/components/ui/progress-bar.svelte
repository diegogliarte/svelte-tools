<script lang="ts">
	import { clamp } from '$lib/utils/math.utils';

	interface Segment {
		limit: number;
		color: string; // "blue", "red", "green", ...
	}

	interface Props {
		value?: number | null; // 176, 62.6, ...
		min?: number;
		max?: number;
		label?: string;
		showValue?: boolean;  // show floating label below bar
		segments?: Segment[]; // optional array of segment ranges
	}

	let {
		value = $bindable(0),
		min = 0,
		max,
		label = "",
		showValue = true,
		segments = []
	}: Props = $props();

	const uid = $props.id();

	// Normalize value to 0–100%
	let percentage = $derived.by(() => {
		if (max === undefined) return 0;
		const clamped = clamp(value ?? 0, min, max);
		return ((clamped - min) / (max - min)) * 100;
	});

	// Convert each segment to its percentage width
	let segmentPercents = $derived.by(() => {
		if (segments.length === 0) return [];

		return segments.map((seg, i) => {
			const start = i === 0 ? min : segments[i-1].limit;
			const end = seg.limit;

			const widthPercentage = ((end - start) / (max - min)) * 100;
			return { widthPercentage, color: seg.color };
		});
	});

	const COLOR_MAP = {
		blue:  "text-blue-500",
		green: "text-green-500",
		yellow:"text-yellow-500",
		red:   "text-red-500",
		accent:"text-accent",
		white: "text-white",
		black: "text-black"
	};

	let currentColor: string = $derived.by(() => {
		if (value === null || value === undefined || segments.length === 0) {
			return "text-text"; // fallback to your theme's default text
		}

		for (const seg of segments) {
			if (value <= seg.limit) return COLOR_MAP[seg.color] ?? "text-text";
		}

		// above last segment
		return COLOR_MAP[segments[segments.length - 1].color] ?? "text-text";
	});

</script>

<div class="flex flex-col w-full gap-1">

	{#if label}
		<label for={uid} class="text-small">{label}</label>
	{/if}

	<div class="relative w-full">

		{#if showValue}
			<div
				class="absolute -bottom-6 text-small transition-all duration-150 {currentColor}"
				style={
					value !== null
						? `left: calc(${percentage}% - 1rem)`
						: "left: 50%; transform: translateX(-50%);"
				}
			>
				{value !== null ? value.toFixed(1) : "??"}
			</div>
		{/if}

		<div class="border border-text h-3">
			<div
				class="h-full bg-accent transition-all duration-150"
				style="width: {percentage}%"
			></div>

			<!-- Segment ticks -->
			<div class="absolute inset-0 pointer-events-none">
				{#each segments as seg}
					<div
						class="absolute top-0 bottom-0 border-r border-white"
						style="left: {( (seg.limit - min) / (max - min) ) * 100}%"
					></div>
				{/each}
			</div>

		</div>

	</div>
</div>
