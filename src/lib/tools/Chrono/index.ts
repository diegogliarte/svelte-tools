import type { ToolDefinition } from '$lib/tools/types';
import Chrono from '$lib/tools/Chrono/Chrono.svelte';

export const tool: ToolDefinition = {
	title: "Chrono",
	description: "A tool for managing and tracking time-related data",
	component: Chrono
};