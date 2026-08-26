<script lang="ts">
	const classes: Record<string, string> = {
		Air: 'bg-sky-800',
		Wind: 'bg-sky-800',
		Wood: 'bg-green-800',
		Forest: 'bg-green-800',
		Fire: 'bg-red-800',
		Earth: 'bg-yellow-800',
		Mountain: 'bg-yellow-800',
		None: 'bg-neutral-700'
	};

	let { element }: { element: string } = $props();
</script>

<span
	class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white {classes[element] ??
		classes.None}"
>
	{element || 'None'}
</span>
