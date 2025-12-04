import type { ToolDefinition } from '$lib/tools/types';
import Tool from './Tool.svelte';

export const tool: ToolDefinition = {
	title: 'JSON Formatter',
	description: 'Prettify your JSONs',
	component: Tool,
	fullscreen: true
};
