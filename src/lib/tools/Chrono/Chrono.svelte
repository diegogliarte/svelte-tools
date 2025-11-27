<script lang="ts">
	import { onMount, onDestroy } from "svelte";

	let chronoEl: HTMLElement;
	let lapsEl: HTMLElement;

	/* INTERNAL STATE */
	let startTime = 0;
	let elapsedTime = 0;
	let interval: number | null = null;
	let isRunning = false;
	let isReset = false;
	let holdTimeout: number | null = null;

	/* HELPERS */
	function formatTime(ms: number) {
		const totalSeconds = Math.floor(ms / 1000);
		const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
		const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
		const seconds = String(totalSeconds % 60).padStart(2, "0");
		return `${hours}:${minutes}:${seconds}`;
	}

	function updateDisplay() {
		const formatted = formatTime(elapsedTime);
		if (chronoEl) chronoEl.textContent = formatted;
		document.title = formatted;
	}

	function updateOpacity() {
		if (chronoEl) chronoEl.style.opacity = isRunning ? "1" : "0.8";
	}

	function startChrono() {
		if (!isRunning) {
			startTime = Date.now() - elapsedTime;
			interval = setInterval(() => {
				elapsedTime = Date.now() - startTime;
				updateDisplay();
			}, 10) as unknown as number;

			isRunning = true;
			updateOpacity();
		}
	}

	function pauseChrono() {
		if (isRunning) {
			if (interval) clearInterval(interval);
			isRunning = false;
			updateOpacity();
		}
	}

	function resetChrono() {
		pauseChrono();
		elapsedTime = 0;
		isReset = true;
		updateDisplay();
		updateOpacity();
		if (lapsEl) lapsEl.innerHTML = "";

		// pulse animation
		chronoEl?.classList.remove("resetting");
		void chronoEl?.offsetWidth;
		chronoEl?.classList.add("resetting");
	}

	function addLap() {
		const formatted = formatTime(elapsedTime);
		const el = document.createElement("div");

		el.textContent = formatted;
		el.className =
			"cursor-pointer text-neutral-400 hover:text-red-400 transition transform";

		el.addEventListener("click", (e) => {
			e.stopPropagation();
			el.remove();
		});

		lapsEl?.appendChild(el);
	}

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	}

	/* MOUNT LOGIC (equivalent to your scripts) */
	onMount(() => {
		updateDisplay();

		const click = () => {
			if (isReset) {
				isReset = false;
				return;
			}
			isRunning ? pauseChrono() : startChrono();
		};

		const dbl = () => toggleFullscreen();

		const mousedown = (e: MouseEvent) => {
			if (e.button === 0) {
				holdTimeout = setTimeout(() => resetChrono(), 250) as unknown as number;
			}
		};

		const mouseup = () => {
			if (holdTimeout) {
				clearTimeout(holdTimeout);
				holdTimeout = null;
			}
		};

		const aux = (e: MouseEvent) => {
			if (e.button === 1) {
				e.preventDefault();
				addLap();
			}
		};

		const context = (e: MouseEvent) => {
			e.preventDefault();
			document.querySelectorAll(".meta-ui").forEach((el) => {
				el.classList.toggle("hidden");
			});
		};

		document.addEventListener("click", click);
		document.addEventListener("dblclick", dbl);
		document.addEventListener("mousedown", mousedown);
		document.addEventListener("mouseup", mouseup);
		document.addEventListener("auxclick", aux);
		document.addEventListener("contextmenu", context);

		return () => {
			document.removeEventListener("click", click);
			document.removeEventListener("dblclick", dbl);
			document.removeEventListener("mousedown", mousedown);
			document.removeEventListener("mouseup", mouseup);
			document.removeEventListener("auxclick", aux);
			document.removeEventListener("contextmenu", context);
		};
	});
</script>

<!-- UI -->
<div
	bind:this={chronoEl}
	class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-200 font-mono transition-opacity select-none cursor-pointer"
	style="font-size: 5rem; opacity: 0.8;"
>
	00:00:00
</div>

<div
	bind:this={lapsEl}
	class="absolute top-20 right-8 flex flex-col text-sm select-none cursor-pointer"
></div>

<style>
    @font-face {
        font-family: 'clockicons';
        src: url('/fonts/clockicons.ttf') format('truetype');
    }

    #chrono {
        font-family: 'clockicons', monospace;
    }

    .resetting {
        animation: resetPulse 0.3s ease-out;
    }

    @keyframes resetPulse {
        0% {
            transform: scale(1);
        }
        30% {
            transform: scale(1.1);
        }
        100% {
            transform: scale(1);
        }
    }
</style>