<script lang="ts">
	import CheckboxInput from "$lib/components/ui/checkbox-input.svelte";

	interface Option { label: string; value: string; }

	let {
		label = "",
		options = $bindable([]),
		values = $bindable<string[]>([])
	} = $props();

</script>

<div class="flex flex-col gap-1 text-small">
	{#if label}
		<div class="font-semibold mb-1">{label}</div>
	{/if}

	<div class="grid grid-cols-2 gap-2">
		{#each options as opt, i (opt)}
			<CheckboxInput
				label={opt.label}
				bind:checked={opt.value}
			/>
		{/each}
	</div>
</div>
