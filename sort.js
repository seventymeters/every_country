// Pure, DOM-free sort comparator shared by the browser (app.js) and Node tests.

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

function valueFor(row, key) {
  if (key === 'population') return row.population ?? 0;
  if (key === 'endonyms') return (row.endonyms ?? []).join(', ');
  if (key === 'languages') return (row.languages ?? []).join(', ');
  return row[key] ?? '';
}

/**
 * Build a comparator for Array.prototype.sort.
 * @param {string} key - one of: name, endonyms, capital, region, status, population, languages
 * @param {'asc'|'desc'} direction
 */
export function makeComparator(key, direction) {
  const factor = direction === 'desc' ? -1 : 1;
  return (a, b) => {
    const aValue = valueFor(a, key);
    const bValue = valueFor(b, key);
    if (typeof aValue === 'number' && typeof bValue === 'number') return (aValue - bValue) * factor;
    return collator.compare(aValue, bValue) * factor;
  };
}
