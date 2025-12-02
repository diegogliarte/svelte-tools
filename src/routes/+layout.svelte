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

	<div class="flex flex-col flex-1 overflow-y-auto {isSidebarOpen ? 'pl-40' : ''}">

		<Navbar {toggleSidebar} />

		<main class="p-4 flex flex-col flex-1 overflow-x-auto">
			{@render children()}
		</main>

		<Footer />
	</div>

</div>

