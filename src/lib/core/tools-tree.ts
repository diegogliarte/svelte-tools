import type { ToolCategory } from '$lib/tools/types';

import { tool as BMICalculator } from '$lib/tools/bmi-calculator';
import { tool as HasherGenerator } from '$lib/tools/hash-generator';

export const toolsTree: ToolCategory[] = [
	{
		name: 'Health',
		tools: [BMICalculator],
		subgroups: []
	},
	{
		name: 'Development',
		tools: [],
		subgroups: [
			{
				name: 'Generators',
				tools: [HasherGenerator],
				subgroups: []
			}],
	}
];
