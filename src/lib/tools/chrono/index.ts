import type { ToolDefinition } from '$lib/tools/types';
import Tool from './Tool.svelte';

export const tool: ToolDefinition = {
	title: 'Chrono',
	description: 'Simple chronometer.',
	component: Tool,
	removeBorder: true,
};
