import type { ToolDefinition } from '$lib/tools/types';
import Tool from './Tool.svelte';

export const tool: ToolDefinition = {
	title: 'Password Generator',
	description: 'Generate secure and random passwords, all client-side.',
	component: Tool
};
