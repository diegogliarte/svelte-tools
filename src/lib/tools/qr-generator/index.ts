import type { ToolDefinition } from '$lib/tools/types';
import Tool from './Tool.svelte';

export const tool: ToolDefinition = {
	title: 'QR Generator',
	description: 'Generate QR codes from text or URLs.',
	component: Tool
};
