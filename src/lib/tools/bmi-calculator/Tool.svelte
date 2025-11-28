<script lang="ts">
	import NumberInput from '$lib/components/ui/number-input.svelte';
	import ProgressBar from '$lib/components/ui/progress-bar.svelte';

	let height: number | null = $state(null);
	let weight: number | null = $state(null);

	let bmi: null | number = $derived.by(() => {
		if (height === null || weight === null) return null;
		const heightInMeters = height / 100;
		return weight / (heightInMeters * heightInMeters);
	});
</script>

<div class="flex gap-4">
	<NumberInput bind:value={height} label="Height (cm)" min={0} step={.5} placeholder="176"/>
	<NumberInput bind:value={weight} label="Weight (kg)" min={0} step={.5} placeholder="72"/>
</div>

<ProgressBar
	min={12}
	max={40}
	value={bmi}
	label="BMI"
	showValue={true}
	segments={[
		{ limit: 18.5, color: "blue" },
		{ limit: 25,   color: "green" },
		{ limit: 30,   color: "yellow" },
		{ limit: 40,   color: "red" }
	]}
/>
