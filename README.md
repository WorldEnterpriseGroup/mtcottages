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

`index.html` is the GitHub Pages entry point and uses the exact HotelHub theme package from `~/Downloads/hotelhub-luxury-hotel-booking-html5-template-2026-04-28-16-29-32-utc.zip`. The package’s original CSS, JavaScript, image directories, and `venobox` assets remain the visual foundation. `assets/css/mtcottages-site.css` and `assets/js/mtcottages-site.js` provide the Mt Cottages content layer and shared navigation without replacing the HotelHub package.

The public navigation is intentionally brand-first: `Cottages`, `Locations`, `Living`, `Services`, `About`, `Contact`, `Residents`, and the `Stay with Us` application CTA. The Cottages menu leads to `Find Your Place`, `Cozy Places`, `Room to Settle In`, and `Available Now`. The current guest-facing pages include `cottages.html`, `cozy-places.html`, `room-to-settle.html`, `available.html`, `locations.html`, `living.html`, `services.html`, `about.html`, `contact.html`, `faq.html`, and `apply.html`. Resident support is separated into `residents.html`, `resident-portal.html`, `pay-rent.html`, `maintenance.html`, and `emergency-maintenance.html`; partner programs are described in `partnerships.html`.

## SharePoint inventory and photo isolation

The private `homes.csv` export from the SILK Homes overview repository is the inventory source of truth for SharePoint photo locations. It is intentionally copied into this repository for local operations and ignored by Git. The private `sharepoint-house-map.json` maps each canonical property to a stable internal house ID and exact SharePoint folders; it is also ignored.

When photos are approved for the public site, they must remain isolated under one directory per house:

```text
assets/images/cottages/<house-id>/photo-01.jpg
assets/images/cottages/<house-id>/photo-02.jpg
```

Use [`scripts/import_sharepoint_photos.rb`](scripts/import_sharepoint_photos.rb) with the private map and CSV to download exact-source images. The importer records source metadata in the ignored `sharepoint-photo-manifest.json`, prevents a file hash from being reused across houses, and requires visual review before a photo is linked from public HTML. Do not use broad SILK archives, mixed galleries, or filename guesses for a house. A construction/inspection image is not a marketing approval. The Grantsville property is currently excluded from the public site, and the Ravenswood property without an exact public source has no approved public image yet.

Public image paths use house IDs rather than street addresses. This keeps the public site useful while keeping the exact address-to-folder map private.

## Application and payment architecture

The application flow is:

```text
GitHub Pages → apply.mtcottages.com → Azure Front Door (taodoor / mtcottages-apply endpoint)
             → Azure Function mtcottages-apply-proxy
             → Logic App mtcottages-intake → Dynamics 365 lead
```

The Logic App and proxy source/configuration are preserved under [`infra/azure`](infra/azure). The public form intentionally does not collect Social Security numbers, full birth dates, card data, or other highly sensitive identity information.

Stripe checkout is not activated yet. The currently available vault key resolves to an unrelated INSTAR Lab Stripe account with charges and payouts disabled, so it must not be used for Mt Cottages application fees, background checks, deposits, or rent. Connect the correct Mt Cottages Stripe account/key and approved fee schedule before creating payment links or accepting money.

## Local preview

This is a static HTML site with no package manager or build step. From the repository root, run:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deployment

- Repository: <https://github.com/WorldEnterpriseGroup/mtcottages>
- Production site: <https://mtcottages.com>
- Hosting: GitHub Pages from the `gh-pages` branch and repository root
- Custom-domain marker: [`CNAME`](CNAME)

Push site changes to `gh-pages` to publish them through GitHub Pages. Keep the site static and preserve relative asset paths when editing the template. Use `main` for source/development changes, then synchronize the published branch.

Cloudflare handles the `mtcottages.com` zone and redirects HTTP to HTTPS. The application subdomain is routed through the existing Azure Front Door profile `taodoor` and must stay behind Front Door for the API to function.
