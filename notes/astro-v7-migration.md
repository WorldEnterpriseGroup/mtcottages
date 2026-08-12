# Astro v7 migration

The marketing site is now authored directly in `src/pages` and shared Astro components. Public `.html` URLs are preserved with Astro’s `build.format: "preserve"` setting. The old root HTML templates and HotelHub runtime are no longer part of the source or production artifact.

The build uses Astro 7.2.1 and TypeScript 7.0.2, with Astro `Picture` output for responsive AVIF/WebP/JPG images. The site is static and deploys through the existing GitHub Pages workflow from `gh-pages`.

The stay inquiry remains a separate Azure-backed application edge. `scripts/check-form-parity.py` compares the generated native `dist/apply.html` form against the proxy form.

Wardah’s Teams feedback remains the source of truth for property photography: lead with clear exterior/front-of-house imagery where available, keep the card order useful, show Quick Details and amenity coverage, and ask her to steer replacements for weak or ambiguous property heroes.
