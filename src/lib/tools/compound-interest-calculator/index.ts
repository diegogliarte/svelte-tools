import type { ToolDefinition } from '$lib/tools/types';
import Tool from './Tool.svelte';

export const tool: ToolDefinition = {
	title: 'Compound Interest Calculator',
	description:
		'Calculate the future value of an investment based on periodic, constant contributions and a fixed interest rate.',
	component: Tool
};
