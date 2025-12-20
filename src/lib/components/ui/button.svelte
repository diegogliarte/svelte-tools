<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		active?: boolean;
		disabled?: boolean;
		onClick?: () => void;
		children: Snippet;
	}

	let {
		active = false,
		disabled = false,
		onClick = undefined,
		children
	}: Props = $props();

	function handleClick() {
		if (!disabled && onClick) onClick();
	}
</script>

<button
	class="
        px-2 py-1 border transition cursor-pointer
        hover:border-accent
        disabled:opacity-50 disabled:cursor-not-allowed
        {active ? 'bg-accent text-white border-accent' : ''}
    "
	onclick={handleClick}
	{disabled}
>
	{@render children()}
</button>
