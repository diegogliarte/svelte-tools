<script lang="ts">
	import MdiChevronDown from "~icons/mdi/chevron-down";

	interface Option {
		value: string;
		label: string;
	}

	interface Props {
		value?: string | null;
		options: Option[];
		label?: string;
		placeholder?: string; // Shown when no value
		allowEmpty?: boolean;
	}

	let {
		value = $bindable(""),
		options,
		label = "",
		placeholder = "—",
		allowEmpty = true
	}: Props = $props();

	const uid = $props.id();
</script>

<div class="flex flex-col w-full gap-1 ">
	{#if label}
		<label for={uid} class="pointer-events-none">{label}</label>
	{/if}

	<div class="relative cursor-pointer">
		<select
			id={uid}
			bind:value
			class="
				w-full px-3 py-2
				border
				outline-none
				hover:border-accent
				focus:border-accent
				bg-bg
				transition
				cursor-pointer
				appearance-none
				pr-8 /* space for the chevron */
			"
		>
			{#if allowEmpty}
				<option value="" class="">
					{placeholder}
				</option>
			{/if}

			{#each options as opt (opt)}
				<option value={opt.value}>
					{opt.label}
				</option>
			{/each}

		</select>

		<!-- Chevron Icon -->
		<div
			class="
				absolute inset-y-0 right-2
				flex items-center
				pointer-events-none
			"
		>
			<MdiChevronDown />
		</div>
	</div>
</div>

<style>
    option:checked {
        color: var(--color-accent);
    }
</style>