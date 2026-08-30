export type SlayerRequirement =
	| { type: 'skill'; id: string; label: string; level: number }
	| { type: 'quest' | 'unlock' | 'other'; id: string; label: string; inverted?: boolean };

export type SlayerAlternative = {
	name: string;
	wikiPath?: string;
	isBoss: boolean;
};

export type SlayerAssignment = {
	taskId: string;
	masterId: string;
	name: string;
	wikiPath?: string;
	weight: number;
	requirements: SlayerRequirement[];
	amount?: [number, number];
	extendedAmount?: [number, number];
	alternatives: SlayerAlternative[];
	bosses?: {
		id: string;
		name: string;
		wikiPath?: string;
		weight: number;
		requirements: SlayerRequirement[];
	}[];
};

export type SlayerMaster = {
	id: string;
	name: string;
	aliases: string[];
	blockCost: number;
	maxBlockSlots?: number;
	minimumCombat?: number;
	minimumSlayer?: number;
	requirements?: string[];
	choiceCount?: number;
};

export type SlayerTasksData = {
	generatedAt: string;
	sources: { title: string; revisionId: number; revisionTimestamp?: string }[];
	masters: SlayerMaster[];
	assignments: SlayerAssignment[];
	quests: { id: string; label: string }[];
	unlocks: { id: string; label: string; inverted?: boolean }[];
	otherRequirements: { id: string; label: string }[];
	skills: string[];
};
