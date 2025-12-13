import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const LIST_URL = 'https://zukan.inazuma.jp/en/skill/?per_page=1000';

const OUT_PATH = path.join('src', 'lib', 'data', 'inazuma-eleven-vr', 'hissatsu.json');
const existing = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));

function clean(x: string) {
	return x.replace(/\s+/g, ' ').trim();
}

async function fetchHtml(url: string) {
	const res = await fetch(url);
	if (!res.ok) throw new Error('Fetch failed: ' + url);
	return await res.text();
}

function parseListPage(html: string) {
	const $ = load(html);
	const movieMap: Record<string, string | null> = {};

	$('li')
		.has('.nameBox')
		.each((_i, li) => {
			const $li = $(li);

			// ==== NAME ====
			const ruby = $li.find('.nameBox ruby').clone();
			ruby.find('rt').remove();
			const rubyName = clean(ruby.text());
			const name = rubyName || clean($li.find('.nameBox span.name').text());
			if (!name) return;

			// ==== MOVIE URL (.wmv) ====
			const wmvUrl =
				$li.find('.btnBox a[data-movie-url]').attr('data-movie-url') ??
				$li.find('figure.movie a[data-movie-url]').attr('data-movie-url') ??
				null;

			if (!wmvUrl) {
				movieMap[name] = null;
				return;
			}

			// Convert WMV → WEBM
			const webmUrl = wmvUrl.replace('.wmv', '.webm');

			movieMap[name] = webmUrl;
		});

	return movieMap;
}

async function run() {
	console.log('Fetching hissatsu list...');
	const html = await fetchHtml(LIST_URL);

	const movieMap = parseListPage(html);
	console.log('Found:', Object.keys(movieMap).length, 'entries');

	// Merge into your existing hissatsu.json
	for (const item of existing) {
		item.Movie = movieMap[item.Name] ?? null;
	}

	fs.writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2));
	console.log('Saved →', OUT_PATH);
}

run().catch(console.error);
