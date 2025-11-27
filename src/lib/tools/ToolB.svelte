<script context="module" lang="ts">
	import type { ToolMetadata } from '$lib/tools/types';

	export const toolDefinition: ToolMetadata = {
		title: "Tool BA",
		description: "DEVVV"
	};
</script>

<script lang="ts">
	import ComponentB from '$lib/components/ComponentB.svelte';
</script>

<ComponentB />