# Mid-Ohio Valley Cottages

Guest-facing website for furnished cottages operated by Mt Cottages. The site is hosted from this repository with GitHub Pages and uses `mtcottages.com` as its public domain.

## Service area

Our furnished cottages are located across:

- Marietta, Ohio
- Athens, Ohio
- Racine, Ohio
- Parkersburg, West Virginia
- Ravenswood, West Virginia
- Grantsville, West Virginia

## Relationship to SILK Homes

Mt Cottages is the guest-facing rental operation for furnished homes, tenants, renters, and mid- or long-term guests. SILK Homes is the staff-facing hospitality network for the people who operate and care for those homes. The two programs overlap the same physical properties and may share private inventory and photo-curation knowledge, but their audiences, workflows, and public messaging are different.

## Public site

The guest-facing site is a static Astro v7 build that preserves the previous HotelHub theme. The tracked HotelHub HTML pages are synchronized into Astro's `src/pages` at build time, so the visual system, approved content, image assignments, and public `.html` URLs remain recognizable while Astro owns the production build and sitemap. The toolchain uses TypeScript 7; the first-pass editorial redesign was deliberately retired after review.

The public navigation is intentionally brand-first: `Cottages`, `Locations`, `Living`, `Services`, `About`, `Contact`, `Residents`, and the `Stay with Us` application CTA. The Cottages menu leads to `Find Your Place`, `Cozy Places`, `Room to Settle In`, and `Available Now`. Every Living and Services topic has a dedicated content page. Canonical town guides live at `marietta/index.html`, `parkersburg/index.html`, `ravenswood/index.html`, `grantsville/index.html`, and `racine/index.html`; individual homes live beneath their town directory using their public cottage name. The site is new, so obsolete flat property/location URLs are removed rather than retained as redirects. Resident support is separated into `residents.html`, `resident-portal.html`, `pay-rent.html`, `maintenance.html`, and `emergency-maintenance.html`; partner programs are described in `partnerships.html`.

The navigation is generated once for every public route by [`scripts/sync-hotelhub-pages.mjs`](scripts/sync-hotelhub-pages.mjs). Desktop uses native `<details>` disclosures for keyboard and pointer access, with one full-width panel open at a time. Mobile uses a compact menu button, nested native disclosures, an Escape-to-close path, focus return, scroll locking, and a no-JavaScript expanded fallback. [`assets/css/mtcottages-nav.css`](assets/css/mtcottages-nav.css) is a small progressive layer over the preserved HotelHub theme; [`assets/js/mtcottages-nav.js`](assets/js/mtcottages-nav.js) only manages state that native HTML cannot provide. Every route also receives a skip link to its primary content target.

## SharePoint inventory and photo isolation

The private `homes.csv` export from the SILK Homes overview repository is the inventory source of truth for SharePoint photo locations. It is intentionally copied into this repository for local operations and ignored by Git. The private `sharepoint-house-map.json` maps each canonical property to a stable internal house ID and exact SharePoint folders; it is also ignored.

When photos are approved for the public site, they must remain isolated under one directory per house:

```text
assets/images/cottages/<house-id>/photo-01.jpg
assets/images/cottages/<house-id>/photo-02.jpg
```

Use [`scripts/import_sharepoint_photos.rb`](scripts/import_sharepoint_photos.rb) with the private map and CSV to download exact-source images. The importer records source metadata in the ignored `sharepoint-photo-manifest.json`, prevents a file hash from being reused across houses, and requires visual review before a photo is linked from public HTML. Do not use broad SILK archives, mixed galleries, or filename guesses for a house. A construction/inspection image is not a marketing approval. The Grantsville property is currently excluded from the public site, and the Ravenswood property without an exact public source has no approved public image yet.

The restored HotelHub pages reference the existing curated public AVIF derivatives under
`assets/images/cottages`; raw SharePoint downloads and private house maps remain outside the
build. `scripts/copy-hotelhub-assets.mjs` carries the existing public theme assets into `dist`
after Astro generates the HTML so the repository does not maintain a second copy of the theme
bundle.

Rendered property photography is allocated once across the published site: banners, cards,
content photos, and footer galleries must not reuse the same visual source. Run
`python3 scripts/audit-photo-uniqueness.py --check` before publishing to catch repeated
sources, renamed pixel copies, rejected images, or missing rendered assets. The homepage
reserves five reviewed 1920×820 crops for its randomized hero rotation; those sources are
not available to any other page slot.

Public image paths use house IDs rather than street addresses. This keeps the public site useful while keeping the exact address-to-folder map private.

## Application and payment architecture

The application flow is:

```text
GitHub Pages → stay.mtcottages.com → Azure Front Door (existing taodoor endpoint)
             → Azure Function mtcottages-apply-proxy
             → Logic App mtcottages-intake → dream.crm Dynamics 365 Lead entity
```

The HotelHub-themed application view is served at [`stay.mtcottages.com`](https://stay.mtcottages.com/) and posts to `/api/apply`. The legacy [`apply.mtcottages.com`](https://apply.mtcottages.com/) host redirects browser visits to `stay`; its `/api/apply` path remains available for compatibility. The application host remains separate from the GitHub Pages marketing site so the public CTA can stay simple while the intake path remains behind the existing Azure routing.

The form collects contact details, preferred move-in date, intended duration, occupants, community, preferred home size, reason for staying, pets, employment or assignment context, budget, furnishing/accessibility needs, notes, and the required inquiry confirmation. It deliberately does not collect Social Security numbers, full birth dates, payment-card details, or bank information. The Logic App writes a Mt Cottages lead to the standard D365 `leads` entity, maps the key contact and location fields, and retains the complete submitted intake payload in the lead description.

The Logic App and proxy source/configuration are preserved under [`infra/azure`](infra/azure). The public form intentionally does not collect Social Security numbers, full birth dates, card data, or other highly sensitive identity information.

Stripe checkout is not activated yet. The currently available vault key resolves to an unrelated INSTAR Lab Stripe account with charges and payouts disabled, so it must not be used for Mt Cottages application fees, background checks, deposits, or rent. Connect the correct Mt Cottages Stripe account/key and approved fee schedule before creating payment links or accepting money.

## Local preview

The marketing site is built with Astro v7 while retaining the HotelHub visual layer. Browser tests live in [`e2e`](e2e) and use Playwright.
From the repository root, run:

```bash
npm ci
npm run check
npm run build
npm run preview
```

Then open <http://localhost:4321>.

To run the local browser checks:

```bash
cd e2e
npm ci
npx playwright install chromium
BASE_URL=http://127.0.0.1:4321 npm test
```

## Deployment

- Repository: <https://github.com/WorldEnterpriseGroup/mtcottages>
- Production site: <https://mtcottages.com>
- Hosting: GitHub Pages via the Actions `dist/` artifact from the `gh-pages` branch
- Custom-domain marker: [`CNAME`](CNAME)

Push site changes to `gh-pages` to publish them through GitHub Pages. The [`CI / GitHub Pages CD`](.github/workflows/ci-cd.yml) workflow runs the TypeScript 7 check, builds Astro, validates public boundaries, runs local Chromium E2E against `dist/`, deploys the verified artifact, and then runs the existing safe application-edge smoke suite. The live suite never submits a valid application. Preserve the existing `.html` routes when editing the Astro pages.

Cloudflare handles the `mtcottages.com` zone and redirects HTTP to HTTPS. Both `stay.mtcottages.com` and legacy `apply.mtcottages.com` use the existing `taodoor` Front Door endpoint and the `mtcottages-apply-origins` origin group; the temporary application endpoint has been retired. Keep the application subdomains behind Front Door for the API to function.
