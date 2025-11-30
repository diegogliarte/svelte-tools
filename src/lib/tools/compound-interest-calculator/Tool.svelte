<script lang="ts">
	import NumberInput from "$lib/components/ui/number-input.svelte";
	import LineChart from "$lib/components/ui/line-chart.svelte";
	import LabeledRow from "$lib/components/ui/labeled-row.svelte";

	let principal = $state(1000);
	let monthly = $state(100);
	let rate = $state(5);
	let years = $state(10);

	// Core math logic
	function compute() {
		const labels: string[] = [];
		const contributed: number[] = [];
		const earned: number[] = [];
		const total: number[] = [];

		const monthlyRate = rate / 100 / 12;

		let balance = principal;
		let contribTotal = principal;

		let earnedTotal = 0;

		for (let y = 1; y <= years; y++) {
			for (let m = 0; m < 12; m++) {
				balance += monthly;
				const interest = balance * monthlyRate;
				balance += interest;

				contribTotal += monthly;
				earnedTotal += interest;
			}

			labels.push(`Y${y}`);
			contributed.push(Number(contribTotal.toFixed(2)));
			earned.push(Number(earnedTotal.toFixed(2)));
			total.push(Number(balance.toFixed(2)));
		}

		return { labels, contributed, earned, total };
	}

	const result = $derived(compute());

	const datasets = $derived.by(() => [
		{
			label: "Contributed",
			data: result.contributed,
			color: "#60A5FA" // blue-400
		},
		{
			label: "Interest Earned",
			data: result.earned,
			color: "#34D399" // green-400
		},
		{
			label: "Total Value",
			data: result.total,
			color: "#A78BFA" // purple-400
		}
	]);

	function formatMoney(n: number): string {
		return n.toLocaleString("es-ES", {
			style: "currency",
			currency: "EUR",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	}

	const finalContrib = $derived(
		result.contributed.length
			? formatMoney(result.contributed.at(-1)!)
			: ""
	);

	const finalEarned = $derived(
		result.earned.length
			? formatMoney(result.earned.at(-1)!)
			: ""
	);

	const finalTotal = $derived(
		result.total.length
			? formatMoney(result.total.at(-1)!)
			: ""
	);

</script>

<div class="grid grid-cols-2 gap-4">
	<NumberInput bind:value={principal} label="Initial (€)" min={0} step={100} />
	<NumberInput bind:value={monthly} label="Monthly (€)" min={0} step={10} />
	<NumberInput bind:value={rate} label="Interest (%)" min={0} step={0.1} />
	<NumberInput bind:value={years} label="Years" min={1} step={1} />
</div>

<div class="flex flex-col gap-4 md:flex-row">
	<LabeledRow valueAlign="center" label="Contributed" value={finalContrib} isCopyable={false} group="compound-interest"/>
	<LabeledRow valueAlign="center" label="Earned" value={finalEarned} isCopyable={false} group="compound-interest"/>
	<LabeledRow valueAlign="center" label="Total" value={finalTotal} isCopyable={false} group="compound-interest"/>
</div>



<!-- Chart -->
<LineChart
	labels={result.labels}
	datasets={datasets}
	preset="currency"
	currency="EUR"
	locale="es-ES"
	yZero={true}
/>
