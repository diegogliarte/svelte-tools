import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join('static', 'pokemon', 'mystery-dungeon', 'icons');

const BASE_URL = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait';

const MAX_CONSECUTIVE_FAILURES = 20;

function ensureDir(dir: string) {
	fs.mkdirSync(dir, { recursive: true });
}

function pad(n: number) {
	return n.toString().padStart(4, '0');
}

async function download(url: string, out: string) {
	if (fs.existsSync(out)) return true;

	const res = await fetch(url);
	if (!res.ok) return false;

	const buf = Buffer.from(await res.arrayBuffer());
	fs.writeFileSync(out, buf);

	return true;
}

async function downloadUnown() {
	const base = '0201';

	// A
	await download(`${BASE_URL}/${base}/Normal.png`, path.join(OUT_DIR, `0201-A.png`));

	const letters = [
		'B',
		'C',
		'D',
		'E',
		'F',
		'G',
		'H',
		'I',
		'J',
		'K',
		'L',
		'M',
		'N',
		'O',
		'P',
		'Q',
		'R',
		'S',
		'T',
		'U',
		'V',
		'W',
		'X',
		'Y',
		'Z',
		'!',
		'?'
	];

	function safeName(x: string) {
		if (x === '!') return 'exclamation';
		if (x === '?') return 'question';
		return x;
	}

	for (let i = 0; i < letters.length; i++) {
		const folder = pad(i + 1);

		const url = `${BASE_URL}/${base}/${folder}/Normal.png`;

		const out = path.join(OUT_DIR, `0201-${safeName(letters[i])}.png`);

		const ok = await download(url, out);

		if (ok) console.log(`✓ Unown ${letters[i]}`);
		else console.log(`x Unown ${letters[i]}`);
	}
}

async function run() {
	ensureDir(OUT_DIR);

	let id = 1;
	let failures = 0;
	let downloaded = 0;

	while (failures < MAX_CONSECUTIVE_FAILURES) {
		const padded = pad(id);

		// skip Unown (handled separately)
		if (padded === '0201') {
			id++;
			continue;
		}

		const url = `${BASE_URL}/${padded}/Normal.png`;
		const out = path.join(OUT_DIR, `${padded}.png`);

		const ok = await download(url, out);

		if (ok) {
			console.log(`✓ ${padded}`);
			downloaded++;
			failures = 0;
		} else {
			console.log(`x ${padded}`);
			failures++;
		}

		id++;
	}

	await downloadUnown();

	console.log('');
	console.log(`Downloaded: ${downloaded}`);
	console.log(`Saved to: ${OUT_DIR}`);
}

run().catch(console.error);
