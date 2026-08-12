# Mt Cottages

The guest-facing Mt Cottages site is a static Astro v7 publication for furnished stays across the Mid-Ohio Valley. It uses TypeScript 7, native HTML/CSS, and Astro’s responsive image pipeline. The public domain is `https://mtcottages.com`.

## What is in the current build

- Native Astro pages with the existing public `.html` URLs preserved.
- Responsive desktop mega-menu and mobile disclosure navigation with keyboard/Escape support.
- Shared property cards, Quick Details, amenity cards, room-by-room galleries, location guides, and a native stay inquiry form.
- Curated portfolio photography imported by opaque house ID and emitted as AVIF/WebP with JPG fallbacks, `srcset`, dimensions, and loading metadata.
- No jQuery, Bootstrap, Modernizr, legacy sliders, Venobox, or copied theme runtime in the marketing artifact.
- Existing Azure intake remains at `https://stay.mtcottages.com/api/apply`; the public form intentionally excludes SSN, full DOB, payment-card, and bank fields.

## Photo workflow

Use only exact house folders under `assets/images/cottages/`, review images visually, and prefer recent/final portfolio frames. Exclude construction, maintenance, plumbing, tool, duplicate, uncertain, and address-revealing images. Wardah is the primary photo decision-maker; release reviews should ask her to confirm each hero and supply better final/recent substitutes where the current portfolio is weak.

Private SharePoint staging, house maps, inventory exports, and manifests remain ignored. Exact street addresses must not appear in public content or filenames.

## Local development

```bash
npm ci
npm run check
npm run build
npm run preview
```

For browser validation, serve the built output and run Playwright:

```bash
python3 -m http.server 4174 --directory dist --bind 127.0.0.1
BASE_URL=http://127.0.0.1:4174 npm --prefix e2e test
```

The release checks also include:

```bash
python3 scripts/check-form-parity.py
git diff --check
```

## Deployment

Push a verified commit to `gh-pages`. GitHub Actions runs type-checking, the Astro build, privacy/runtime guards, form parity, local Chromium checks, GitHub Pages deployment, and the safe application-edge smoke suite. `CNAME` and `public/.nojekyll` keep the custom domain configured.
