<script lang="ts">
	import {
		Chart,
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		CategoryScale,
		Title,
		Tooltip,
		Filler,
		Legend
	} from "chart.js";

	Chart.register(
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		CategoryScale,
		Title,
		Tooltip,
		Filler,
		Legend
	);

	// Props
	interface Dataset {
		label: string;
		data: number[];
		color: string;       // CSS color (raw)
	}

	interface Props {
		labels: string[];
		datasets: Dataset[];
		preset?: "number" | "currency" | "percent";
		locale?: string;
		currency?: string;
		yZero?: boolean;
	}

	let {
		labels = [],
		datasets = [],
		preset = "number",
		locale = "en-US",
		currency = "USD",
		yZero = false
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart;

	// Formatter for Y-axis
	function formatTick(value: number): string {
		switch (preset) {
			case "currency":
				return value.toLocaleString(locale, {
					style: "currency",
					currency,
					maximumFractionDigits: 0
				});
			case "percent":
				return (value / 100).toLocaleString(locale, {
					style: "percent",
					maximumFractionDigits: 1
				});
			default:
				return value.toLocaleString(locale);
		}
	}

	// Helper to read theme CSS vars
	function cssVar(name: string) {
		return getComputedStyle(document.documentElement)
			.getPropertyValue(name)
			.trim();
	}

	// Build chart on reactive changes
	$effect(() => {
		if (!canvas) return;

		// destroy old instance
		if (chart) chart.destroy();

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const text = cssVar("--color-text");
		const grid = cssVar("--color-text") + "33";

		chart = new Chart(ctx, {
			type: "line",
			data: {
				labels,
				datasets: datasets.map(d => ({
					label: d.label,
					data: d.data,
					borderColor: d.color,
					backgroundColor: d.color + "33",
					borderWidth: 2,
					tension: 0.25,
					fill: true,
					pointRadius: 2,
					pointHoverRadius: 4
				}))
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						labels: {
							color: text
						}
					}
				},
				scales: {
					x: {
						ticks: { color: text },
						grid: { color: grid }
					},
					y: {
						beginAtZero: yZero,
						ticks: {
							color: text,
							callback: v => formatTick(Number(v))
						},
						grid: { color: grid }
					}
				}
			}
		});
	});
</script>

<div class="h-full">
	<canvas
		bind:this={canvas}
		class="{labels.length && datasets.length ? '' : 'hidden'}  h-full w-full"
	></canvas>

	<div
		class="absolute inset-0 flex items-center justify-center text-xs
		{labels.length && datasets.length ? 'hidden' : ''}"
	>
		No data
	</div>
</div>
