// Dev-only data generator. Run with: npm run build-data
// Fetches the REST Countries dataset once, writes countries.json,
// and downloads each flag SVG into flags/. Never run by end users.

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { cleanEndonyms } from '../endonyms.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const FLAGS_DIR = path.join(ROOT, 'flags');
const COUNTRIES_FILE = path.join(ROOT, 'countries.json');
const API =
  'https://restcountries.com/v3.1/all?fields=name,capital,region,languages,cca2,independent,unMember,status,population';
const SNAPSHOT_API =
  'https://gist.githubusercontent.com/ejirocodes/f682b045d23a42f14e232d72ba4ac5e3/raw/countries.json';

const STATUS_OVERRIDES = new Map([
  ['ck', 'Associated state'],
  ['nu', 'Associated state'],
  ['ps', 'Observer state'],
  ['tw', 'Disputed territory'],
  ['va', 'Observer state'],
  ['xk', 'Disputed territory'],
  ['eh', 'Disputed territory'],
]);

function classify(c) {
  const code = c.cca2.toLowerCase();
  if (STATUS_OVERRIDES.has(code)) return STATUS_OVERRIDES.get(code);
  if (c.independent) return 'Sovereign state';
  return 'Territory / dependency';
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

function sortedUnique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => collator.compare(a, b));
}

function parseCountryPayload(text) {
  try {
    return JSON.parse(text);
  } catch {
    // The fallback REST Countries v3.1 snapshot is a JavaScript object literal.
    return vm.runInNewContext(`(${text})`, Object.create(null), { timeout: 1000 });
  }
}

async function fetchSnapshotCountries() {
  const snapshotRes = await fetch(SNAPSHOT_API);
  if (!snapshotRes.ok) throw new Error(`REST Countries snapshot returned ${snapshotRes.status}`);
  const snapshotData = parseCountryPayload(await snapshotRes.text());
  if (!Array.isArray(snapshotData)) throw new Error('REST Countries snapshot returned a non-array payload');
  return snapshotData;
}

function normalize(raw) {
  return raw
    .filter((c) => c.cca2)
    .map((c) => ({
      code: c.cca2.toLowerCase(),
      name: c.name?.common ?? '',
      endonyms: cleanEndonyms(
        c.name?.nativeName
          ? sortedUnique(Object.values(c.name.nativeName).map((name) => name.common))
          : [],
        c.name?.common ?? '',
      ),
      capital: Array.isArray(c.capital) && c.capital.length ? c.capital[0] : '',
      region: c.region ?? '',
      status: classify(c),
      population: Number.isFinite(c.population) ? c.population : 0,
      languages: c.languages ? sortedUnique(Object.values(c.languages)) : [],
    }))
    .sort((a, b) => collator.compare(a.name, b.name));
}

function mergePopulation(rows, populationSource) {
  const populationByCode = new Map(
    populationSource.map((c) => [c.cca2?.toLowerCase(), Number.isFinite(c.population) ? c.population : 0]),
  );

  return rows
    .filter((c) => c.code)
    .map((c) => ({
      code: c.code,
      name: c.name,
      endonyms: cleanEndonyms(c.endonyms, c.name),
      capital: c.capital ?? '',
      region: c.region ?? '',
      status: c.status ?? '',
      population: populationByCode.get(c.code) ?? c.population ?? 0,
      languages: Array.isArray(c.languages) ? c.languages : [],
    }))
    .sort((a, b) => collator.compare(a.name, b.name));
}

async function fetchCountryRows() {
  const res = await fetch(API);
  if (!res.ok) throw new Error(`REST Countries API returned ${res.status}`);

  const liveData = parseCountryPayload(await res.text());
  if (Array.isArray(liveData)) return normalize(liveData);

  console.warn('WARN: REST Countries v3.1 returned a non-array payload; merging population from v3.1 snapshot fallback');
  const snapshotData = await fetchSnapshotCountries();
  if (existsSync(COUNTRIES_FILE)) {
    const currentRows = JSON.parse(await readFile(COUNTRIES_FILE, 'utf8'));
    return mergePopulation(currentRows, snapshotData);
  }

  return normalize(snapshotData);
}

// Ensure flags/<code>.svg exists, downloading it if needed.
// Returns true if the flag is present afterwards, false if it could not be obtained.
async function ensureFlag(code) {
  const dest = path.join(FLAGS_DIR, `${code}.svg`);
  if (existsSync(dest)) return true; // already have it; skip on re-run for speed
  const res = await fetch(`https://flagcdn.com/${code}.svg`);
  if (!res.ok) {
    console.warn(`WARN: flag download failed for ${code} (${res.status}); dropping country`);
    return false;
  }
  await writeFile(dest, await res.text());
  return true;
}

async function main() {
  const all = await fetchCountryRows();

  await mkdir(FLAGS_DIR, { recursive: true });
  // Only keep countries whose flag is available, so every committed entry has a flag.
  const kept = [];
  for (const c of all) {
    if (await ensureFlag(c.code)) kept.push(c);
  }

  await writeFile(
    COUNTRIES_FILE,
    JSON.stringify(kept, null, 2) + '\n',
  );

  const dropped = all.length - kept.length;
  console.log(
    `Wrote countries.json with ${kept.length} countries` +
      (dropped ? ` (dropped ${dropped} with no available flag).` : '.'),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
