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

type TierRole = 'FW' | 'MF' | 'DF' | 'GK';

const tierStat: Record<TierRole, keyof ATDFStats> = {
	FW: 'shootAT',
	MF: 'focusAT',
	DF: 'focusDF',
	GK: 'kp'
};

export type PlayerPosition = 'FW' | 'MF' | 'DF' | 'GK' | '?';

interface HowToObtain {
	title: string;
	entries: string[];
	subsections: { title: string; entries: string[] }[];
}

export interface Player {
	ID: number;
	CharaID: string;
	Name: string;
	Nickname: string;
	RomajiName?: string;
	Archetype?: string;
	Image: string;
	Game: string;
	Description: string;
	Position: PlayerPosition;
	Element: string;
	InazugleLink: string;

	// Base stats
	Kick: number;
	Control: number;
	Technique: number;
	Pressure: number;
	Physical: number;
	Agility: number;
	Intelligence: number;
	Total: number;

	AgeGroup: string;
	Year: string;
	Gender: string;
	Role: string;
	Teams: string[];
	HowToObtain: HowToObtain[];
}

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

export type PlayerWithPower = Player & {
	power: ATDFStats;
};

export function withPower(player: Player): PlayerWithPower {
	const stats: Stats = {
		kick: player.Kick,
		control: player.Control,
		technique: player.Technique,
		pressure: player.Pressure,
		physical: player.Physical,
		agility: player.Agility,
		intelligence: player.Intelligence,
		total: player.Total
	};

	return {
		...player,
		power: calculateATDFStats(stats)
	};
}

export function computePlayerTier(
	player: Player,
	allPlayers: Player[],
	maxTiers = 99
): { tier: number | null; value: number | null } {
	const statKey = player.Position === '?' ? undefined : tierStat[player.Position];

	if (!statKey) {
		return { tier: null, value: null };
	}

	const processed = allPlayers.filter((p) => p.Name !== '???').map(withPower);

	const rolePlayers = processed.filter((p) => p.Position === player.Position);

	const sortedValues = Array.from(new Set(rolePlayers.map((p) => p.power[statKey]))).sort((a, b) => b - a);

	const current = processed.find((p) => p.ID === player.ID);
	if (!current) {
		return { tier: null, value: null };
	}

	const value = current.power[statKey];
	const index = sortedValues.indexOf(value);

	if (index === -1 || index >= maxTiers) {
		return { tier: null, value };
	}

	return {
		tier: index + 1,
		value
	};
}

export function computeRoleTiers(
	role: TierRole,
	allPlayers: Player[],
	maxTiers = 3
): {
	value: number;
	players: Player[];
}[] {
	const processed = allPlayers.filter((p) => p.Name !== '???' && p.Position === role).map(withPower);

	const statKey = tierStat[role];

	const values = Array.from(new Set(processed.map((p) => p.power[statKey])))
		.sort((a, b) => b - a)
		.slice(0, maxTiers);

	return values.map((value) => ({
		value,
		players: processed
			.filter((p) => p.power[statKey] === value)
			.sort((a, b) => {
				const elemCompare = a.Element.localeCompare(b.Element);
				if (elemCompare !== 0) return elemCompare;
				return a.Name.localeCompare(b.Name);
			})
	}));
}
