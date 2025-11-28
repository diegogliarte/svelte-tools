<script lang="ts">
	interface Props {
		value?: string | null;
		label?: string;
		placeholder?: string;
	}

	let {
		value = $bindable(""),
		label = "",
		placeholder = ""
	}: Props = $props();

	const uid = $props.id();
</script>

<div class="flex flex-col w-full gap-1">
	{#if label}
		<label for={uid} class="text-small">{label}</label>
	{/if}

	<input
		id={uid}
		type="text"
		class="
			w-full px-3 py-2
			border
			outline-none hover:border-accent focus:border-accent focus:bg-accent-dark
			transition-all
			bg-transparent
		"
		bind:value
		{placeholder}
	/>
</div>
