import { makeComparator } from './sort.js';

const state = { rows: [], sortKey: 'name', sortDir: 'asc' };

function td(text) {
  const el = document.createElement('td');
  el.textContent = text;
  return el;
}

function rowToTr(c) {
  const tr = document.createElement('tr');

  const flagTd = document.createElement('td');
  flagTd.className = 'flag-cell';

  const img = document.createElement('img');
  img.src = `flags/${c.code}.svg`;
  img.alt = c.name;
  img.className = 'flag';
  img.loading = 'lazy';

  // Enlarged copy shown centered on screen while hovering this cell (CSS-driven).
  const preview = document.createElement('img');
  preview.src = `flags/${c.code}.svg`;
  preview.alt = '';
  preview.className = 'flag-preview';
  preview.setAttribute('aria-hidden', 'true');

  flagTd.append(img, preview);

  tr.append(
    flagTd,
    td(c.name),
    td(c.capital ?? ''),
    td(c.region ?? ''),
    td((c.languages ?? []).join(', ')),
  );
  return tr;
}

function render() {
  const tbody = document.querySelector('#country-table tbody');
  tbody.replaceChildren(...state.rows.map(rowToTr));
}

function updateArrows() {
  document.querySelectorAll('th[data-key]').forEach((th) => {
    const arrow = th.querySelector('.arrow');
    arrow.textContent =
      th.dataset.key === state.sortKey ? (state.sortDir === 'asc' ? '▲' : '▼') : '';
  });
}

function sortAndRender() {
  state.rows.sort(makeComparator(state.sortKey, state.sortDir));
  render();
  updateArrows();
}

function wireHeaders() {
  document.querySelectorAll('th[data-key]').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.key;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortKey = key;
        state.sortDir = 'asc';
      }
      sortAndRender();
    });
  });
}

function showError() {
  const tbody = document.querySelector('#country-table tbody');
  const tr = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = 5;
  cell.className = 'error';
  cell.textContent = "Couldn't load country data.";
  tr.append(cell);
  tbody.replaceChildren(tr);
}

async function init() {
  try {
    const res = await fetch('./countries.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.rows = await res.json();
  } catch {
    showError();
    return;
  }
  document.querySelector('#count').textContent = `${state.rows.length} countries`;
  wireHeaders();
  sortAndRender();
}

init();
