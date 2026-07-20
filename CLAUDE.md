# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For deep context (property map, photo rules, application architecture), see `@claude.md` and `@agents.md`.

## Project identity

**Mt Cottages** (mtcottages.com) is the guest-facing brand for furnished mid-term and long-term cottage rentals in the Mid-Ohio Valley (OH/WV). SILK Homes is the separate staff/community-facing brand for the same physical properties — their messaging must never be copied here.

## Working on gh-pages

All changes go directly to the `gh-pages` branch (the deploy branch). Do NOT work on `main`. There is no build step — the site is raw static HTML served by GitHub Pages.

## Critical rules

- **No street addresses in public HTML, CSS, JS, or image paths.** Use opaque house IDs (e.g., `parkersburg-01`).
- **Stripe is blocked.** The checked-in vault key is for an unrelated INSTAR Lab account with charges/payouts disabled. Do not create products, payment links, or process payments.
- **HotelHub theme must stay intact.** Keep the original HotelHub CSS, JS, layout, sliders, breadcrumbs, forms, loaders, and venobox assets. Change only content, branding, navigation labels, and destination links.
- **CNAME** must always be `mtcottages.com`. **.nojekyll** must always be present.
- **255 Court St (Grantsville) is WV, not OH.** The CI enforces that `Grantsville, OH` never appears in HTML. This property is intentionally excluded from public listings.
- **216 Sand St** has no approved public photos yet.
- **287 Ridgeway Ave** is NOT a canonical property — do not count it.
- **Live smoke tests** must never submit a valid application or create a D365 lead.
- **Application form** is intentionally limited to inquiry data. Do not add SSN, full DOB, card, or bank fields.
- **Photo privacy:** `homes.csv`, `sharepoint-house-map.json`, `sharepoint-photo-manifest.json` are git-ignored. Never commit them.
- **Azure credentials** live in Azure App Settings and API Connections, not in Git.

## Commands

| Action | Command |
|--------|---------|
| Local preview | `python3 -m http.server 8000` |
| Install Playwright | `cd e2e && npm ci && npx playwright install chromium` |
| Run all E2E tests | `cd e2e && npm test` |
| Run site tests only | `cd e2e && npx playwright test tests/site.spec.js` |
| Run live smoke tests | `cd e2e && BASE_URL=https://stay.mtcottages.com npm test` |
| Content rebuild | `python3 scripts/rebuild-hotelhub-pages.py` |
| Photo import | `ruby scripts/import_sharepoint_photos.rb` (requires `m365` CLI) |

## CI/CD

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) runs on push to `gh-pages` and pull requests:

1. **Static checks:** `git diff --check`, `jq empty` on infra JSON, `py_compile` on Python, HTML validation (must link `style.css`, must not contain banned addresses), CNAME/.nojekyll verification
2. **E2E:** Playwright site tests against local HTTP server
3. **Live smoke** (gh-pages push only): against `stay.mtcottages.com`

## Code style

No formatter or linter is configured. The CI performs the only automated checks. Keep inline with existing code patterns.
