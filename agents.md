# Agent handoff

## Mission

Maintain the public Mid-Ohio Valley Cottages website for furnished cottage rentals. The site serves guests looking for cottages in Marietta, Athens, and Racine, Ohio, and Parkersburg, Ravenswood, and Grantsville, West Virginia.

## Business relationship

Mt Cottages serves guests, tenants, and renters. SILK Homes serves the hospitality staff and operators who care for the homes. Both programs cover the same physical properties, so their private inventory and photo-curation knowledge overlaps; keep their audiences, voice, and public claims distinct.

## Canonical internal property map

Source: private `/home/mrh/repos/silkcorp/overview/SILK Homes image curation.md`. Keep these addresses in agent context only unless the owner explicitly approves public-facing use.

| Town in source map | Count | Addresses |
| --- | ---: | --- |
| Ravenswood, WV | 5 | 200 Henrietta; 200 Gallatin; 216 Sand St; 107 Virginia; 313 Walnut |
| Parkersburg, WV | 4 | 3113 Broad St; 2405 45th St; 2712 Broad St; 900 32nd St |
| Marietta, OH | 1 | 125 Frederick St |
| Grantsville, WV† | 1 | 255 Court St |

Total: 11 canonical properties. Grantsville is confirmed as West Virginia. `255 Court St` is internal-only for now and must not appear in public Mt Cottages listings or site copy. Athens and Racine have no canonical addresses in that source. `216 Sand St` is canonical but absent from the current photo CSV; `287 Ridgeway Ave` is present in the CSV but not canonical. Treat the latter as an unassigned reconciliation lead, not as part of the city counts.

## Repository shape

The marketing site is static HTML with no production build step. `index.html` is the default page. The public visual source is the exact HotelHub package from `~/Downloads/hotelhub-luxury-hotel-booking-html5-template-2026-04-28-16-29-32-utc.zip`; preserve its CSS, JavaScript, image directories, layout, and `venobox` assets. `apply.html` is the Mt Cottages application page styled with those same HotelHub assets. The `e2e` directory contains the pinned Playwright dependency and browser smoke tests used by CI/CD.

Every guest-facing page is built directly from the supplied HotelHub HTML templates and uses the original HotelHub CSS, JavaScript, image directories, loaders, sliders, breadcrumbs, forms, and `venobox` assets. Mt Cottages changes are limited to content, branding, navigation labels, and destination links inside those native HotelHub structures. Navigation is organized as `Cottages`, `Locations`, `Living`, `Services`, `About`, `Residents`, and `Contact`, with `Health Professionals`, `Family Stays`, and `Meal Preparation` as the shortened dropdown labels and `Stay with Us` as the themed header CTA. Resident support and partnership pages are kept separate from guest discovery.

The `infra/azure` directory contains the checked-in Logic App definition/parameters and Azure Function proxy source. Azure resource state, callback URLs, secrets, and connected-service credentials stay in Azure, not in Git.

## SharePoint photo isolation

The private, ignored `homes.csv` is the SharePoint inventory export copied from `/home/mrh/repos/silkcorp/overview`. It is used with the ignored `sharepoint-house-map.json` and the tracked [`scripts/import_sharepoint_photos.rb`](scripts/import_sharepoint_photos.rb).

Use this rule for every image:

```text
one canonical house → one stable house ID → one isolated public directory
```

Only use an exact source folder explicitly mapped to that house. Do not pull from mixed SILK galleries, broad archives, or filename assumptions. Do not reuse a source hash across houses. Downloaded images require visual review; keep construction/inspection/maintenance/duplicate/uncertain images out of the public site. The ignored manifest records provenance so another agent can audit where a public image came from. The exact map and street addresses remain private, and the current public site intentionally excludes the Grantsville property at 255 Court St.

## Safe change checklist

1. Preserve the template’s relative asset paths.
2. Keep public-domain configuration in `CNAME` (`mtcottages.com`) and leave `.nojekyll` present.
3. Never commit Cloudflare, GitHub, Microsoft, email, booking, or other service credentials.
4. Keep `homes.csv`, `sharepoint-house-map.json`, `sharepoint-photo-manifest.json`, and any SharePoint download staging directory ignored.
5. Preview with `python3 -m http.server 8000` and check the browser console for missing assets.
6. Before publishing, run `git diff --check`, validate `infra/azure/*.json`, confirm the public HTML has no excluded address, run `cd e2e && npm ci && npm test` against a local server, and confirm the GitHub Pages source is `gh-pages` / `/`.

## Hosting

The canonical repository is `WorldEnterpriseGroup/mtcottages` on GitHub. Production is served by GitHub Pages from `gh-pages` at `https://mtcottages.com`.

The HotelHub-themed application view is served at `https://stay.mtcottages.com/`; its form posts to `https://stay.mtcottages.com/api/apply` through the existing Azure Front Door profile `taodoor` and existing endpoint `taodoor`, using the `mtcottages-apply-route` route and `mtcottages-apply-origins` origin group, then the `mtcottages-apply-proxy` Function app and `mtcottages-intake` Logic App in resource group `mtcottages`. Browser visits to `https://apply.mtcottages.com/` redirect to `stay`; keep `/api/apply` available on the legacy host for compatibility. Do not bypass Front Door in public HTML. Stripe payments remain disabled until a verified Mt Cottages Stripe account and approved pricing are supplied.

The form fields are intentionally aligned with the Logic App request schema: contact details, move-in date, duration, occupants, community, home size, stay reason, pets, employment, budget, furnishing/accessibility needs, notes, screening acknowledgment, terms acknowledgment, source URL, page, and the bot honeypot. The Logic App uses the existing `dynamicscrmonline` connection against `dream.crm` and creates a standard D365 `leads` record with `companyname` set to `Mt Cottages`; the full JSON intake is retained in `description` so no submitted field is discarded.
