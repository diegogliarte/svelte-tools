import type { ToolDefinition } from '$lib/tools/types';
import Tool from './Tool.svelte';

export const tool: ToolDefinition = {
	title: 'Hasher Generator',
	description: 'Generate hashes for your text using algorithms like MD5, SHA-1, SHA-256, and more.',
	component: Tool
};
