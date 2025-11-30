import type { ToolDefinition } from '$lib/tools/types';
import Tool from './Tool.svelte';

export const tool: ToolDefinition = {
	title: 'Base64 Encoder Decoder',
	description: 'Encode and decode text using Base64 encoding scheme.',
	component: Tool
};
