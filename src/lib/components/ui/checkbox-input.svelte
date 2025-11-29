<script lang="ts">
	interface Props {
		label?: string;
		checked?: boolean;
	}

	let {
		label = "",
		checked = $bindable(false),
	}: Props = $props();

	const uid = $props.id();
</script>

<label for={uid} class="flex items-center gap-2 cursor-pointer text-small">
	<input
		id={uid}
		type="checkbox"
		bind:checked
		class="
			w-3 h-3
			appearance-none
			border
			hover:border-accent
			checked:bg-accent-dark
			checked:border-accent
			cursor-pointer
			transition
		"
	/>
	<span>{label}</span>
</label>
