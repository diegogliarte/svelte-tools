import { createJsonLoader } from '$lib/data/json-loader';
import slayerTasksUrl from './slayer-tasks.json?url';
import type { SlayerTasksData } from './slayer-tasks.types';

export const loadSlayerTasks = createJsonLoader<SlayerTasksData>(slayerTasksUrl);
