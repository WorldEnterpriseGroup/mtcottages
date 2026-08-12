# Mt Cottages engineering notes

Mt Cottages is a guest-facing furnished-stay site for the Mid-Ohio Valley. The public site is a static Astro v7 publication with TypeScript 7, native HTML disclosures, a small custom CSS design system, and Astro’s responsive image pipeline.

## Architecture

- Public pages live in `src/pages`; preserve the existing `.html` URLs through `build.format: "preserve"`.
- Shared layout, navigation, photo, property-card, guide, gallery, detail, and inquiry-form components live in `src/components` and `src/layouts`.
- Curated public photos are imported from `assets/images/cottages/<house-id>` and are emitted through `astro:assets` as AVIF/WebP with JPG fallbacks, dimensions, `srcset`, and loading metadata.
- Keep production free of jQuery, Bootstrap, Modernizr, legacy sliders, old theme CSS, and unused copied runtime assets. Native HTML and CSS are the default.
- The `infra/azure/apply-proxy` application host is a separate operational surface. Keep its form field names, types, required flags, and select options in parity with `dist/apply.html`.

## Privacy and photo curation

- Never publish street addresses, private inventory details, credentials, or sensitive application data.
- Use opaque house IDs in public paths. Exact property maps and SharePoint staging remain ignored/private.
- Prefer recent, final, visually reviewed portfolio photos. A property hero should be a clear front-of-house image when one is available; otherwise use the strongest honest room or outdoor image and leave the gap visible for Wardah’s review.
- Exclude maintenance, construction, plumbing, tools, uncertain, duplicate, and address-revealing frames.
- Do not invent or generate property photography. Use the real portfolio and ask Wardah to steer substitutions.

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
