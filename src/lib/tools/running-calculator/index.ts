import type { ToolDefinition } from '$lib/tools/types';
import Tool from './Tool.svelte';

export const tool: ToolDefinition = {
	title: 'Running Calculator',
	description: 'Lock one parameter (time, distance, or pace) and calculate the other two',
	component: Tool
};
