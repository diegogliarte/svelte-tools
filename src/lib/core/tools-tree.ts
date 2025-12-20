import type { ToolCategory } from '$lib/tools/types';
import { slugify } from '$lib/utils/slug.utils';

import { tool as BMICalculator } from '$lib/tools/bmi-calculator';
import { tool as HasherGenerator } from '$lib/tools/hash-generator';
import { tool as ChronoTool } from '$lib/tools/chrono';
import { tool as PasswordGenerator } from '$lib/tools/password-generator';
import { tool as QRGenerator } from '$lib/tools/qr-generator';
import { tool as RunningCalculator } from '$lib/tools/running-calculator';
import { tool as CompoundInterestCalculator } from '$lib/tools/compound-interest-calculator';
import { tool as InazumaElevenVRStats } from '$lib/tools/inazuma-eleven-vr-stats';
import { tool as Base64EncoderDecoder } from '$lib/tools/base64-encoder-decoder';
import { tool as JSONFormatter } from '$lib/tools/json-formatter';
import { tool as InazumaElevenVRVisualizer } from '$lib/tools/inazuma-eleven-vr-visualizer';
import { tool as DigimonStoryTSStats } from '$lib/tools/digimon-story-ts-stats';
import { tool as DigimonStoryTSTeamBuilder } from '$lib/tools/digimon-story-ts-team-builder';
import { tool as DigimonStoryTSShortestRoute } from '$lib/tools/digimon-story-ts-shortest-route';

function applyHref(category: ToolCategory, parentPath = ''): ToolCategory {
	const categorySlug = slugify(category.name);
	const fullPath = parentPath ? `${parentPath}/${categorySlug}` : categorySlug;

	category.tools = category.tools.map((tool) => ({
		...tool,
		href: `/${fullPath}/${slugify(tool.title)}`
	}));

	category.subgroups = category.subgroups.map((sub) => applyHref(sub, fullPath));

	return category;
}

export const rawTree: ToolCategory[] = [
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
		tools: [HasherGenerator, PasswordGenerator, QRGenerator, Base64EncoderDecoder, JSONFormatter],
		subgroups: []
	},
	{
		name: 'Inazuma Eleven VR',
		tools: [InazumaElevenVRStats, InazumaElevenVRVisualizer],
		subgroups: []
	},
	{
		name: 'Digimon Story TS',
		tools: [DigimonStoryTSStats, DigimonStoryTSTeamBuilder, DigimonStoryTSShortestRoute],
		subgroups: []
	}
];

export const toolsTree = rawTree.map((c) => applyHref(c));
