import type { Component } from "svelte";

export interface ToolDefinition {
	title: string;
	description: string;
	component: Component;
}

export interface ToolCategory {
	name: string;
	tools: ToolDefinition[];
	subgroups: ToolCategory[];
}