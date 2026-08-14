import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

type SourceMove = {
	name?: string;
	description?: string;
	power?: string;
};

type SourceBoard = {
	location: string;
	clues?: string[];
	clue1?: string;
	clue2?: string;
	clue3?: string;
	solution: string;
	effect: string;
};

type SourceYokai = {
	index: number;
	name: string;
	yokaiNumber?: string;
	bossNumber?: string;
	image: string;
	description?: string;
	locations?: Array<string | null>;
	skill?: SourceMove;
	attack?: SourceMove;
	technique?: SourceMove;
	soultime?: SourceMove;
	inspirit?: SourceMove;
	stats?: Partial<Record<'hp' | 'str' | 'spr' | 'def' | 'spd', string>>;
	tribe: string;
	element: string;
	weakness?: string;
	rank: string;
	favouriteFood?: string;
};

type SourceFood = {
	name: string;
	image: string;
};

const sourceBase = 'https://raw.githubusercontent.com/joaopedrodcf/yokaidex/master';
const cloudinaryPrefix = /^https:\/\/res\.cloudinary\.com\/dcrcweea8\/image\/upload\/(?:v\d+\/)?Yokai\//i;
const imageKitPrefix = 'https://ik.imagekit.io/s0558jeir/yokaidex/';
const projectRoot = process.cwd();
const dataDirectory = path.join(projectRoot, 'src/lib/data/yokai-watch-2');
const yokaiImageDirectory = path.join(projectRoot, 'static/yokai-watch-2/yokais');
const foodImageDirectory = path.join(projectRoot, 'static/yokai-watch-2/foods');

function slugify(value: string) {
	return value
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

function titleCase(value: string) {
	return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

function yokaiImageName(yokai: SourceYokai) {
	return `${String(yokai.index).padStart(3, '0')}-${slugify(yokai.name)}.png`;
}

function resolveImageUrl(url: string) {
	return url.replace(cloudinaryPrefix, imageKitPrefix);
}

async function download(url: string) {
	const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
	if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`);
	return response;
}

async function downloadSource(directory: string, sourcePath: string) {
	const response = await download(`${sourceBase}/${sourcePath}`);
	const destination = path.join(directory, path.basename(sourcePath));
	await writeFile(destination, await response.text());
	return destination;
}

async function importDefault<T>(filePath: string): Promise<T> {
	return (await import(`${filePath}?updated=${Date.now()}`)).default as T;
}

async function runInBatches(tasks: Array<() => Promise<void>>, batchSize = 12) {
	for (let index = 0; index < tasks.length; index += batchSize) {
		await Promise.all(tasks.slice(index, index + batchSize).map((task) => task()));
	}
}

async function main() {
	const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'yokai-watch-2-'));

	try {
		const [boardsPath, quizBoardsPath, yokaisPath, foodsPath] = await Promise.all([
			downloadSource(temporaryDirectory, 'data/yokai-watch-2/baffle-boards.ts'),
			downloadSource(temporaryDirectory, 'data/baffleboards-gate-of-whimsy.ts'),
			downloadSource(temporaryDirectory, 'data/yokai-watch-2/yokais.ts'),
			downloadSource(temporaryDirectory, 'data/foods.ts')
		]);

		const [sourceBoards, quizBoards, sourceYokais, foods] = await Promise.all([
			importDefault<SourceBoard[]>(boardsPath),
			importDefault<SourceBoard[]>(quizBoardsPath),
			importDefault<SourceYokai[]>(yokaisPath),
			importDefault<SourceFood[]>(foodsPath)
		]);
		const sourceYokaiByName = new Map(sourceYokais.map((yokai) => [yokai.name.trim(), yokai]));
		const foodByName = new Map(foods.map((food) => [food.name, food]));
		const allBoards = [
			...sourceBoards,
			...quizBoards.map((board) => ({
				...board,
				location: 'Gate of Whimsy: Quiz Room',
				clues: [board.clue1, board.clue2, board.clue3].filter((clue): clue is string => Boolean(clue)),
				effect: 'Quiz-only board; no Yo-kai Hot Spot effect.'
			}))
		];

		const yokais = sourceYokais.map((yokai) => ({
			id: yokai.index,
			number: yokai.yokaiNumber ?? yokai.bossNumber ?? '',
			name: yokai.name.trim(),
			image: `/yokai-watch-2/yokais/${yokaiImageName(yokai)}`,
			description: yokai.description?.trim() ?? '',
			locations: (yokai.locations ?? []).filter((location): location is string => Boolean(location)),
			skill: yokai.skill ?? {},
			attack: yokai.attack ?? {},
			technique: yokai.technique ?? {},
			soultimate: yokai.soultime ?? {},
			inspirit: yokai.inspirit ?? {},
			stats: yokai.stats ?? {},
			tribe: titleCase(yokai.tribe),
			element: yokai.element,
			weakness: yokai.weakness ?? '',
			rank: yokai.rank.toUpperCase(),
			favouriteFood: yokai.favouriteFood ?? ''
		}));
		const boards = allBoards.map((board, index) => {
			const yokai = sourceYokaiByName.get(board.solution.trim());
			if (!yokai) throw new Error(`Missing Yo-kai data for ${board.solution}`);

			return {
				id: index + 1,
				yokaiId: yokai.index,
				boardLocation: board.location.trim(),
				clues: (board.clues ?? []).map((clue) => clue.trim()),
				effect: board.effect.trim()
			};
		});

		await mkdir(dataDirectory, { recursive: true });
		await rm(yokaiImageDirectory, { recursive: true, force: true });
		await rm(foodImageDirectory, { recursive: true, force: true });
		await mkdir(yokaiImageDirectory, { recursive: true });
		await mkdir(foodImageDirectory, { recursive: true });

		await runInBatches(
			sourceYokais.map((yokai) => async () => {
				const response = await download(resolveImageUrl(yokai.image));
				await writeFile(
					path.join(yokaiImageDirectory, yokaiImageName(yokai)),
					Buffer.from(await response.arrayBuffer())
				);
			})
		);

		const usedFoods = new Set(yokais.map((yokai) => yokai.favouriteFood).filter(Boolean));
		await runInBatches(
			[...usedFoods].map((name) => async () => {
				const food = foodByName.get(name);
				if (!food) throw new Error(`Missing food data for ${name}`);

				const response = await download(resolveImageUrl(food.image));
				await writeFile(
					path.join(foodImageDirectory, `${slugify(name)}.png`),
					Buffer.from(await response.arrayBuffer())
				);
			})
		);

		await Promise.all([
			writeFile(path.join(dataDirectory, 'yokais.json'), `${JSON.stringify(yokais, null, '\t')}\n`),
			writeFile(path.join(dataDirectory, 'baffle-boards.json'), `${JSON.stringify(boards, null, '\t')}\n`)
		]);
		console.log(`Generated ${yokais.length} Yo-kai and ${boards.length} Baffle Board entries.`);
	} finally {
		await rm(temporaryDirectory, { recursive: true, force: true });
	}
}

await main();
