import { createJsonLoader } from '$lib/data/json-loader';
import type { Equipment, Move, Player } from '$lib/utils/inazuma-eleven-1.utils';

import equipmentUrl from './equipment.json?url';
import movesUrl from './moves.json?url';
import playersUrl from './players.json?url';

export const loadEquipment = createJsonLoader<Equipment[]>(equipmentUrl);
export const loadMoves = createJsonLoader<Move[]>(movesUrl);
export const loadPlayers = createJsonLoader<Player[]>(playersUrl);
