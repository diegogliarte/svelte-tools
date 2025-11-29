<script lang="ts">
	import Icon from "@iconify/svelte";
</script>

<footer class="p-2 text-center text-small flex flex-col items-center gap-2 z-50">
	<a
		href="https://ko-fi.com/diegogliarte"
		target="_blank"
		rel="noreferrer"
		class="
            flex items-center gap-2
            px-1 py-1
            border
            hover:border-accent hover:bg-accent-dark
            transition
            cursor-pointer
        "
		title="Buy me a coffee on Ko-fi"
	>
		<Icon icon="mdi:coffee"/>
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
