import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

type SourceBoard = {
	index?: number;
	location: string;
	clues?: string[];
	clue1?: string;
	clue2?: string;
	clue3?: string;
	solution: string;
	effect: string;
	image?: string;
};

type SourceYokai = {
	name: string;
	image: string;
	tribe: string;
	rank: string;
	locations?: Array<string | null>;
};

const sourceBase = 'https://raw.githubusercontent.com/joaopedrodcf/yokaidex/master';
const cloudinaryPrefix = /^https:\/\/res\.cloudinary\.com\/dcrcweea8\/image\/upload\/(?:v\d+\/)?Yokai\//i;
const imageKitPrefix = 'https://ik.imagekit.io/s0558jeir/yokaidex/';
const projectRoot = process.cwd();
const outputPath = path.join(projectRoot, 'src/lib/data/yokai-watch-2/baffle-boards.json');
const imageDirectory = path.join(projectRoot, 'static/yokai-watch-2/yokais');

function slugify(value: string) {
	return value
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
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

async function main() {
	const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'yokai-watch-2-'));

	try {
		const [boardsPath, quizBoardsPath, yokaisPath] = await Promise.all([
			downloadSource(temporaryDirectory, 'data/yokai-watch-2/baffle-boards.ts'),
			downloadSource(temporaryDirectory, 'data/baffleboards-gate-of-whimsy.ts'),
			downloadSource(temporaryDirectory, 'data/yokai-watch-2/yokais.ts')
		]);

		const [boards, quizBoards, yokais] = await Promise.all([
			importDefault<SourceBoard[]>(boardsPath),
			importDefault<SourceBoard[]>(quizBoardsPath),
			importDefault<SourceYokai[]>(yokaisPath)
		]);
		const yokaiByName = new Map(yokais.map((yokai) => [yokai.name.trim(), yokai]));
		const allBoards = [
			...boards,
			...quizBoards.map((board) => ({
				...board,
				location: 'Gate of Whimsy: Quiz Room',
				clues: [board.clue1, board.clue2, board.clue3].filter((clue): clue is string => Boolean(clue)),
				effect: 'Quiz-only board; no Yo-kai Hot Spot effect.'
			}))
		];

		await mkdir(path.dirname(outputPath), { recursive: true });
		await mkdir(imageDirectory, { recursive: true });

		const result = await Promise.all(
			allBoards.map(async (board, index) => {
				const name = board.solution.trim();
				const yokai = yokaiByName.get(name);
				if (!yokai) throw new Error(`Missing Yo-kai data for ${name}`);

				const imageName = `${slugify(name)}.png`;
				const imageResponse = await download(resolveImageUrl(yokai.image));
				await writeFile(path.join(imageDirectory, imageName), Buffer.from(await imageResponse.arrayBuffer()));

				return {
					id: index + 1,
					name,
					image: `/yokai-watch-2/yokais/${imageName}`,
					tribe: yokai.tribe.charAt(0).toUpperCase() + yokai.tribe.slice(1),
					rank: yokai.rank.toUpperCase(),
					boardLocation: board.location.trim(),
					clues: (board.clues ?? []).map((clue) => clue.trim()),
					effect: board.effect.trim(),
					yokaiLocations: (yokai.locations ?? []).filter((location): location is string => Boolean(location))
				};
			})
		);

		await writeFile(outputPath, `${JSON.stringify(result, null, '\t')}\n`);
		console.log(`Generated ${result.length} Baffle Board entries.`);
	} finally {
		await rm(temporaryDirectory, { recursive: true, force: true });
	}
}

await main();
