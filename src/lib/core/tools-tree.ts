
import ToolA, { toolDefinition as defA } from "$lib/tools/ToolA.svelte";
import ToolB, { toolDefinition as defB } from "$lib/tools/ToolB.svelte";
import Chrono, { toolDefinition as defChrono } from "$lib/tools/Chrono.svelte";
import type { ToolCategory } from '$lib/tools/types';

export const toolsTree: ToolCategory[] = [
	{
		name: "Health",
		tools: [],
		subgroups: [
			{
				name: "Body",
				tools: [
					{
						title: defA.title,
						description: defA.description,
						component: ToolA
					}
				],
				subgroups: []
			}
		]
	},
	{
		name: "Development",
		tools: [
			{
				title: defB.title,
				description: defB.description,
				component: ToolB
			},
			{
				title: defChrono.title,
				description: defChrono.description,
				component: Chrono
			},
		],
		subgroups: []
	}
];
