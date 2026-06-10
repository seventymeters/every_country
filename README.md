# every_country

Easy country info for memorization, flash cards, and quick lookup.

Live site: [https://seventymeters.github.io/every_country/](https://seventymeters.github.io/every_country/)

`every_country` is a tiny static study tool with flags, countries, capitals,
regions, and spoken languages. Sort the table, search by any field, and use the
mobile-friendly card layout when you want to review countries away from a desk.

## Run locally

ES modules need to be served over HTTP rather than opened as a `file://` path:

```bash
npm start
# then open http://localhost:8000/
```

## Test

```bash
npm test
```

This runs data-integrity checks plus unit tests for sorting and search.

## Refresh data

Country data and flag SVGs are committed to the repo. They are generated from
[REST Countries](https://restcountries.com) and [flagcdn](https://flagcdn.com).

To refresh the dataset, use Node 20.11+ and internet access:

```bash
npm run build-data
```

This rewrites `countries.json` and adds any missing files to `flags/`.
