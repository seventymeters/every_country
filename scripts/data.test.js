import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { comparableCountryName } from '../endonyms.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const countries = JSON.parse(readFileSync(path.join(ROOT, 'countries.json'), 'utf8'));

test('countries.json has at least 240 entries', () => {
  assert.ok(countries.length >= 240, `only ${countries.length} entries`);
});

test('every entry has required fields and a flag file', () => {
  for (const c of countries) {
    assert.ok(c.code && typeof c.code === 'string', `bad code: ${JSON.stringify(c)}`);
    assert.ok(c.name && typeof c.name === 'string', `bad name for ${c.code}`);
    assert.ok(Array.isArray(c.endonyms), `endonyms not array for ${c.code}`);
    const endonymKeys = c.endonyms.map(comparableCountryName);
    assert.ok(
      !endonymKeys.includes(comparableCountryName(c.name)),
      `duplicate English name in endonyms for ${c.code}`,
    );
    assert.equal(
      new Set(endonymKeys).size,
      endonymKeys.length,
      `duplicate endonyms for ${c.code}`,
    );
    assert.ok(c.status && typeof c.status === 'string', `bad status for ${c.code}`);
    assert.ok(Array.isArray(c.languages), `languages not array for ${c.code}`);
    assert.ok(
      existsSync(path.join(ROOT, 'flags', `${c.code}.svg`)),
      `missing flag for ${c.code}`,
    );
  }
});
