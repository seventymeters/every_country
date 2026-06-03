# every_country — Design Spec

**Date:** 2026-06-02
**Status:** Approved (design phase)

## Summary

A single-page static web app that lists every country in a spreadsheet-like,
sortable table. Each row shows the country's flag, name, capital, region, and
spoken languages. The site is self-hostable for free on GitHub Pages with no
build step and no runtime API dependency.

## Goals

- Display all ~250 countries in one scrollable table.
- Columns: **Flag · Country · Capital · Region · Languages**.
- Click any column header (except Flag) to sort; click again to reverse.
- Load instantly and work offline / regardless of any external API uptime.
- Deploy by pushing files to a GitHub Pages branch — nothing to build at deploy time.

## Non-Goals (YAGNI)

- No text search box.
- No region/continent filter.
- No additional columns (population, area, currency, etc.).
- No framework, bundler, or transpiler.
- No pagination — all rows render at once and the page scrolls.
- No persistence of sort state between visits.

## Architecture

A pure static site. Four shipped assets plus one dev-only script:

```
every_country/
  index.html             # page skeleton + table shell
  style.css              # spreadsheet-style table styling
  app.js                 # fetch JSON, render rows, sorting
  countries.json         # generated data, committed to the repo
  scripts/build-data.js  # dev-only: regenerates countries.json
  scripts/sort.test.js   # unit test for the sort comparator
  README.md              # run locally + enable GitHub Pages
```

No build step is required to deploy. The site is the raw `index.html`,
`style.css`, `app.js`, and `countries.json`. GitHub Pages serves them directly.

## Data Generation

`scripts/build-data.js` is a one-off Node script (run by a developer, not at
deploy time):

1. Fetch the full dataset from the REST Countries API
   (`https://restcountries.com/v3.1/all` with a `fields` query limiting the
   payload to `name,capital,region,languages,flag,cca3`).
2. For each country, extract exactly:
   - `flag` — the emoji flag string (REST Countries `flag` field).
   - `name` — the common name (`name.common`).
   - `capital` — first capital in the `capital` array, or empty string if none.
   - `region` — the `region` field (e.g. "Europe", "Asia"), or empty string.
   - `languages` — the values of the `languages` object, sorted alphabetically
     and stored as an array of strings (e.g. `["French", "German", "Italian"]`).
3. Sort the array by `name` (locale-aware, ascending) for a stable committed file.
4. Write pretty-printed JSON to `countries.json` at the repo root.

`countries.json` shape:

```json
[
  {
    "flag": "🇨🇭",
    "name": "Switzerland",
    "capital": "Bern",
    "region": "Europe",
    "languages": ["French", "German", "Italian", "Romansh"]
  }
]
```

Re-running the script refreshes the committed data. The script is the only thing
that ever talks to the network, and it is never invoked by end users.

## Data Flow (runtime)

1. Browser loads `index.html`, which loads `style.css` and `app.js`.
2. `app.js` `fetch()`es `./countries.json` (same-origin, relative path so it
   works under a GitHub Pages subpath like `user.github.io/every_country/`).
3. On success: render every country as a table row; the languages array is
   joined with ", " for display. Apply the default sort (Country, ascending).
4. Header clicks re-sort the in-memory array and re-render the table body.

## Sorting Behavior

- Sortable columns: Country, Capital, Region, Languages. Flag is not sortable.
- First click on a header sorts ascending; clicking the same header again
  toggles to descending. Clicking a different header starts at ascending.
- The active column shows a direction arrow (▲ ascending / ▼ descending);
  inactive headers show no arrow.
- Default state on load: Country, ascending.
- Comparison is locale-aware via `Intl.Collator(undefined, { sensitivity: 'base', numeric: true })`
  so accented names (Åland, Côte d'Ivoire) and casing sort naturally.
- For the Languages column, rows are compared by their comma-joined display
  string.
- Empty values (e.g. a missing capital) sort as empty strings; they group
  together at the start of an ascending sort.

The comparator is implemented as a small pure function
`makeComparator(key, direction)` exported/available for unit testing,
independent of any DOM.

## Error Handling

- If the `countries.json` fetch fails or returns invalid JSON, `app.js` renders
  a single plain message in the table area: "Couldn't load country data." — not
  a blank page or an uncaught console error.
- If an individual country is missing an optional field (capital, region,
  languages), the cell renders empty rather than "undefined". The build script
  already normalizes missing values to empty string / empty array.

## Testing

- **Data integrity check** (`scripts/sort.test.js` or a sibling): after
  generation, assert `countries.json` parses, contains at least 240 entries,
  and every entry has non-empty `flag` and `name` and the `languages` field is
  an array.
- **Sort unit test**: exercise `makeComparator` on a small fixture array —
  verify ascending/descending order, locale-aware accent handling, and that
  empty values sort consistently.
- Tests run with Node's built-in test runner (`node --test`); no test framework
  dependency needed.
- **Manual smoke check**: open `index.html` via a local static server, confirm
  all rows render, each sortable header toggles direction, and the flag column
  is inert.

## Deployment (GitHub Pages)

1. Push the repo to GitHub.
2. In repo Settings → Pages, set the source to the `main` branch, root folder.
3. The site is served at `https://<user>.github.io/every_country/`.
4. Because all asset paths are relative, no base-path configuration is needed.

The README documents both running locally (any static file server, e.g.
`python3 -m http.server`) and the Pages setup above, plus how to regenerate data
with `node scripts/build-data.js`.

## Open Questions

None outstanding. Design approved by user on 2026-06-02.
