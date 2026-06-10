import test from 'node:test';
import assert from 'node:assert/strict';
import { filterRows, normalizeText, searchableText, withSearchText } from '../search.js';

const rows = [
  {
    name: 'Åland Islands',
    endonyms: ['Åland'],
    capital: 'Mariehamn',
    region: 'Europe',
    status: 'Territory / dependency',
    languages: ['Swedish'],
  },
  {
    name: 'Argentina',
    endonyms: ['Argentina'],
    capital: 'Buenos Aires',
    region: 'Americas',
    status: 'Sovereign state',
    languages: ['Guaraní', 'Spanish'],
  },
  {
    name: 'Brazil',
    endonyms: ['Brasil'],
    capital: 'Brasília',
    region: 'Americas',
    status: 'Sovereign state',
    languages: ['Portuguese'],
  },
  {
    name: 'Japan',
    endonyms: ['日本'],
    capital: 'Tokyo',
    region: 'Asia',
    status: 'Sovereign state',
    languages: ['Japanese'],
  },
].map(withSearchText);

test('normalizes case and accents', () => {
  assert.equal(normalizeText('Åland Guaraní Brasília'), 'aland guarani brasilia');
});

test('builds searchable text from country fields', () => {
  assert.equal(searchableText(rows[3]), 'japan 日本 tokyo asia sovereign state japanese');
});

test('filters by country, endonym, capital, region, status, and language', () => {
  assert.deepEqual(filterRows(rows, 'aland').map((row) => row.name), ['Åland Islands']);
  assert.deepEqual(filterRows(rows, 'brasil').map((row) => row.name), ['Brazil']);
  assert.deepEqual(filterRows(rows, 'brasilia').map((row) => row.name), ['Brazil']);
  assert.deepEqual(filterRows(rows, 'americas').map((row) => row.name), ['Argentina', 'Brazil']);
  assert.deepEqual(filterRows(rows, 'territory').map((row) => row.name), ['Åland Islands']);
  assert.deepEqual(filterRows(rows, 'guarani').map((row) => row.name), ['Argentina']);
});

test('empty query returns a shallow copy of all rows', () => {
  const got = filterRows(rows, '   ');
  assert.deepEqual(got, rows);
  assert.notEqual(got, rows);
});
