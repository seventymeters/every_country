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
