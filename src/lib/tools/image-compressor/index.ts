import type { ToolDefinition } from '$lib/tools/types';
import Tool from './Tool.svelte';

export const tool: ToolDefinition = {
	title: 'Image Compressor',
	description: 'Convert any image to WEBP/JPG/PNG and change its quality.',
	component: Tool
};
