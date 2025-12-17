import { toKebabCase } from '$lib/utils/text.utils';

export interface DigimonBaseStats {
	lv1: Record<string, number>;
	lv99: Record<string, number>;
}

export interface DigimonEvolutionCondition {
	type: 'simple' | 'stats' | 'jogress' | 'item';
	requirements: Record<string, string>;
}

export interface DigimonSkillSet {
	special: string[];
	attachment: string[];
}

export interface DigimonPossiblePersonalities {
	[category: string]: {
		name: string;
		chance: number;
	}[];
}

export interface Digimon {
	id: number;
	slug: string;
	name: string;

	icon: string;

	generation: string;
	attribute: string;
	type: string;
	base_personality: string;
	ridable: boolean;

	base_stats: DigimonBaseStats;

	possible_personalities: DigimonPossiblePersonalities;

	evolution_conditions: DigimonEvolutionCondition[];
	pre_evolutions: number[]; // Digimon IDs
	evolutions: number[];     // Digimon IDs

	skills: DigimonSkillSet;
}

export type SkillCategory = 'special' | 'attachment';

export type SkillTarget =
	| 'enemy-single'
	| 'enemy-all'
	| 'ally-single'
	| 'ally-all'
	| 'self'
	| 'unknown';

export interface Skill {
	slug: string;
	url: string;
	category: SkillCategory;
	type: string
	name: string;
	damage_type?: 'physical' | 'magic';
	sp_cost?: number;
	accuracy?: number;
	crit_rate?: number;
	power?: number;
	hit_count?: number;
	description: string;
	target: SkillTarget;
}

export function getSkillIcon(type: string): string {
	return `/digimon-story-ts/skills/${toKebabCase(type)}.png`;
}

const TARGET_PATTERNS: [RegExp, SkillTarget][] = [
	[/\[Target:\s*1 enemy\]/i, 'enemy-single'],
	[/\[Target:\s*All enemies\]/i, 'enemy-all'],
	[/\[Target:\s*1 ally\]/i, 'ally-single'],
	[/\[Target:\s*All allies\]/i, 'ally-all'],
	[/\[Target:\s*Self\]/i, 'self']
];

export function parseSkillTarget(description: string): SkillTarget {
	for (const [regex, target] of TARGET_PATTERNS) {
		if (regex.test(description)) return target;
	}
	return 'unknown';
}

export function formatSkillTarget(target: SkillTarget): string {
	switch (target) {
		case 'enemy-single': return '1 enemy';
		case 'enemy-all': return 'All enemies';
		case 'ally-single': return '1 ally';
		case 'ally-all': return 'All allies';
		default: return '—';
	}
}
