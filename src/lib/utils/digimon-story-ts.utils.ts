
export interface DigimonBaseStats {
	lv1: Record<string, number>;
	lv99: Record<string, number>;
}

export interface DigimonEvolutionCondition {
	type: 'simple' | 'stats' | 'jogress' | 'item';
	requirements: Record<string, string>;
}

export interface DigimonSkillSet {
	special: string[];     // skill slugs
	attachment: string[];  // skill slugs
}

export interface DigimonPossiblePersonalities {
	[category: string]: {
		name: string;
		chance: number;
	}[];
}

// ---------------------------------------------
// Main Digimon interface
// ---------------------------------------------

export interface Digimon {
	// Identity
	id: number;
	slug: string;
	name: string;

	// Visuals
	icon: string;

	// Classification
	generation: string;
	attribute: string;
	type: string;
	base_personality: string;
	ridable: boolean;

	// Stats
	base_stats: DigimonBaseStats;

	// Conversion
	possible_personalities: DigimonPossiblePersonalities;

	// Evolution
	evolution_conditions: DigimonEvolutionCondition[];
	pre_evolutions: number[]; // Digimon IDs
	evolutions: number[];     // Digimon IDs

	// Skills
	skills: DigimonSkillSet;
}
