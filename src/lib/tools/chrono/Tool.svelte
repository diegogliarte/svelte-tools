<script lang="ts">
	let running = $state(false);
	let elapsed = $state(0); // ms
	let lastTick = $state(0);
	let holdTimeout: Timeout | null = null;

	let laps = $state<string[]>([]);
	let pulsing = $state(false);

	// --- formatting ----------------------------------------------------
	let formatted = $derived.by(() => {
		const total = elapsed / 1000;
		const h = Math.floor(total / 3600);
		const m = Math.floor((total % 3600) / 60);
		const s = Math.floor(total % 60);

		return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	});

	// --- timer loop ----------------------------------------------------
	$effect(() => {
		let frame: number;

		function tick(t: number) {
			if (running) {
				if (lastTick === 0) lastTick = t;
				const delta = t - lastTick;
				elapsed += delta;
				lastTick = t;
			}
			frame = requestAnimationFrame(tick);
		}

		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});

	// --- controls ------------------------------------------------------
	function toggleRun() {
		running = !running;
		if (running) lastTick = 0;
	}

	function reset() {
		running = false;
		elapsed = 0;
		lastTick = 0;
		laps = [];

		pulsing = true;
		setTimeout(() => (pulsing = false), 150);
	}

	function addLap() {
		laps.push(formatted);
	}

	async function toggleFullScreen() {
		if (!document.fullscreenElement) {
			await document.documentElement.requestFullscreen();
		} else {
			await document.exitFullscreen();
		}
	}

	// --- mouse events --------------------------------------------------
	function onMouseDown(e: MouseEvent) {
		// middle = lap
		if (e.button === 1) {
			addLap();
			return;
		}

		// hold → reset
		if (e.button === 0) {
			holdTimeout = setTimeout(() => {
				reset();
				holdTimeout = null; // IMPORTANT: prevents auto-toggle
			}, 300);
		}
	}

	function onMouseUp(e: MouseEvent) {
		if (e.button === 0) {
			// If hold triggered reset, do not toggle
			if (holdTimeout === null) return;

			clearTimeout(holdTimeout);
			holdTimeout = null;

			// short click → start/pause
			toggleRun();
		}
	}

	function onDblClick() {
		toggleFullScreen();
	}

	$effect(() => {
		document.title = formatted;
	});
</script>

<div
	class="w-full h-full fixed inset-0 select-none cursor-pointer"
	onmousedown={onMouseDown}
	onmouseup={onMouseUp}
	ondblclick={onDblClick}
	role="button"
	tabindex="0"
>
	<!-- centered clock -->
	<div
		class="
			absolute top-1/2 left-1/2
			-translate-x-1/2 -translate-y-1/1
			transition-opacity duration-200
		"
		style={running ? "opacity: 1" : "opacity: 0.5"}
	>
		<div
			class="
				text-7xl
				transition-transform
				font-clockicons
			"
			style={pulsing ? "transform: scale(1.1);" : "transform: scale(1);"}
		>
			{formatted}
		</div>
	</div>

	<!-- laps on right -->
	<div class="absolute top-0 right-0 p-4 flex flex-col gap-1 text-small">
		{#each laps as lap, i (i)}
			<div>{lap}</div>
		{/each}
	</div>
</div>
