# Agent handoff

## Mission

Maintain the public Mid-Ohio Valley Cottages website for furnished cottage rentals. The site serves guests looking for cottages in Marietta, Athens, Racine, and Grantsville, Ohio, and Parkersburg and Ravenswood, West Virginia.

## Repository shape

This is a static HotelHub HTML5 template. There is no `package.json`, dependency installation, or compilation step. `index.html` is the default page and the other root-level HTML files are template pages/variants.

## Safe change checklist

1. Preserve the template’s relative asset paths.
2. Keep public-domain configuration in `CNAME` (`mtcottages.com`) and leave `.nojekyll` present.
3. Never commit Cloudflare, GitHub, Microsoft, email, booking, or other service credentials.
4. Preview with `python3 -m http.server 8000` and check the browser console for missing assets.
5. Before publishing, run `git diff --check` and confirm the GitHub Pages source is `gh-pages` / `/`.

## Hosting

The canonical repository is `WorldEnterpriseGroup/mtcottages` on GitHub. Production is served by GitHub Pages from `gh-pages` at `https://mtcottages.com`.
