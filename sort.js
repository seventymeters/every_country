// Pure, DOM-free sort comparator shared by the browser (app.js) and Node tests.

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

function valueFor(row, key) {
  if (key === 'languages') return (row.languages ?? []).join(', ');
  return row[key] ?? '';
}

/**
 * Build a comparator for Array.prototype.sort.
 * @param {string} key - one of: name, capital, region, languages
 * @param {'asc'|'desc'} direction
 */
export function makeComparator(key, direction) {
  const factor = direction === 'desc' ? -1 : 1;
  return (a, b) => collator.compare(valueFor(a, key), valueFor(b, key)) * factor;
}
