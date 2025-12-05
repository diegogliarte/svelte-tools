<script lang="ts">
	import MdiMenu from "~icons/mdi/menu";
	import MdiGithub from "~icons/mdi/github";
	import MdiHome from "~icons/mdi/home";
	import MdiShape from "~icons/mdi/shape";

	export let toggleSidebar: () => void;
</script>

<nav class="w-full border-b border-text bg-bg text-text px-4 py-2 flex items-center gap-4 z-50">
	<!-- Sidebar toggle -->
	<button class="text-text hover:text-accent transition cursor-pointer" onclick={toggleSidebar}>
		<MdiMenu class="w-6 h-6" />
	</button>

	<!-- Home -->
	<a href="/" class="hover:text-accent transition">
		<MdiHome class="w-6 h-6" />
	</a>

	<div class="flex-1"></div>

	<!-- GitHub -->
	<a
		href="/components"
		class="text-text hover:text-accent transition"
	>
		<MdiShape class="w-6 h-6" />
	</a>
	<a
		href="https://github.com/diegogliarte/tools"
		target="_blank"
		class="text-text hover:text-accent transition"
	>
		<MdiGithub class="w-6 h-6" />
	</a>
</nav>
