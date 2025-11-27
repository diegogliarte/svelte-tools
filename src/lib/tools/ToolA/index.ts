import type { ToolDefinition } from '$lib/tools/types';
import ToolA from '$lib/tools/ToolA/ToolA.svelte';

export const tool: ToolDefinition = {
	title: "ToolA",
	description: "AAAAAAAAAAAA",
	component: ToolA
};