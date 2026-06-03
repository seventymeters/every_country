import test from 'node:test';
import assert from 'node:assert/strict';
import { makeComparator } from '../sort.js';

const rows = [
  { name: 'Brazil', capital: 'Brasília', region: 'Americas', languages: ['Portuguese'] },
  { name: 'Canada', capital: 'Ottawa', region: 'Americas', languages: ['English', 'French'] },
  { name: "Côte d'Ivoire", capital: 'Yamoussoukro', region: 'Africa', languages: ['French'] },
  { name: 'cuba', capital: 'Havana', region: 'Americas', languages: ['Spanish'] },
  { name: 'Chad', capital: '', region: 'Africa', languages: ['Arabic', 'French'] },
];

test('sorts by name ascending: accent- and case-insensitive', () => {
  const got = [...rows].sort(makeComparator('name', 'asc')).map((r) => r.name);
  assert.deepEqual(got, ['Brazil', 'Canada', 'Chad', "Côte d'Ivoire", 'cuba']);
});

test('descending reverses ascending order', () => {
  const asc = [...rows].sort(makeComparator('name', 'asc')).map((r) => r.name);
  const desc = [...rows].sort(makeComparator('name', 'desc')).map((r) => r.name);
  assert.deepEqual(desc, [...asc].reverse());
});

test('empty values group first when ascending', () => {
  const got = [...rows].sort(makeComparator('capital', 'asc')).map((r) => r.capital);
  assert.equal(got[0], '');
});

test('languages sort by comma-joined string', () => {
  const got = [...rows].sort(makeComparator('languages', 'asc')).map((r) => r.languages.join(', '));
  assert.deepEqual(got, ['Arabic, French', 'English, French', 'French', 'Portuguese', 'Spanish']);
});

test('missing field is treated as empty string (no throw)', () => {
  const withMissing = [{ name: 'X' }, { name: 'A', capital: 'Z' }];
  const got = [...withMissing].sort(makeComparator('capital', 'asc')).map((r) => r.name);
  assert.deepEqual(got, ['X', 'A']);
});
