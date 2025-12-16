import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.join(
	'src',
	'lib',
	'data',
	'digimon-story-ts'
);

const ICON_OUT_DIR = path.join(
	'static',
	'digimon-story-ts',
	'icons'
);
const DIGIMON_JSON = path.join(DATA_DIR, 'digimon.json');

// -----------------------------------------------------
// helpers
// -----------------------------------------------------
function ensureDir(dir: string) {
	fs.mkdirSync(dir, { recursive: true });
}

function slugify(x: string) {
	return x
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

async function download(url: string, out: string) {
	if (fs.existsSync(out)) return;

	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to download ${url}`);

	const buf = Buffer.from(await res.arrayBuffer());
	fs.writeFileSync(out, buf);
}

// -----------------------------------------------------
// main
// -----------------------------------------------------
async function run() {
	ensureDir(ICON_OUT_DIR);

	const digimon = JSON.parse(fs.readFileSync(DIGIMON_JSON, 'utf-8'));

	let downloaded = 0;
	let skipped = 0;

	for (const d of digimon) {
		if (!d.icon) {
			skipped++;
			continue;
		}

		const ext = path.extname(d.icon).split('?')[0] || '.png';
		const filename = `${d.id}-${slugify(d.name)}${ext}`;
		const outPath = path.join(ICON_OUT_DIR, filename);

		try {
			await download(d.icon, outPath);
			downloaded++;
		} catch (err) {
			console.error(`❌ ${d.name}:`, err);
		}
	}

	console.log(`Downloaded ${downloaded} icons`);
	console.log(`Skipped ${skipped} entries`);
	console.log(`Saved to ${ICON_OUT_DIR}`);
}

run().catch(console.error);
