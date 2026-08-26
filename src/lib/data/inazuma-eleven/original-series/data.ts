import { createJsonLoader } from '$lib/data/json-loader';
import type { Equipment, Move, Player } from '$lib/utils/inazuma-eleven-1.utils';

import ie1Equipment from '../inazuma-eleven-1/equipment.json?url';
import ie1Moves from '../inazuma-eleven-1/moves.json?url';
import ie1Players from '../inazuma-eleven-1/players.json?url';
import ie2Equipment from '../inazuma-eleven-2/equipment.json?url';
import ie2Moves from '../inazuma-eleven-2/moves.json?url';
import ie2Players from '../inazuma-eleven-2/players.json?url';
import ie3Equipment from '../inazuma-eleven-3/equipment.json?url';
import ie3Moves from '../inazuma-eleven-3/moves.json?url';
import ie3Players from '../inazuma-eleven-3/players.json?url';
import ogreEquipment from '../inazuma-eleven-3-ogre/equipment.json?url';
import ogreMoves from '../inazuma-eleven-3-ogre/moves.json?url';
import ogrePlayers from '../inazuma-eleven-3-ogre/players.json?url';

export type GameData = { players: Player[]; moves: Move[]; equipment: Equipment[] };
const makeLoader = (players: string, moves: string, equipment: string) => {
	const loadPlayers = createJsonLoader<Player[]>(players);
	const loadMoves = createJsonLoader<Move[]>(moves);
	const loadEquipment = createJsonLoader<Equipment[]>(equipment);
	return async (): Promise<GameData> => {
		const [loadedPlayers, loadedMoves, loadedEquipment] = await Promise.all([
			loadPlayers(),
			loadMoves(),
			loadEquipment()
		]);
		return { players: loadedPlayers, moves: loadedMoves, equipment: loadedEquipment };
	};
};

const ie1 = makeLoader(ie1Players, ie1Moves, ie1Equipment);
const ie2 = makeLoader(ie2Players, ie2Moves, ie2Equipment);
const ie3 = makeLoader(ie3Players, ie3Moves, ie3Equipment);
const ogre = makeLoader(ogrePlayers, ogreMoves, ogreEquipment);

const withUnavailableTeams =
	(load: () => Promise<GameData>, game: string, teams: string[]) => async (): Promise<GameData> => {
		const data = await load();
		const unavailable = new Set(teams);
		return {
			...data,
			players: data.players.map((player) =>
				unavailable.has(player.team) ? { ...player, recruitment: `Unobtainable in ${game}` } : player
			)
		};
	};

const loaders: Record<string, () => Promise<GameData>> = {
	'ie-1': ie1,
	'ie-2-firestorm': withUnavailableTeams(ie2, 'Firestorm', ['Diamond Dust']),
	'ie-2-blizzard': withUnavailableTeams(ie2, 'Blizzard', ['Prominence']),
	'ie-3-lightning-bolt': withUnavailableTeams(ie3, 'Lightning Bolt', ['Devil Army Z']),
	'ie-3-bomb-blast': withUnavailableTeams(ie3, 'Bomb Blast', ['Apostles from the Sky']),
	'ie-3-team-ogre': withUnavailableTeams(ogre, 'Team Ogre Attacks!', ['Apostles from the Sky', 'Devil Army Z'])
};

export const loadGame = (game: string) => loaders[game]();
export const gameOptions = [
	{ value: 'ie-1', label: 'Inazuma Eleven' },
	{ value: 'ie-2-firestorm', label: 'Inazuma Eleven 2: Firestorm' },
	{ value: 'ie-2-blizzard', label: 'Inazuma Eleven 2: Blizzard' },
	{ value: 'ie-3-lightning-bolt', label: 'Inazuma Eleven 3: Lightning Bolt' },
	{ value: 'ie-3-bomb-blast', label: 'Inazuma Eleven 3: Bomb Blast' },
	{ value: 'ie-3-team-ogre', label: 'Inazuma Eleven 3: Team Ogre Attacks!' }
];
