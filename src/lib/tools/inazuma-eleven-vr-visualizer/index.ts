import type { ToolDefinition } from '$lib/tools/types';
import Tool from './Tool.svelte';

export const tool: ToolDefinition = {
	title: 'Visualizer',
	description: 'View the players by teams, etc...',
	component: Tool,
	fullscreen: true
};
