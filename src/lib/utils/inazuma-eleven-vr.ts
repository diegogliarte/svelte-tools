export type Stats = {
	kick: number;
	control: number;
	technique: number;
	pressure: number;
	physical: number;
	agility: number;
	intelligence: number;
	total: number;
};

export type ATDFStats = {
	shootAT: number;
	focusAT: number;
	focusDF: number;
	wallDF: number;
	scrambleAT: number;
	scrambleDF: number;
	kp: number;
};

export function calculateATDFStats(stats: Stats): ATDFStats {
	return {
		shootAT: stats.kick + stats.control,
		focusAT: stats.technique + stats.control + stats.kick * 0.5,
		focusDF: stats.technique + stats.intelligence + stats.agility * 0.5,
		wallDF: stats.pressure + stats.physical,
		scrambleAT: stats.intelligence + stats.physical,
		scrambleDF: stats.intelligence + stats.pressure,
		kp: stats.pressure * 2 + stats.physical * 3 + stats.agility * 4
	};
}
