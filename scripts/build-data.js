// Dev-only data generator. Run with: npm run build-data
// Fetches the REST Countries dataset once, writes countries.json,
// and downloads each flag SVG into flags/. Never run by end users.

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const FLAGS_DIR = path.join(ROOT, 'flags');
const API =
  'https://restcountries.com/v3.1/all?fields=name,capital,region,languages,cca2,independent,unMember,status';

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

function normalize(raw) {
  return raw
    .filter((c) => c.cca2)
    .map((c) => ({
      code: c.cca2.toLowerCase(),
      name: c.name?.common ?? '',
      endonyms: c.name?.nativeName
        ? sortedUnique(Object.values(c.name.nativeName).map((name) => name.common))
        : [],
      capital: Array.isArray(c.capital) && c.capital.length ? c.capital[0] : '',
      region: c.region ?? '',
      status: classify(c),
      languages: c.languages ? sortedUnique(Object.values(c.languages)) : [],
    }))
    .sort((a, b) => collator.compare(a.name, b.name));
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
  const res = await fetch(API);
  if (!res.ok) throw new Error(`REST Countries API returned ${res.status}`);
  const all = normalize(await res.json());

  await mkdir(FLAGS_DIR, { recursive: true });
  // Only keep countries whose flag is available, so every committed entry has a flag.
  const kept = [];
  for (const c of all) {
    if (await ensureFlag(c.code)) kept.push(c);
  }

  await writeFile(
    path.join(ROOT, 'countries.json'),
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
