import type { ToolDefinition } from '$lib/tools/types';
import Tool from './Tool.svelte';

export const tool: ToolDefinition = {
	title: 'Shortest Route',
	description: 'Generate the shortest route between two digimons.',
	component: Tool,
	fullscreen: true
};
