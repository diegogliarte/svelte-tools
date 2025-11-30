<script lang="ts">
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

	let timeH = $state<number | undefined>();
	let timeM = $state<number | undefined>();
	let timeS = $state<number | undefined>();

	let distance = $state<number | undefined>();

	let paceH = $state<number | undefined>();
	let paceM = $state<number | undefined>();
	let paceS = $state<number | undefined>();

	let locked = $state<"time" | "distance" | "pace">("pace");

	const lock = (f: "time" | "distance" | "pace") => (locked = f);

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

	function enforceDistanceLimit(e) {
		const input = e.target as HTMLInputElement;
		if (input.value.length > 5) {
			input.value = input.value.slice(0, 5);
		}
	}

	const baseInput = "w-6 text-center bg-transparent border-b outline-none transition-colors";
	const unlockedInput = "focus:border-accent hover:border-accent";
</script>

{#snippet labeledButton(label: string, active: boolean, onclick: () => void) }
	<button
		class="cursor-pointer transition-colors hover:text-accent {active ? 'text-accent' : ''}"
		onclick={onclick}
	>
		{label}
	</button>
{/snippet}

{#snippet colons() }
	<span class="mx-2 text-accent">:</span>
{/snippet}

<section class="max-w-xs mx-auto space-y-6">
	<!-- TIME -->
	<div class="flex justify-between items-center gap-8">
		{@render labeledButton("Time", locked === "time", () => lock("time"))}

		<div class="flex items-center transition-opacity {locked === 'time' ? 'opacity-50' : ''}">
			<input
				type="number"
				bind:this={timeHEl}
				bind:value={timeH}
				placeholder="h"
				readonly={locked === "time"}
				class={`${baseInput} ${locked !== 'time' ? unlockedInput : ''}`}
				oninput={(e) => limit2(e, timeMEl)} />

			{@render colons()}

			<input
				type="number"
				bind:this={timeMEl}
				bind:value={timeM}
				placeholder="m"
				readonly={locked === "time"}
				class={`${baseInput} ${locked !== 'time' ? unlockedInput : ''}`}
				oninput={(e) => limit2(e, timeSEl)}
			/>

			{@render colons()}

			<input
				type="number"
				bind:this={timeSEl}
				bind:value={timeS}
				placeholder="s"
				readonly={locked === "time"}
				class={`${baseInput} ${locked !== 'time' ? unlockedInput : ''}`}
				oninput={(e) => limit2(e, distanceEl)}
			/>
		</div>
	</div>

	<!-- DISTANCE -->
	<div class="flex justify-between items-center">
		{@render labeledButton("Distance", locked === "distance", () => lock("distance"))}

		<input
			type="number"
			bind:this={distanceEl}
			bind:value={distance}
			step="0.1"
			placeholder="km"
			readonly={locked === "distance"}
			class="w-20 h-full text-right bg-transparent border-b outline-none transition-colors {locked === 'distance' ? 'opacity-50' : 'focus:border-accent hover:border-accent'}"
			oninput={(e) => locked !== "distance" && enforceDistanceLimit(e)}
		/>
	</div>

	<!-- PACE -->
	<div class="flex justify-between items-center">
		{@render labeledButton("Pace", locked === "pace", () => lock("pace"))}

		<div class="flex items-center transition-opacity {locked === 'pace' ? 'opacity-50' : ''}">
			<input
				type="number"
				bind:this={paceHEl}
				bind:value={paceH}
				placeholder="h"
				readonly={locked === "pace"}
				class={`${baseInput} ${locked !== 'time' ? unlockedInput : ''}`}
				oninput={(e) => limit2(e, paceMEl)}
			/>

			{@render colons()}

			<input
				type="number"
				bind:this={paceMEl}
				bind:value={paceM}
				placeholder="m"
				readonly={locked === "pace"}
				class={`${baseInput} ${locked !== 'time' ? unlockedInput : ''}`}
				oninput={(e) => limit2(e, paceSEl)}
			/>

			{@render colons()}

			<input
				type="number"
				bind:this={paceSEl}
				bind:value={paceS}
				placeholder="s"
				readonly={locked === "pace"}
				class={`${baseInput} ${locked !== 'time' ? unlockedInput : ''}`}
				oninput={(e) => limit2(e, timeHEl)}
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
