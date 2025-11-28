<script lang="ts">
	import Icon from "@iconify/svelte";
</script>

<footer class="p-2 text-center text-xs flex flex-col items-center gap-2">
	<a
		href="https://ko-fi.com/diegogliarte"
		target="_blank"
		rel="noreferrer"
		class="
            flex items-center gap-2
            px-1 py-1
            border
            text-text hover:bg-accent-dark
            transition-colors duration-150
            cursor-pointer
        "
		title="Buy me a coffee on Ko-fi"
	>
		<Icon icon="mdi:coffee" class="w-3 h-3" />
		<span>Buy me a coffee</span>
	</a>

	<span class="text-text-dim">
        © {new Date().getFullYear()} by
        <a
					href="https://github.com/diegogliarte"
					target="_blank"
					rel="noreferrer"
					class="text-accent hover:underline"
				>
            diegogliarte
        </a>
    </span>

</footer>
