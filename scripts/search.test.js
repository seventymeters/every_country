import test from 'node:test';
import assert from 'node:assert/strict';
import { filterRows, normalizeText, searchableText, withSearchText } from '../search.js';

const rows = [
  { name: 'Åland Islands', capital: 'Mariehamn', region: 'Europe', languages: ['Swedish'] },
  { name: 'Argentina', capital: 'Buenos Aires', region: 'Americas', languages: ['Guaraní', 'Spanish'] },
  { name: 'Brazil', capital: 'Brasília', region: 'Americas', languages: ['Portuguese'] },
  { name: 'Japan', capital: 'Tokyo', region: 'Asia', languages: ['Japanese'] },
].map(withSearchText);

test('normalizes case and accents', () => {
  assert.equal(normalizeText('Åland Guaraní Brasília'), 'aland guarani brasilia');
});

test('builds searchable text from country fields', () => {
  assert.equal(searchableText(rows[3]), 'japan tokyo asia japanese');
});

test('filters by country, capital, region, and language', () => {
  assert.deepEqual(filterRows(rows, 'aland').map((row) => row.name), ['Åland Islands']);
  assert.deepEqual(filterRows(rows, 'brasilia').map((row) => row.name), ['Brazil']);
  assert.deepEqual(filterRows(rows, 'americas').map((row) => row.name), ['Argentina', 'Brazil']);
  assert.deepEqual(filterRows(rows, 'guarani').map((row) => row.name), ['Argentina']);
});

test('empty query returns a shallow copy of all rows', () => {
  const got = filterRows(rows, '   ');
  assert.deepEqual(got, rows);
  assert.notEqual(got, rows);
});
