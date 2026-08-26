import { createJsonLoader } from '$lib/data/json-loader';
import type { Hissatsu, Player } from '$lib/utils/inazuma-eleven-vr.utils';

import braceletsUrl from './bracelets.json?url';
import bootsUrl from './boots.json?url';
import hissatsuUrl from './hissatsu.json?url';
import miscUrl from './miscs.json?url';
import pendantsUrl from './pendants.json?url';
import playersUrl from './players.json?url';

export type EquipmentItem = Record<string, string | number>;

export const loadBracelets = createJsonLoader<EquipmentItem[]>(braceletsUrl);
export const loadBoots = createJsonLoader<EquipmentItem[]>(bootsUrl);
export const loadHissatsu = createJsonLoader<Hissatsu[]>(hissatsuUrl);
export const loadMisc = createJsonLoader<EquipmentItem[]>(miscUrl);
export const loadPendants = createJsonLoader<EquipmentItem[]>(pendantsUrl);
export const loadPlayers = createJsonLoader<Player[]>(playersUrl);

export async function loadEquipment() {
	const [boots, pendants, bracelets, misc] = await Promise.all([
		loadBoots(),
		loadPendants(),
		loadBracelets(),
		loadMisc()
	]);

	return { boots, pendants, bracelets, misc };
}
