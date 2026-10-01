import { mkdir, writeFile, rename } from 'node:fs/promises';

// Run manually and review the diff before committing a new snapshot.
const base = 'https://psgc.gitlab.io/api/';
const [provinces, cities, barangays] = await Promise.all(
  ['provinces', 'cities-municipalities', 'barangays'].map(async (level) => {
    const response = await fetch(`${base}${level}/`, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Unable to download ${level}: ${response.status}`);
    const rows = await response.json();
    if (
      !Array.isArray(rows) ||
      !rows.every(
        (row) => /^\d{9}$/.test(row.code) && typeof row.name === 'string' && row.name.trim(),
      )
    )
      throw new Error(`Invalid ${level} dataset`);
    if (new Set(rows.map((row) => row.code)).size !== rows.length)
      throw new Error(`Duplicate ${level} codes`);
    return rows;
  }),
);
if (provinces.length < 80 || cities.length < 1600 || barangays.length < 42000)
  throw new Error('Incomplete snapshot; existing dataset was not changed.');
const simple = ({ code, name }) => ({ code, name });
const sort = (rows) => rows.sort((a, b) => a.name.localeCompare(b.name, 'en'));
const data = {
  source: base,
  retrievedAt: new Date().toISOString(),
  provinces: provinces.map(simple),
  cities: {},
  barangays: {},
};
data.provinces.push({ code: '130000000', name: 'Metro Manila (NCR)' });
const provinceCodes = new Set(data.provinces.map((row) => row.code));
for (const city of cities) {
  let parent = city.provinceCode;
  if (!parent) {
    parent = city.regionCode === '130000000' ? city.regionCode : city.code;
    if (!provinceCodes.has(parent)) {
      data.provinces.push({ code: parent, name: `${city.name} (independent city)` });
      provinceCodes.add(parent);
    }
  }
  if (!provinceCodes.has(parent)) throw new Error(`Orphan city ${city.code}`);
  (data.cities[parent] ||= []).push(simple(city));
}
const cityCodes = new Set(cities.map((row) => row.code));
for (const barangay of barangays) {
  const parent = barangay.cityCode || barangay.municipalityCode;
  if (!cityCodes.has(parent)) throw new Error(`Orphan barangay ${barangay.code}`);
  (data.barangays[parent] ||= []).push(simple(barangay));
}
if (cities.some((city) => !data.barangays[city.code]?.length))
  throw new Error('City without barangays');
sort(data.provinces);
Object.values(data.cities).forEach(sort);
Object.values(data.barangays).forEach(sort);
await mkdir('data/addresses', { recursive: true });
await writeFile('data/addresses/philippines.json.tmp', JSON.stringify(data) + '\n');
await rename('data/addresses/philippines.json.tmp', 'data/addresses/philippines.json');
console.log(
  `Saved ${provinces.length} provinces, ${cities.length} cities/municipalities and ${barangays.length} barangays.`,
);
