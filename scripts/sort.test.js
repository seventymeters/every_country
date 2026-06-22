import test from 'node:test';
import assert from 'node:assert/strict';
import { makeComparator } from '../sort.js';

const rows = [
  {
    name: 'Brazil',
    endonyms: ['Brasil'],
    capital: 'Brasília',
    region: 'Americas',
    population: 203080756,
    languages: ['Portuguese'],
  },
  {
    name: 'Canada',
    endonyms: ['Canada'],
    capital: 'Ottawa',
    region: 'Americas',
    population: 38005238,
    languages: ['English', 'French'],
  },
  {
    name: "Côte d'Ivoire",
    endonyms: ["Côte d'Ivoire"],
    capital: 'Yamoussoukro',
    region: 'Africa',
    population: 26378275,
    languages: ['French'],
  },
  {
    name: 'cuba',
    endonyms: ['Cuba'],
    capital: 'Havana',
    region: 'Americas',
    population: 11326616,
    languages: ['Spanish'],
  },
  {
    name: 'Chad',
    endonyms: ['Tchad', 'تشاد'],
    capital: '',
    region: 'Africa',
    population: 16425859,
    languages: ['Arabic', 'French'],
  },
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

test('population sorts numerically', () => {
  const got = [...rows].sort(makeComparator('population', 'asc')).map((r) => r.name);
  assert.deepEqual(got, ['cuba', 'Chad', "Côte d'Ivoire", 'Canada', 'Brazil']);
});

test('endonyms sort by comma-joined string', () => {
  const got = [...rows].sort(makeComparator('endonyms', 'asc')).map((r) => r.name);
  assert.deepEqual(got, ['Brazil', 'Canada', "Côte d'Ivoire", 'cuba', 'Chad']);
});

test('missing field is treated as empty string (no throw)', () => {
  const withMissing = [{ name: 'X' }, { name: 'A', capital: 'Z' }];
  const got = [...withMissing].sort(makeComparator('capital', 'asc')).map((r) => r.name);
  assert.deepEqual(got, ['X', 'A']);
});
