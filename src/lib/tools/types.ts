import type { Component } from 'svelte';

export interface ToolDefinition {
	title: string;
	description: string;
	component: Component;
	removeBorder?: boolean;
	fullscreen?: boolean;
}

export interface ToolCategory {
	name: string;
	tools: ToolDefinition[];
	subgroups: ToolCategory[];
}
