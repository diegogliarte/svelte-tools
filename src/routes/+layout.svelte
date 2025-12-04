<script lang="ts">
	import './layout.css';
	import '$lib/css/fonts.css';

	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();

	let isSidebarOpen = $state(true);
	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}
</script>

<div class="flex bg-bg text-text ">

	<Sidebar visible={isSidebarOpen} />

	<div class="flex flex-col flex-1 min-h-screen {isSidebarOpen ? 'pl-sidebar' : ''}">

		<Navbar {toggleSidebar} />

		<main class="p-4 flex-1">
			{@render children()}
		</main>

		<Footer />
	</div>
</div>


