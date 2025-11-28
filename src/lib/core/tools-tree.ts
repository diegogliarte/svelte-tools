import type { ToolCategory } from '$lib/tools/types';

import { tool as BMICalculator } from '$lib/tools/bmi-calculator';
import { tool as HasherGenerator } from '$lib/tools/hash-generator';

export const toolsTree: ToolCategory[] = [
	{
		name: 'Health',
		tools: [BMICalculator, BMICalculator, HasherGenerator],
		subgroups: []
	},
	{
		name: 'Development',
		tools: [],
		subgroups: [
			{
				name: 'Generators',
				tools: [HasherGenerator, HasherGenerator],
				subgroups: [			{
					name: 'Generator2',
					tools: [HasherGenerator, HasherGenerator, HasherGenerator],
					subgroups: []
				}]
			}],
	}
];
