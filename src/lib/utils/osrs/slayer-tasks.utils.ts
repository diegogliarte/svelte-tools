import type { SlayerAssignment, SlayerRequirement } from '$lib/data/osrs/slayer-tasks.types';

export type SlayerProfile = {
	levels: Record<string, number>;
	quests: Record<string, boolean>;
	unlocks: Record<string, boolean>;
	other: Record<string, boolean>;
};

export function requirementMet(requirement: SlayerRequirement, profile: SlayerProfile): boolean {
	if (requirement.type === 'skill') return (profile.levels[requirement.label] ?? 1) >= requirement.level;
	if (requirement.type === 'quest') return !!profile.quests[requirement.id];
	if (requirement.type === 'other') return !!profile.other[requirement.id];

	const enabled = !!profile.unlocks[requirement.id];
	return requirement.inverted ? !enabled : enabled;
}

export function unmetRequirements(requirements: SlayerRequirement[], profile: SlayerProfile) {
	return requirements.filter((requirement) => !requirementMet(requirement, profile));
}

export function requirementLabel(requirement: SlayerRequirement) {
	if (requirement.type === 'skill') return `${requirement.label} ${requirement.level}`;
	if (requirement.type === 'unlock' && requirement.inverted) return `${requirement.label} disabled`;
	return requirement.label;
}

export function blockSlots(questPoints: number, eliteLumbridgeDiary: boolean, maximum = 7) {
	const standard = Math.min(6, Math.floor(Math.max(0, questPoints) / 50)) + (eliteLumbridgeDiary ? 1 : 0);
	return Math.min(standard, maximum);
}

export function weightedChances(assignments: SlayerAssignment[], choices = 1): Map<string, number> {
	const chances = new Map(assignments.map((assignment) => [assignment.taskId, 0]));
	const picks = Math.min(Math.max(1, choices), assignments.length);

	function visit(remaining: SlayerAssignment[], depth: number, probability: number, selected: string[]) {
		if (depth === picks || !remaining.length) {
			for (const taskId of selected) chances.set(taskId, (chances.get(taskId) ?? 0) + probability);
			return;
		}

		const total = remaining.reduce((sum, assignment) => sum + assignment.weight, 0);
		if (!total) return;
		for (let index = 0; index < remaining.length; index += 1) {
			const assignment = remaining[index];
			visit(
				remaining.filter((_, remainingIndex) => remainingIndex !== index),
				depth + 1,
				probability * (assignment.weight / total),
				[...selected, assignment.taskId]
			);
		}
	}

	visit(assignments, 0, 1, []);
	return chances;
}
