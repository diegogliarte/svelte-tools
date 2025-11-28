import type { ToolCategory } from '$lib/tools/types';

import { tool as BMICalculator } from '$lib/tools/bmi-calculator';

export const toolsTree: ToolCategory[] = [
	{
		name: 'Health',
		tools: [BMICalculator],
		subgroups: []
	}
];
