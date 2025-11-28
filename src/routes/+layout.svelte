<script lang="ts">
	import './layout.css';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<svelte:head>
</svelte:head>

<div class="min-h-screen flex flex-col">
	<main class="flex-grow m-4 h-full">
		{@render children()}
	</main>

	<Footer />
</div>
