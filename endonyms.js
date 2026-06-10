export function comparableCountryName(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/\p{M}|\p{Cf}/gu, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();
}

export function cleanEndonyms(endonyms, exonym) {
  const exonymKey = comparableCountryName(exonym);
  const seen = new Set();

  return (endonyms ?? []).filter((endonym) => {
    const key = comparableCountryName(endonym);
    if (!key || key === exonymKey || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function displayEndonyms(endonyms, exonym) {
  return cleanEndonyms(endonyms, exonym)
    .map((endonym) => `${endonym} (${exonym})`)
    .join(', ');
}
