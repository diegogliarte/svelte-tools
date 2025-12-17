import type { ToolDefinition } from '$lib/tools/types';
import Tool from './Tool.svelte';

export const tool: ToolDefinition = {
	title: 'Team Builder',
	description: 'Create your own Digimon team.',
	component: Tool,
	fullscreen: true
};
