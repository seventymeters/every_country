# every_country Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure static, single-page web app that lists every country in a sortable, spreadsheet-style table (flag, name, capital, region, languages), deployable for free on GitHub Pages with no build step.

**Architecture:** A dev-only Node script fetches the REST Countries dataset once and writes a committed `countries.json` plus bundled `flags/*.svg`. The shipped site is plain HTML/CSS/JS: `app.js` fetches the local JSON and renders rows; sorting lives in a pure, DOM-free `sort.js` module shared between the browser and the Node tests. No framework, no bundler, no runtime API calls.

**Tech Stack:** Vanilla HTML/CSS/ES modules in the browser; Node 20.11+ for the build script and `node --test` for tests; REST Countries API + flagcdn.com at build time only.

**Spec:** `docs/superpowers/specs/2026-06-02-every-country-design.md`

**Network note:** Task 3 (data generation) requires internet access to `restcountries.com` and `flagcdn.com`. If the executing environment is offline, that task is blocked — generate the data on a connected machine and commit it before proceeding.

**File structure (all paths relative to `every_country/`):**
- `package.json` — declares `"type": "module"`, the `test` script, and Node engine.
- `sort.js` — exports `makeComparator(key, direction)`; pure, no DOM. Shared by browser and tests.
- `app.js` — ES module: fetch `countries.json`, render table, wire header sorting. Imports `sort.js`.
- `index.html` — page skeleton and table shell with sortable headers.
- `style.css` — spreadsheet-style table styling.
- `countries.json` — generated, committed.
- `flags/` — generated SVG flags (`<code>.svg`), committed.
- `scripts/build-data.js` — dev-only generator for `countries.json` + `flags/`.
- `scripts/sort.test.js` — unit tests for `makeComparator`.
- `scripts/data.test.js` — integrity test for `countries.json` + `flags/`.
- `README.md` — local run + data regeneration + GitHub Pages setup.

---

## Chunk 1: Scaffolding & Sort Logic

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Verify: `.gitignore` (already created during brainstorming; should contain `.superpowers/`, `.DS_Store`, `node_modules/`)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "every-country",
  "version": "1.0.0",
  "description": "A sortable, spreadsheet-style table of every country.",
  "type": "module",
  "private": true,
  "scripts": {
    "build-data": "node scripts/build-data.js",
    "test": "node --test scripts/*.test.js"
  },
  "engines": {
    "node": ">=20.11"
  }
}
```

- [ ] **Step 2: Confirm `.gitignore` contents**

Run: `cat .gitignore`
Expected: includes `.superpowers/`, `.DS_Store`, `node_modules/`. If missing, add them.

- [ ] **Step 3: Commit**

```bash
git add package.json .gitignore
git commit -m "chore: project scaffolding"
```

### Task 2: Sort comparator (pure, TDD)

**Files:**
- Create: `sort.js`
- Test: `scripts/sort.test.js`

The comparator orders rows by a key (`name`, `capital`, `region`, `languages`), ascending or descending, using a locale-aware collator so accents and case sort naturally. For `languages`, rows compare by the comma-joined string. Missing values are treated as empty strings.

- [ ] **Step 1: Write the failing test**

Create `scripts/sort.test.js`:

```js
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
  // 'Arabic, French' < 'English, French' < 'French' < 'Portuguese' < 'Spanish'
  assert.deepEqual(got, ['Arabic, French', 'English, French', 'French', 'Portuguese', 'Spanish']);
});

test('missing field is treated as empty string (no throw)', () => {
  const withMissing = [{ name: 'X' }, { name: 'A', capital: 'Z' }];
  const got = [...withMissing].sort(makeComparator('capital', 'asc')).map((r) => r.name);
  assert.deepEqual(got, ['X', 'A']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/sort.test.js`
Expected: FAIL — cannot resolve `../sort.js` / `makeComparator is not a function`.

- [ ] **Step 3: Write minimal implementation**

Create `sort.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/sort.test.js`
Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add sort.js scripts/sort.test.js
git commit -m "feat: locale-aware sort comparator with tests"
```

---

## Chunk 2: Data Generation

### Task 3: Build script + data integrity test

**Files:**
- Create: `scripts/build-data.js`
- Create (generated, committed): `countries.json`, `flags/*.svg`
- Test: `scripts/data.test.js`

- [ ] **Step 1: Write the build script**

Create `scripts/build-data.js`:

```js
// Dev-only data generator. Run with: npm run build-data
// Fetches the REST Countries dataset once, writes countries.json,
// and downloads each flag SVG into flags/. Never run by end users.

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const FLAGS_DIR = path.join(ROOT, 'flags');
const API = 'https://restcountries.com/v3.1/all?fields=name,capital,region,languages,cca2';

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

function normalize(raw) {
  return raw
    .filter((c) => c.cca2)
    .map((c) => ({
      code: c.cca2.toLowerCase(),
      name: c.name?.common ?? '',
      capital: Array.isArray(c.capital) && c.capital.length ? c.capital[0] : '',
      region: c.region ?? '',
      languages: c.languages
        ? Object.values(c.languages).sort((a, b) => collator.compare(a, b))
        : [],
    }))
    .sort((a, b) => collator.compare(a.name, b.name));
}

// Ensure flags/<code>.svg exists, downloading it if needed.
// Returns true if the flag is present afterwards, false if it could not be obtained.
async function ensureFlag(code) {
  const dest = path.join(FLAGS_DIR, `${code}.svg`);
  if (existsSync(dest)) return true; // already have it; skip on re-run for speed
  const res = await fetch(`https://flagcdn.com/${code}.svg`);
  if (!res.ok) {
    console.warn(`WARN: flag download failed for ${code} (${res.status}); dropping country`);
    return false;
  }
  await writeFile(dest, await res.text());
  return true;
}

async function main() {
  const res = await fetch(API);
  if (!res.ok) throw new Error(`REST Countries API returned ${res.status}`);
  const all = normalize(await res.json());

  await mkdir(FLAGS_DIR, { recursive: true });
  // Only keep countries whose flag is available, so every committed entry has a flag.
  const kept = [];
  for (const c of all) {
    if (await ensureFlag(c.code)) kept.push(c);
  }

  await writeFile(
    path.join(ROOT, 'countries.json'),
    JSON.stringify(kept, null, 2) + '\n',
  );

  const dropped = all.length - kept.length;
  console.log(
    `Wrote countries.json with ${kept.length} countries` +
      (dropped ? ` (dropped ${dropped} with no available flag).` : '.'),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the build script** (requires network)

Run: `npm run build-data`
Expected: prints `Wrote countries.json with <N> countries.` where N ≥ 240 (a parenthetical "dropped X with no available flag" may appear if any flag failed). `countries.json` and `flags/*.svg` now exist, with one SVG per entry.

- [ ] **Step 3: Spot-check the output**

Run: `node -p "JSON.parse(require('node:fs').readFileSync('countries.json','utf8')).length"` will not work under `"type":"module"`; instead use the package script context. Run these shell checks:

```bash
head -c 300 countries.json   # shows the first object: code, name, capital, region, languages
ls flags | wc -l             # count of downloaded SVGs, should be ~240+
ls flags | head              # sample <code>.svg filenames
```

Expected: the JSON head shows an object with `code`, `name`, `capital`, `region`, `languages` (array); the flag count is ≥ 240.

- [ ] **Step 4: Write the data integrity test**

Create `scripts/data.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const countries = JSON.parse(readFileSync(path.join(ROOT, 'countries.json'), 'utf8'));

test('countries.json has at least 240 entries', () => {
  assert.ok(countries.length >= 240, `only ${countries.length} entries`);
});

test('every entry has required fields and a flag file', () => {
  for (const c of countries) {
    assert.ok(c.code && typeof c.code === 'string', `bad code: ${JSON.stringify(c)}`);
    assert.ok(c.name && typeof c.name === 'string', `bad name for ${c.code}`);
    assert.ok(Array.isArray(c.languages), `languages not array for ${c.code}`);
    assert.ok(
      existsSync(path.join(ROOT, 'flags', `${c.code}.svg`)),
      `missing flag for ${c.code}`,
    );
  }
});
```

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS — sort tests (5) and data tests (2) all pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/build-data.js scripts/data.test.js countries.json flags
git commit -m "feat: data generator + bundled flags + integrity test"
```

---

## Chunk 3: User Interface

### Task 4: HTML shell + styling

**Files:**
- Create: `index.html`
- Create: `style.css`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>every_country</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <main class="wrap">
      <header class="bar">
        <h1>🌍 every_country</h1>
        <span id="count" class="count"></span>
      </header>
      <table id="country-table">
        <thead>
          <tr>
            <th class="flag-col">Flag</th>
            <th data-key="name">Country <span class="arrow"></span></th>
            <th data-key="capital">Capital <span class="arrow"></span></th>
            <th data-key="region">Region <span class="arrow"></span></th>
            <th data-key="languages">Languages <span class="arrow"></span></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </main>
    <script type="module" src="app.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Create `style.css`**

```css
:root {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1f2933;
}

body {
  margin: 0;
  background: #eef1f4;
  padding: 24px;
}

.wrap {
  max-width: 1000px;
  margin: 0 auto;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.bar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(180deg, #1f2a37, #111827);
  color: #fff;
}

.bar h1 {
  margin: 0;
  font-size: 16px;
  letter-spacing: 0.3px;
}

.count {
  font-size: 12px;
  color: #9ca3af;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  padding: 9px 14px;
  text-align: left;
  border-bottom: 1px solid #eceef1;
}

thead th {
  background: #f8f9fa;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  position: sticky;
  top: 0;
}

thead th[data-key] {
  cursor: pointer;
  user-select: none;
}

thead th .arrow {
  color: #9ca3af;
  font-size: 11px;
  margin-left: 4px;
}

tbody tr:hover {
  background: #f3f8ff;
}

.flag-col {
  width: 48px;
}

td .flag {
  width: 28px;
  height: auto;
  display: block;
  border: 1px solid #e3e6ea;
}

td.error {
  text-align: center;
  color: #b42318;
  padding: 32px;
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html style.css
git commit -m "feat: page shell and spreadsheet styling"
```

### Task 5: App logic — fetch, render, sort

**Files:**
- Create: `app.js`

- [ ] **Step 1: Create `app.js`**

```js
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
  const img = document.createElement('img');
  img.src = `flags/${c.code}.svg`;
  img.alt = c.name;
  img.className = 'flag';
  img.loading = 'lazy';
  flagTd.append(img);

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
```

- [ ] **Step 2: Manual smoke test** (ES modules require a server, not `file://`)

Run: `python3 -m http.server 8000` then open `http://localhost:8000/` in a browser.
Verify:
- All countries render with visible SVG flags.
- Header shows `<N> countries`.
- Default sort is Country A→Z with a ▲ on the Country header.
- Clicking Country toggles ▲/▼ and reverses order; clicking Capital/Region/Languages re-sorts with ▲ and clears the Country arrow.
- The Flag header is not clickable (no arrow, no cursor change).
Stop the server with Ctrl+C when done.

- [ ] **Step 3: Verify the error path**

Temporarily rename the data file and reload to confirm the fallback message:
Run: `mv countries.json countries.json.bak` then reload `http://localhost:8000/`.
Expected: a single centered "Couldn't load country data." row, no console crash.
Restore: `mv countries.json.bak countries.json`.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: fetch, render, and header sorting"
```

---

## Chunk 4: Documentation

### Task 6: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

````markdown
# every_country

A static, single-page table of every country — flag, name, capital, region, and
spoken languages — with sortable columns. No framework, no build step.

## Run locally

ES modules need to be served over HTTP (not opened as a `file://` path):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Regenerate the data

Country data and flag SVGs are committed to the repo, generated from
[REST Countries](https://restcountries.com) and [flagcdn](https://flagcdn.com).
Re-run the generator (needs Node 20.11+ and internet) to refresh:

```bash
npm run build-data
```

This rewrites `countries.json` and adds any missing flags to `flags/`.

## Test

```bash
npm test
```

Runs the sort-comparator unit tests and the data-integrity checks.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In **Settings → Pages**, set the source to the `main` branch, root folder.
3. The site is served at `https://<user>.github.io/every_country/`.

All asset paths are relative, so no base-path configuration is needed.
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with local run, data regen, and Pages setup"
```

---

## Done

The site is complete: `npm test` passes, the page renders and sorts in the browser, and the repo is ready to push and enable on GitHub Pages.
