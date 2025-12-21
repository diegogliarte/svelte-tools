<script lang="ts">
	import MdiCheck from '~icons/mdi/check';

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

<label
	for={uid}
	class="flex items-center gap-1 cursor-pointer text-xs h-fit group select-none"
>
	<span class="relative w-3 h-3 flex items-center justify-center">
		<input
			id={uid}
			type="checkbox"
			bind:checked
			class="
				w-3 h-3
				appearance-none
				border
				checked:bg-accent-dark
				checked:border-accent
				cursor-pointer
				transition
			"
		/>

		<MdiCheck
			class="
				absolute
				w-2.5 h-2.5
				text-accent
				pointer-events-none
				transition
				{checked ? 'opacity-100 ' : 'opacity-0'}
			"
		/>
	</span>

	<span class="transition group-hover:text-accent">
		{label}
	</span>
</label>
