<script lang="ts">
	import { getPokemonTypeColor } from '$lib/utils/pokemon.utils';
	let { type, short = false, highlight = false }: { type: string; short?: boolean; highlight?: boolean } = $props();
</script>

<span
	class="inline-flex items-center justify-center px-2 py-0.5 font-bold text-white transition {short
		? 'h-12 w-12 p-0 text-sm'
		: 'text-xs'} {highlight
		? '[box-shadow:inset_0_0_0_2px_var(--color-accent)] brightness-125'
		: ''} {getPokemonTypeColor(type)}">{short ? type.slice(0, 3).toUpperCase() : type}</span
>
