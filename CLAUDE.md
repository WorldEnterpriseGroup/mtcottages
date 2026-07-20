# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For deep context (property map, photo rules, application architecture), see `@claude.md` and `@agents.md`.

## Project identity

**Mt Cottages** (mtcottages.com) is the guest-facing brand for furnished mid-term and long-term cottage rentals in the Mid-Ohio Valley (OH/WV). SILK Homes is the separate staff/community-facing brand for the same physical properties — their messaging must never be copied here.

## 🔴 CRITICAL: HotelHub theme is the ONLY allowed template system 🔴

**NEVER** use or reference these files — they belong to a banned alternate theme:
- `assets/css/mtcottages-site.css` ❌
- `assets/js/mtcottages-site.js` ❌

**NEVER** use these CSS classes or HTML patterns — they are from a banned alternate theme:
- `mt-site`, `mt-page-shell`, `mt-page-hero`, `mt-section`, `mt-grid`, `mt-card`
- `mt-check-list`, `mt-button`, `mt-actions`, `mt-split`, `mt-eyebrow`, `mt-breadcrumbs`
- `data-site-header`, `data-site-footer` (JS injection pattern)
- `mt-form-wrap`, `mt-content`, `mt-media-caption`, `mt-location-card`, `mt-section-sand`
- `mt-site-container`, `mt-card-link`, `mt-grid-3`
- Any CSS class prefixed with `mt-` that is not in the HotelHub CSS

**ALWAYS** use the HotelHub template patterns:
- CSS: `bootstrap.min.css`, `all.min.css`, `flaticon.css`, `theme-default.css`, `style.css`, `responsive.css`, `venobox.css`
- JS: `jquery-3.6.2.min.js`, `bootstrap.min.js`, `theme.js`, `swiper.min.js`, `venobox.js`, `mtcottages.js`
- Nav: `hotelhub_nav_manu` (desktop), `mobile-menu-area` (mobile) with `nav_scroll` class
- Sections: `rooms-section`, `service_inner_page`, `breatcome-section`, `faqs-section`
- Cards: `rooms-single-single-bx` pattern
- Buttons: `hotelhub-btn` class
- Modals: `loader-wrapper`, `search-popup`, scroll-to-top
- Gallery: venobox lightbox with `data-gall` attributes
- Page template structure: loader → desktop nav → mobile nav → breatcome hero → content sections → footer → search popup → scroll-to-top → JS includes

**Why this matters**: The HotelHub theme is a purchased template that provides the layout, interactivity (sliders, galleries, forms), and visual identity. Replacing it with any other CSS/JS system breaks the site. Only content, branding, navigation labels, and destination links should change — NEVER the template system itself.

**Verification**: Before committing, run `grep -rl "mtcottages-site\|data-site-header\|data-site-footer\|mt-page-shell\|mt-page-hero" *.html` and confirm it returns nothing. Run `ls assets/css/mtcottages-site.css assets/js/mtcottages-site.js 2>&1` and confirm both "No such file" errors.

## Working on gh-pages

Three branches are involved:

- **`main`** — original development branch. Do NOT work on `main`.
- **`demo`** (GitLab) — staging/testing area. Deployed for internal review.
- **`gh-pages`** (GitHub) — the published site via GitHub Pages. This is the branch we are currently on. All published changes land here.

There is no build step — the site is raw static HTML served by GitHub Pages.

## Critical rules

- **No street addresses in public HTML, CSS, JS, or image paths.** Use opaque house IDs (e.g., `parkersburg-01`).
- **Stripe is blocked.** The checked-in vault key is for an unrelated INSTAR Lab account with charges/payouts disabled. Do not create products, payment links, or process payments.
- **HotelHub theme must stay intact.** Keep the original HotelHub CSS, JS, layout, sliders, breadcrumbs, forms, loaders, and venobox assets. Change only content, branding, navigation labels, and destination links.
- **CNAME** must always be `mtcottages.com`. **.nojekyll** must always be present.
- **255 Court St (Grantsville, WV)** is internal-only and must not appear in any public page.
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

1. **Static checks:** `git diff --check`, `jq empty` on infra JSON, `py_compile` on Python, HTML validation (must link `style.css`, must not contain banned addresses), CNAME/.nojekyll verification, theme guard (`grep -q "mtcottages-site\|data-site-header\|data-site-footer\|mt-page-shell\|mt-page-hero" *.html` must return non-zero)
2. **E2E:** Playwright site tests against local HTTP server
3. **Live smoke** (gh-pages push only): against `stay.mtcottages.com`

## Code style

No formatter or linter is configured. The CI performs the only automated checks. Keep inline with existing code patterns.
