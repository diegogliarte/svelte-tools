<script lang="ts">
	// ---------------------------
	// Helpers
	// ---------------------------
	function hmsToSeconds(h = 0, m = 0, s = 0) {
		return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
	}

	function secondsToHMS(t: number) {
		return {
			h: Math.floor(t / 3600),
			m: Math.floor((t % 3600) / 60),
			s: Math.floor(t % 60)
		};
	}

	// ---------------------------
	// State
	// ---------------------------
	let timeH = $state<number | undefined>();
	let timeM = $state<number | undefined>();
	let timeS = $state<number | undefined>();

	let distance = $state<number | undefined>();

	let paceH = $state<number | undefined>();
	let paceM = $state<number | undefined>();
	let paceS = $state<number | undefined>();

	// "time" | "distance" | "pace"
	let locked = $state<"time" | "distance" | "pace">("time");

	const lock = (f: "time" | "distance" | "pace") => (locked = f);

	// ---------------------------
	// Calculation (reactive)
	// ---------------------------
	$effect(() => {
		const t = hmsToSeconds(timeH, timeM, timeS);
		const p = hmsToSeconds(paceH, paceM, paceS);
		const d = distance || 0;

		if (locked === "distance" && p > 0 && t > 0) {
			const dist = t / p;
			distance = Number(dist.toFixed(2));
		}

		if (locked === "time" && p > 0 && distance) {
			const total = p * d;
			const { h, m, s } = secondsToHMS(total);
			timeH = h; timeM = m; timeS = s;
		}

		if (locked === "pace" && d && t > 0) {
			const perKm = t / d;
			const { h, m, s } = secondsToHMS(perKm);
			paceH = h; paceM = m; paceS = s;
		}
	});

	// ---------------------------
	// Input auto-advance
	// ---------------------------
	function limit2(e: Event, next?: HTMLInputElement | null) {
		const input = e.target as HTMLInputElement;
		if (input.value.length > 2) input.value = input.value.slice(0, 2);
		if (input.value.length === 2 && next) next.select();
	}

	let timeHEl: HTMLInputElement;
	let timeMEl: HTMLInputElement;
	let timeSEl: HTMLInputElement;
	let paceHEl: HTMLInputElement;
	let paceMEl: HTMLInputElement;
	let paceSEl: HTMLInputElement;
	let distanceEl: HTMLInputElement;

	// ---------------------------
	// Distance max digits
	// ---------------------------
	function enforceDistanceLimit(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.value.length > 5) {
			input.value = input.value.slice(0, 5);
		}
	}
</script>

<section class="max-w-xs mx-auto space-y-6">
	<!-- TIME -->
	<div class="flex justify-between items-center gap-8">
		<button
			class="cursor-pointer transition-colors hover:text-accent {locked === 'time' ? 'text-accent' : ''}"
			onclick={() => lock("time")}
		>
			Time
		</button>

		<div class="flex items-center transition-opacity {locked === 'time' ? 'opacity-50' : ''}">
			<input
				type="number"
				bind:this={timeHEl}
				bind:value={timeH}
				placeholder="h"
				readonly={locked === "time"}
				class="w-6 text-center bg-transparent border-b outline-none
				       transition-colors
				       focus:border-accent hover:border-accent"
				oninput={(e) => locked !== "time" && limit2(e, timeMEl)}
			/>

			<span class="mx-2 text-accent">:</span>

			<input
				type="number"
				bind:this={timeMEl}
				bind:value={timeM}
				placeholder="m"
				readonly={locked === "time"}
				class="w-6 text-center bg-transparent border-b outline-none
				       transition-colors
				       focus:border-accent hover:border-accent"
				oninput={(e) => locked !== "time" && limit2(e, timeSEl)}
			/>

			<span class="mx-2 text-accent">:</span>

			<input
				type="number"
				bind:this={timeSEl}
				bind:value={timeS}
				placeholder="s"
				readonly={locked === "time"}
				class="w-6 text-center bg-transparent border-b outline-none
				       transition-colors
				       focus:border-accent hover:border-accent"
				oninput={(e) =>
					locked !== "time" &&
					limit2(e, locked === "distance" ? paceHEl : distanceEl)
				}
			/>
		</div>
	</div>

	<!-- DISTANCE -->
	<div class="flex justify-between items-center">
		<button
			class="cursor-pointer transition-colors hover:text-accent {locked === 'distance' ? 'text-accent' : ''}"
			onclick={() => lock("distance")}
		>
			Distance
		</button>

		<input
			type="number"
			bind:this={distanceEl}
			bind:value={distance}
			step="0.1"
			placeholder="km"
			readonly={locked === "distance"}
			class="w-20 text-right bg-transparent border-b outline-none transition-colors {locked === 'distance' ? 'opacity-50' : ''} focus:border-accent hover:border-accent"
			oninput={(e) => locked !== "distance" && enforceDistanceLimit(e)}
		/>
	</div>

	<!-- PACE -->
	<div class="flex justify-between items-center">
		<button
			class="cursor-pointer transition-colors hover:text-accent {locked === 'pace' ? 'text-accent' : ''}"
			onclick={() => lock("pace")}
		>
			Pace
		</button>

		<div class="flex items-center transition-opacity {locked === 'pace' ? 'opacity-50' : ''}">
			<input
				type="number"
				bind:this={paceHEl}
				bind:value={paceH}
				placeholder="h"
				readonly={locked === "pace"}
				class="w-6 text-center bg-transparent border-b outline-none
				       transition-colors
				       focus:border-accent hover:border-accent"
				oninput={(e) => locked !== "pace" && limit2(e, paceMEl)}
			/>

			<span class="mx-2 text-accent">:</span>

			<input
				type="number"
				bind:this={paceMEl}
				bind:value={paceM}
				placeholder="m"
				min="0"
				max="59"
				readonly={locked === "pace"}
				class="w-6 text-center bg-transparent border-b outline-none
				       transition-colors
				       focus:border-accent hover:border-accent"
				oninput={(e) => locked !== "pace" && limit2(e, paceSEl)}
			/>

			<span class="mx-2 text-accent">:</span>

			<input
				type="number"
				bind:this={paceSEl}
				bind:value={paceS}
				placeholder="s"
				min="0"
				max="59"
				readonly={locked === "pace"}
				class="w-6 text-center bg-transparent border-b outline-none
				       transition-colors
				       focus:border-accent hover:border-accent"
				oninput={(e) =>
					locked !== "pace" &&
					limit2(e, locked === "time" ? distanceEl : timeHEl)
				}
			/>
		</div>
	</div>
</section>

<style>
    /* Remove spinner buttons */
    input::-webkit-inner-spin-button,
    input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    input[type="number"] {
        -moz-appearance: textfield;
    }
</style>
