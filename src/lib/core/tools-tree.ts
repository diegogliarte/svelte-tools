import type { ToolCategory } from '$lib/tools/types';

import { tool as BMICalculator } from '$lib/tools/bmi-calculator';
import { tool as HasherGenerator } from '$lib/tools/hash-generator';
import { tool as ChronoTool } from '$lib/tools/chrono';
import { tool as PasswordGenerator } from '$lib/tools/password-generator';

export const toolsTree: ToolCategory[] = [
	{
		name: 'Health',
		tools: [BMICalculator],
		subgroups: []
	},
	{
		name: 'Productivity',
		tools: [ChronoTool],
		subgroups: []
	},
	{
		name: 'Development',
		tools: [],
		subgroups: [
			{
				name: 'Generators',
				tools: [HasherGenerator, PasswordGenerator],
				subgroups: [],
			}],
	}
];
