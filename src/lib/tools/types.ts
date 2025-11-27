import type { Component } from "svelte";

export interface ToolMetadata {
	title: string;
	description: string;
}

export interface ToolDefinition extends ToolMetadata {
	component: Component;
}

export interface ToolCategory {
	name: string;
	tools: ToolDefinition[];
	subgroups: ToolCategory[];
}
