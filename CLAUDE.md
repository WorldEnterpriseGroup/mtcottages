# Mt Cottages engineering notes

Mt Cottages is a guest-facing furnished-stay site for the Mid-Ohio Valley. The public site is a static Astro v7 publication with TypeScript 7, native HTML disclosures, a small custom CSS design system, and Astro’s responsive image pipeline.

## Architecture

- Public pages live in `src/pages`; preserve the existing `.html` URLs through `build.format: "preserve"`.
- Shared layout, navigation, photo, property-card, guide, gallery, and detail components live in `src/components` and `src/layouts`. The canonical inquiry form lives in `infra/azure/apply-proxy/index.html`.
- Curated public photos are imported from `assets/images/cottages/<house-id>` and are emitted through `astro:assets` as AVIF/WebP with JPG fallbacks, dimensions, `srcset`, and loading metadata.
- Keep production free of jQuery, Bootstrap, Modernizr, legacy sliders, old theme CSS, and unused copied runtime assets. Native HTML and CSS are the default.
- The `infra/azure/apply-proxy` application host is the only application surface. The marketing site emits no `/apply.html` route; keep the stay form’s fields aligned with the Logic App trigger.

## Privacy and photo curation

- Never publish private inventory details, credentials, or sensitive application data, or the address of a home that is not listed on the site. Owner decision (Oct 2026): a cottage's own street address may be published on its microsite. Exactly four home addresses are approved: Frederick Cottage, 125 Frederick St, Marietta OH 45750 (Arrival & map and the walking-directions origin); Henrietta Cottage, 200 Henrietta St, Ravenswood WV 26164; Oak Cottage, 2712 Broad St, Parkersburg WV 26101; and Broad Cottage, 3113 Broad St, Parkersburg WV 26104 (address card, directions, structured data). Every other house number stays banned, and CI enforces this.
- Use opaque house IDs in public paths. Exact property maps and SharePoint staging remain ignored/private.
- Prefer recent, final, visually reviewed portfolio photos. A property hero should be a clear front-of-house image when one is available; otherwise use the strongest honest room or outdoor image and leave the gap visible for Wardah’s review.
- Exclude maintenance, construction, plumbing, tools, uncertain, duplicate, and address-revealing frames.
- Do not invent or generate property *photography*: photos must come from the real portfolio; ask Wardah to steer substitutions. AI-generated 3D or inspirational concept images of rooms (top-down and 45-degree cutaways, requested from Wardah) are permitted, but every one must carry a visible "AI-generated concept" label and AI-generated alt text, and must never be presented as a photo.

## Checks

```bash
npm ci
npm run check
npm run build
python3 scripts/check-form-parity.py
BASE_URL=http://127.0.0.1:4174 npm --prefix e2e test
```

Before publishing, run `git diff --check`, validate the Azure JSON with `jq empty`, verify `CNAME`/`.nojekyll`, scan generated HTML for legacy runtime markers and private addresses, and confirm the GitHub Pages source is `gh-pages` at `/`.

## Deployment

Push the verified commit to `gh-pages`; GitHub Actions builds the static artifact, runs local Chromium checks, deploys GitHub Pages, and then runs the existing safe application-edge smoke suite. Never submit a valid application in tests. Do not enable Stripe or add sensitive identity/payment fields.
