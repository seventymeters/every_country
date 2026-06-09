export function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
}

export function searchableText(row) {
  return normalizeText(
    [row.name, row.capital, row.region, ...(row.languages ?? [])].filter(Boolean).join(' '),
  );
}

export function withSearchText(row) {
  return {
    ...row,
    searchText: searchableText(row),
  };
}

export function filterRows(rows, query) {
  const normalizedQuery = normalizeText(query.trim());
  if (!normalizedQuery) return [...rows];

  return rows.filter((row) => (row.searchText ?? searchableText(row)).includes(normalizedQuery));
}
