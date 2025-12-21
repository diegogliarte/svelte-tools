<script lang="ts">
	import type { LayoutProps } from './$types';

	import './layout.css';
	import '$lib/css/fonts.css';

	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';


	let { data, children }: LayoutProps = $props();

	let isSidebarOpen = $state(data.sidebarOpen);

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;

		document.cookie = `sidebar-open=${isSidebarOpen}; path=/; max-age=31536000`;
	}
</script>

<div class="flex bg-bg text-text">
	<Sidebar visible={isSidebarOpen} />

	<div class="flex flex-col flex-1 h-full">
		<Navbar {toggleSidebar} />

		<main class="p-4 flex-1">
			{@render children()}
		</main>

		<Footer />
	</div>
</div>
