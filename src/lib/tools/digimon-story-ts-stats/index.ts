import type { ToolDefinition } from '$lib/tools/types';
import Tool from './Tool.svelte';

export const tool: ToolDefinition = {
	title: 'Stats',
	description: 'View all Digimon Story Time Stranger stats.',
	component: Tool,
	fullscreen: true
};
