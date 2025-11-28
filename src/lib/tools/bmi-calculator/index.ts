import type { ToolDefinition } from '$lib/tools/types';
import Tool from './Tool.svelte';

export const tool: ToolDefinition = {
	title: 'BMI Calculator',
	description: 'Calculate your Body Mass Index (BMI) based on your height and weight.',
	component: Tool
};
