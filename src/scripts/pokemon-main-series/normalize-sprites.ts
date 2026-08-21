import { execFile } from 'node:child_process';
import { readdir, unlink } from 'node:fs/promises';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const STATIC = new URL('../../../static/pokemon/main-series/', import.meta.url);
const SIZE = 80;
const write = process.argv.includes('--write');

type Bounds = { width: number; height: number; x: number; y: number };
type Sprite = { path: URL; canvasWidth: number; canvasHeight: number; bounds: Bounds };

async function batches<T>(values: T[], fn: (value: T) => Promise<void>) {
	for (let index = 0; index < values.length; index += 25) {
		await Promise.all(values.slice(index, index + 25).map(fn));
	}
}

async function inspect(path: URL): Promise<Sprite> {
	const { stdout } = await exec('magick', ['identify', '-format', '%w %h %@', path.pathname]);
	const match = stdout.trim().match(/^(\d+) (\d+) (\d+)x(\d+)\+(-?\d+)\+(-?\d+)$/);
	if (!match) throw new Error(`Could not read sprite bounds: ${path.pathname} (${stdout.trim()})`);
	return {
		path,
		canvasWidth: Number(match[1]),
		canvasHeight: Number(match[2]),
		bounds: { width: Number(match[3]), height: Number(match[4]), x: Number(match[5]), y: Number(match[6]) }
	};
}

const paths: URL[] = [];
for (let generation = 1; generation <= 5; generation++) {
	const directory = new URL(`generation-${generation}/`, STATIC);
	const names = await readdir(directory);
	const sources = new Map<string, string>();
	for (const name of names) {
		if (!/\.(png|webp)$/.test(name)) continue;
		const key = name.replace(/\.(png|webp)$/, '');
		if (name.endsWith('.png') || !sources.has(key)) sources.set(key, name);
	}
	for (const name of sources.values()) paths.push(new URL(name, directory));
}

const sprites: Sprite[] = [];
await batches(paths, async (path) => {
	sprites.push(await inspect(path));
});

const oversized = sprites.filter(({ bounds }) => bounds.width > SIZE || bounds.height > SIZE);

if (write) {
	await batches(sprites, async (sprite) => {
		const { path } = sprite;
		const output = new URL(path.pathname.replace(/\.(png|webp)$/, '.webp'), 'file:');
		const resize = oversized.includes(sprite)
			? []
			: ['-trim', '+repage', '-background', 'none', '-gravity', 'center', '-extent', `${SIZE}x${SIZE}`];
		await exec('magick', [path.pathname, ...resize, '-define', 'webp:lossless=true', output.pathname]);
		if (path.pathname.endsWith('.png')) await unlink(path);
	});
	console.log(
		`Converted ${sprites.length} sprites to lossless WebP; ` +
			`${sprites.length - oversized.length} use ${SIZE}x${SIZE} canvases and ` +
			`${oversized.length} oversized sprites retain their original dimensions`
	);
	process.exit(0);
}

const wrongSize = sprites.filter(
	(sprite) => !oversized.includes(sprite) && (sprite.canvasWidth !== SIZE || sprite.canvasHeight !== SIZE)
);
const wrongFormat = sprites.filter(({ path }) => !path.pathname.endsWith('.webp'));
if (wrongSize.length) throw new Error(`${wrongSize.length} fitting sprites do not have an ${SIZE}x${SIZE} canvas`);
if (wrongFormat.length) throw new Error(`${wrongFormat.length} sprites are not WebP images`);
console.log(
	`Checked ${sprites.length} lossless WebP sprites: ${sprites.length - oversized.length} are ${SIZE}x${SIZE} and ` +
		`${oversized.length} oversized sprites retain their original dimensions`
);
