# Mt Cottages project context

Mt Cottages is a guest-facing furnished-stay site for the Mid-Ohio Valley. SILK Homes is the separate staff-facing hospitality network; do not copy private staff or inventory information into public guest content.

## Public architecture

The public site is a static Astro v7 + TypeScript 7 publication on GitHub Pages. Native Astro components and `src/styles/site.css` define the visual system. Preserve the existing public `.html` URLs with `build.format: "preserve"`.

- Pages: `src/pages`
- Shared UI: `src/components`, `src/layouts`
- Curated photo imports: `assets/images/cottages/<house-id>`
- Optimized output: Astro `Picture` components emitting AVIF/WebP/JPG sources with dimensions, `srcset`, and loading metadata
- Intake edge: `https://stay.mtcottages.com/api/apply`, backed by the existing Azure proxy and Logic App

Do not restore jQuery, Bootstrap, Modernizr, legacy sliders, old theme CSS, Venobox, or copied runtime assets. Native HTML/CSS and small progressive-enhancement scripts are preferred. The separate Azure application surface may retain its own operational implementation; keep its form fields in parity with `dist/apply.html`.

## Photo and privacy rules

Use exact house directories and visually reviewed portfolio images. Prefer recent/final frames. Property heroes should be clear front-of-house photographs when available; otherwise use the strongest honest interior or outdoor frame and leave the substitution open for Wardah’s direction. Exclude construction, inspection, maintenance, plumbing, tools, duplicates, uncertain images, and frames that reveal addresses.

Never publish exact street addresses, private inventory maps, SharePoint paths, credentials, or sensitive application data. Keep `homes.csv`, house maps, manifests, and staging downloads ignored. Do not add SSN, full DOB, card, or bank fields to the inquiry form. Do not enable Stripe.

## Verification and release

```bash
npm ci
npm run check
npm run build
python3 scripts/check-form-parity.py
BASE_URL=http://127.0.0.1:4174 npm --prefix e2e test
```

Before release, run `git diff --check`, `jq empty infra/azure/*.json`, scan generated HTML for private addresses and legacy runtime markers, verify CNAME/`.nojekyll`, and publish only from `gh-pages` after the browser suite passes. GitHub Actions builds and deploys the verified static artifact, then runs the safe application-edge smoke suite.
