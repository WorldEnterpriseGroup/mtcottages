# Mt Cottages project context

Mt Cottages is a guest-facing furnished-stay site for the Mid-Ohio Valley. SILK Homes is the separate staff-facing hospitality network; do not copy private staff or inventory information into public guest content.

## Public architecture

The public site is a static Astro v7 + TypeScript 7 publication on GitHub Pages. Native Astro components and `src/styles/site.css` define the visual system. Preserve the existing public `.html` URLs with `build.format: "preserve"`.

- Pages: `src/pages`
- Shared UI: `src/components`, `src/layouts`
- Curated photo imports: `assets/images/cottages/<house-id>`
- Optimized output: Astro `Picture` components emitting AVIF/WebP/JPG sources with dimensions, `srcset`, and loading metadata
- Canonical application: `https://stay.mtcottages.com/`, served by `infra/azure/apply-proxy` and backed by the existing Logic App; the marketing site emits no `/apply.html` route

Do not restore jQuery, Bootstrap, Modernizr, legacy sliders, old theme CSS, Venobox, or copied runtime assets. Native HTML/CSS and small progressive-enhancement scripts are preferred. Keep the complete application experience in `infra/azure/apply-proxy/index.html`; the marketing site must not grow a duplicate form.

## Photo and privacy rules

Use exact house directories and visually reviewed portfolio images. Prefer recent/final frames. Property heroes should be clear front-of-house photographs when available; otherwise use the strongest honest interior or outdoor frame and leave the substitution open for Wardah’s direction. Exclude construction, inspection, maintenance, plumbing, tools, duplicates, uncertain images, and frames that reveal addresses.

Owner decision (Oct 2026): a cottage's own street address may be published on its microsite. Exactly four home addresses are approved: Frederick Cottage, 125 Frederick St, Marietta OH 45750 (Arrival & map and the walking-directions origin); Henrietta Cottage, 200 Henrietta St, Ravenswood WV 26164; Oak Cottage, 2712 Broad St, Parkersburg WV 26101; and Broad Cottage, 3113 Broad St, Parkersburg WV 26104 (address card, directions, structured data). Every other house number stays banned, and CI enforces this. Never publish the addresses of unlisted homes, private inventory maps, SharePoint paths, credentials, or sensitive application data. Keep `homes.csv`, house maps, manifests, and staging downloads ignored. Do not add SSN, full DOB, card, or bank fields to the inquiry form. Do not enable Stripe.

## Verification and release

```bash
npm ci
npm run check
npm run build
python3 scripts/check-form-parity.py
BASE_URL=http://127.0.0.1:4174 npm --prefix e2e test
```

Before release, run `git diff --check`, `jq empty infra/azure/*.json`, scan generated HTML for private addresses and legacy runtime markers, verify CNAME/`.nojekyll`, and publish only from `gh-pages` after the browser suite passes. GitHub Actions builds and deploys the verified static artifact, then runs the safe application-edge smoke suite.

AI-generated 3D or inspirational concept images of rooms (top-down and 45-degree cutaways, requested from Wardah) are permitted, but every one must carry a visible "AI-generated concept" label and AI-generated alt text, and must never be presented as a photo.
