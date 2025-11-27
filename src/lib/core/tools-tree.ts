import type { ToolCategory } from '$lib/tools/types';

import { tool as ToolA } from '$lib/tools/ToolA';
import { tool as ToolB } from '$lib/tools/ToolB';
import { tool as Chrono } from '$lib/tools/Chrono';

export const toolsTree: ToolCategory[] = [
	{
		name: "Health",
		tools: [],
		subgroups: [
			{
				name: "Body",
				tools: [ToolA],
				subgroups: []
			}
		]
	},
	{
		name: "Development",
		tools: [ToolB, Chrono],
		subgroups: []
	}
];
