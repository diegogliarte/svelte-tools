import type { ToolCategory } from '$lib/tools/types';

import { tool as BMICalculator } from '$lib/tools/bmi-calculator';
import { tool as HasherGenerator } from '$lib/tools/hash-generator';
import { tool as ChronoTool } from '$lib/tools/chrono';
import { tool as PasswordGenerator } from '$lib/tools/password-generator';
import { tool as QRGenerator } from '$lib/tools/qr-generator';
import { tool as RunningCalculator } from '$lib/tools/running-calculator';
import { tool as CompoundInterestCalculator } from '$lib/tools/compound-interest-calculator';
import { tool as InazumaElevenVRStats } from '$lib/tools/inazuma-eleven-vr-stats';
import { tool as Base64EncoderDecoder } from '$lib/tools/base64-encoder-decoder';

export const toolsTree: ToolCategory[] = [
	{
		name: 'Health',
		tools: [BMICalculator, RunningCalculator],
		subgroups: []
	},
	{
		name: 'Productivity',
		tools: [ChronoTool, CompoundInterestCalculator],
		subgroups: []
	},
	{
		name: 'Development',
		tools: [HasherGenerator, PasswordGenerator, QRGenerator, Base64EncoderDecoder],
		subgroups: [],
	},
	{
		name: 'Inazuma Eleven VR',
		tools: [InazumaElevenVRStats],
		subgroups: []
	}
];
