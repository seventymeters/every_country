import { makeComparator } from './sort.js';
import { filterRows, withSearchText } from './search.js';
import { displayEndonyms } from './endonyms.js';

const state = { rows: [], visibleRows: [], sortKey: 'name', sortDir: 'asc', query: '' };
const numberFormatter = new Intl.NumberFormat(undefined);
const flagPreview = document.querySelector('#flag-preview');
const count = document.querySelector('#count');
const search = document.querySelector('#search');
const clearSearch = document.querySelector('#clear-search');

function td(text, label, className = '') {
  const el = document.createElement('td');
  el.dataset.label = label;
  if (className) el.className = className;
  el.textContent = text;
  return el;
}

function rowToTr(c) {
  const tr = document.createElement('tr');

  const flagTd = document.createElement('td');
  flagTd.className = 'flag-cell';
  flagTd.dataset.label = 'Flag';

  const img = document.createElement('img');
  img.src = `flags/${c.code}.svg`;
  img.alt = `${c.name} flag`;
  img.className = 'flag';
  img.loading = 'lazy';

  flagTd.addEventListener('mouseenter', () => showFlagPreview(img.src));
  flagTd.addEventListener('mouseleave', hideFlagPreview);

  flagTd.append(img);

  tr.append(
    flagTd,
    td(c.name, 'Country'),
    td(displayEndonyms(c.endonyms, c.name), 'Endonym'),
    td(c.capital ?? '', 'Capital'),
    td(c.region ?? '', 'Region'),
    td(c.status ?? '', 'Status', 'status-cell'),
    td(formatPopulation(c.population), 'Population', 'number-cell'),
    td((c.languages ?? []).join(', '), 'Languages'),
  );
  return tr;
}

function formatPopulation(population) {
  return Number.isFinite(population) && population >= 0 ? numberFormatter.format(population) : '';
}

function showFlagPreview(src) {
  flagPreview.src = src;
  flagPreview.classList.add('is-visible');
}

function hideFlagPreview() {
  flagPreview.classList.remove('is-visible');
  flagPreview.removeAttribute('src');
}

function render() {
  const tbody = document.querySelector('#country-table tbody');
  if (state.visibleRows.length === 0) {
    const tr = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 8;
    cell.className = 'empty';
    cell.textContent = 'No matching countries.';
    tr.append(cell);
    tbody.replaceChildren(tr);
    return;
  }
  tbody.replaceChildren(...state.visibleRows.map(rowToTr));
}

function updateCount() {
  count.textContent =
    state.visibleRows.length === state.rows.length
      ? `${state.rows.length} countries`
      : `${state.visibleRows.length} of ${state.rows.length} countries`;
}

function filteredRows() {
  return filterRows(state.rows, state.query);
}

function updateArrows() {
  document.querySelectorAll('th[data-key]').forEach((th) => {
    const arrow = th.querySelector('.arrow');
    const active = th.dataset.key === state.sortKey;
    arrow.textContent = active ? (state.sortDir === 'asc' ? '▲' : '▼') : '';
    th.setAttribute(
      'aria-sort',
      active ? (state.sortDir === 'asc' ? 'ascending' : 'descending') : 'none',
    );
  });
}

function sortAndRender() {
  state.visibleRows = filteredRows().sort(makeComparator(state.sortKey, state.sortDir));
  render();
  updateCount();
  updateArrows();
}

function wireHeaders() {
  document.querySelectorAll('th[data-key]').forEach((th) => {
    th.querySelector('.sort-button').addEventListener('click', () => {
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

function wireSearch() {
  search.addEventListener('input', () => {
    state.query = search.value;
    clearSearch.hidden = state.query.length === 0;
    sortAndRender();
  });

  clearSearch.addEventListener('click', () => {
    search.value = '';
    state.query = '';
    clearSearch.hidden = true;
    search.focus();
    sortAndRender();
  });
}

function showError() {
  const tbody = document.querySelector('#country-table tbody');
  const tr = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = 8;
  cell.className = 'error';
  cell.textContent = "Couldn't load country data.";
  tr.append(cell);
  tbody.replaceChildren(tr);
}

async function init() {
  try {
    const res = await fetch('./countries.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.rows = (await res.json()).map(withSearchText);
  } catch {
    showError();
    return;
  }
  wireHeaders();
  wireSearch();
  sortAndRender();
}

init();
