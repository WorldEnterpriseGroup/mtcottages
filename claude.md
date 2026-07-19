# Claude instructions

## Project context

This repository is the public website for furnished cottage rentals in the Mid-Ohio Valley. The service area includes Marietta, Athens, and Racine in Ohio, plus Parkersburg, Ravenswood, and Grantsville in West Virginia. Mt Cottages is positioned for furnished mid-term and long-term stays; guests apply directly and the team follows up with actual availability.

## Mt Cottages and SILK Homes

Mt Cottages is the guest-facing operation for furnished homes, tenants, renters, and short- or mid-term stays. SILK Homes is the staff-facing hospitality network for the people who operate and care for those homes. They cover the same physical properties, so private inventory and photo-curation work may overlap, but SILK staff/community messaging should not be copied into Mt Cottages guest-facing copy without an explicit decision.

## Internal property map

The following is the current canonical property map from the private SILK Homes overview curation record (`/home/mrh/repos/silkcorp/overview/SILK Homes image curation.md`). It is internal operational context for future agents, not approved public website copy.

| Town in source map | Count | Street-level addresses |
| --- | ---: | --- |
| Ravenswood, WV | 5 | 200 Henrietta; 200 Gallatin; 216 Sand St; 107 Virginia; 313 Walnut |
| Parkersburg, WV | 4 | 3113 Broad St; 2405 45th St; 2712 Broad St; 900 32nd St |
| Marietta, OH | 1 | 125 Frederick St |
| Grantsville, WV† | 1 | 255 Court St |

Canonical total: 11 properties. Grantsville is confirmed as West Virginia. `255 Court St` is retained for internal operations only and is intentionally excluded from the current Mt Cottages public listings and website copy. No canonical property addresses were found for Athens or Racine in the source record. `287 Ridgeway Ave` appears as a confirmed UnitedHome media folder in the private `homes.csv`, but not in the canonical property map, so do not include it in counts until reconciled. The CSV is a duplicate-prone photo inventory, not a property count.

## SharePoint photo rules

`/home/mrh/repos/silkcorp/overview/homes.csv` is the private SharePoint inventory export brought into this repository as ignored `homes.csv`. It is the starting point for locating media, not permission to publish every file it lists. Use the ignored `sharepoint-house-map.json` to resolve canonical properties to exact source folders.

- Every public property has its own stable house ID and directory under `assets/images/cottages/`.
- A source folder must be explicitly tied to that house; do not infer ownership from a filename, a general archive, or a neighboring property.
- Never reuse one source file or hash across two houses.
- Review each downloaded image visually before linking it in public HTML. Hold construction, inspection, maintenance, duplicate, sideways, or otherwise uncertain images out of the public directory.
- `255 Court St` remains internal-only and must not be published. `216 Sand St` remains a canonical property without an approved public photo until an exact source is found.
- Keep the exact address/source-folder map and the generated manifest ignored. Public paths must not contain street addresses.

The tracked importer is [`scripts/import_sharepoint_photos.rb`](scripts/import_sharepoint_photos.rb). It reads the ignored inventory/map, downloads only image extensions from exact folders, writes per-house directories, hashes downloads globally, and records source metadata in ignored `sharepoint-photo-manifest.json`. Importing is not the same as approving; visual curation is mandatory.

## Guest application architecture

The public form in `apply.html` posts to `https://apply.mtcottages.com/api/apply`. The endpoint is routed through Azure Front Door profile `taodoor`, endpoint `mtcottages-apply`, then the `mtcottages-apply-proxy` Function app, then the `mtcottages-intake` Logic App in the `mtcottages` resource group, which creates a Dynamics 365 lead through the existing shared `dynamicscrmonline` connection. Keep the callback URL only in the Azure app setting; never commit it.

The public form is intentionally limited to inquiry information. Do not add SSN, full DOB, payment-card, or bank fields. Screening, deposits, application/background-check fees, and monthly payments need separate approved secure steps.

Stripe is currently a blocked integration: the vault key checked against Stripe resolves to an unrelated INSTAR Lab account and that account is not enabled for charges or payouts. Do not create Mt Cottages products, payment links, or charges until the correct Mt Cottages Stripe account/key and fee schedule are confirmed.

## Working rules

- Treat the files in the repository root as a static HTML site.
- Keep `index.html` as the public entry point unless a deployment change is intentional.
- Preserve the existing relative paths under `assets/`, `fonts/`, `images/`, and `venobox/`.
- Do not add secrets, API tokens, credentials, or private tenant data to the repository.
- Keep `CNAME` set to `mtcottages.com` and retain `.nojekyll` for GitHub Pages static hosting.
- The public theme is the exact HotelHub package from `~/Downloads/hotelhub-luxury-hotel-booking-html5-template-2026-04-28-16-29-32-utc.zip`. Keep its original CSS, JavaScript, image directories, homepage layout, and `venobox` assets intact when making content changes. Do not replace it with a separate cottage-specific visual system.
- The primary public paths are `index.html`, `rooms.html`, `rooms-details.html`, `service.html`, `booking.html`, `apply.html`, `contact.html`, and `faq.html`. `apply.html` is the guest application and must use the HotelHub theme assets while posting through the existing Azure endpoint.
- Keep street-level addresses out of public HTML, CSS, JavaScript, image paths, and metadata unless the owner explicitly approves a specific listing.
- Keep SharePoint inventory exports, house maps, manifests, downloaded staging folders, and credentials out of Git.

## Verification

Because there is no build system, preview changes with a local static server and check that the HotelHub CSS, JavaScript, fonts, `venobox`, and image assets load on the primary pages. Run `git diff --check`, validate the Azure JSON with `jq empty`, and confirm the public HTML contains no excluded address before deployment. For deployment changes, confirm the GitHub Pages source remains `gh-pages` at `/`, the custom domain remains configured, and `http://` redirects to `https://`.
