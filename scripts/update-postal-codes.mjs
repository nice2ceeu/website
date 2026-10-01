import { readFile, writeFile } from 'node:fs/promises';
const source = 'https://phlpost.gov.ph/zip-code-locator/';
const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error(`PHLPost returned ${response.status}`);
const html = await response.text();
const decode = (value) =>
  value
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&nbsp;/g, ' ')
    .trim();
const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
  .map((match) =>
    [...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => decode(cell[1])),
  )
  .filter((row) => row.length === 4 && /^\d{4}$/.test(row[3]));
if (rows.length < 900) throw new Error('Incomplete postal source; snapshot not replaced');
const addresses = JSON.parse(await readFile('data/addresses/philippines.json', 'utf8'));
const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^city of /, '')
    .replace(/ city$/, '')
    .replace(/[^a-z0-9]/g, '');
const cities = {};
for (const province of addresses.provinces) {
  for (const city of addresses.cities[province.code] || []) {
    const matches = rows.filter(
      (row) =>
        normalize(row[1]) === normalize(province.name) &&
        normalize(row[2]) === normalize(city.name),
    );
    const codes = [...new Set(matches.map((row) => row[3]))];
    if (codes.length === 1) cities[city.code] = codes[0];
  }
}
if (Object.keys(cities).length < 700)
  throw new Error('Too few exact matches; review source changes');
await writeFile(
  'data/addresses/postal-codes.json',
  JSON.stringify({ source, retrievedAt: new Date().toISOString(), cities }, null, 2) + '\n',
);
console.log(
  `Saved ${Object.keys(cities).length} exact city matches from ${rows.length} PHLPost entries.`,
);
