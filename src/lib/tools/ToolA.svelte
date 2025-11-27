<script context="module" lang="ts">
	import type { ToolMetadata } from '$lib/tools/types';

	export const toolDefinition: ToolMetadata = {
		title: "Tool A",
		description: "A tool under Health → Body"
	};
</script>

<script lang="ts">
	import ComponentA from '$lib/components/ComponentA.svelte';
</script>

<ComponentA />