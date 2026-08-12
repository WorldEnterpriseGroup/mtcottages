# Agent handoff

Maintain the public Mt Cottages furnished-stay site. The site serves guests and residents; SILK Homes is a separate staff-facing program. Keep private inventory maps, exact addresses, SharePoint paths, credentials, and operational details out of public pages.

## Working rules

- The site is native Astro v7 + TypeScript 7. Use `src/pages`, shared Astro components, and `src/styles/site.css`; do not restore the previous theme runtime.
- Preserve the existing public `.html` URLs and the CNAME. Use root-relative links in the generated site.
- Use curated images from one exact house directory at a time. Prefer the best recent/final frames; visually review heroes and galleries before release.
- Keep construction, inspection, maintenance, plumbing, tool, duplicate, uncertain, and address-revealing photos out of guest-facing pages.
- The stay inquiry posts to `https://stay.mtcottages.com/api/apply`. Keep its public form fields aligned with `infra/azure/apply-proxy/index.html` and never add SSN, full DOB, card, or bank fields.
- Do not create payments or expose credentials.

## Release checks

```bash
npm run check
npm run build
python3 scripts/check-form-parity.py
BASE_URL=http://127.0.0.1:4174 npm --prefix e2e test
```

Scan generated HTML for private addresses and legacy runtime markers, run `git diff --check`, validate Azure JSON, and publish only from `gh-pages` after the browser suite passes.

Wardah is the primary photo decision-maker. After a release, show her the current property pages and ask her to confirm hero choices and provide any better recent/final exterior or room links.
