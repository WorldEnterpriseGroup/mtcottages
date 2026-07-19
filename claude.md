# Claude instructions

## Project context

This repository is the public website for furnished cottage rentals in the Mid-Ohio Valley. The service area includes Marietta, Athens, Racine, and Grantsville in Ohio, plus Parkersburg and Ravenswood in West Virginia.

## Working rules

- Treat the files in the repository root as a static HTML site.
- Keep `index.html` as the public entry point unless a deployment change is intentional.
- Preserve the existing relative paths under `assets/`, `fonts/`, `images/`, and `venobox/`.
- Do not add secrets, API tokens, credentials, or private tenant data to the repository.
- Keep `CNAME` set to `mtcottages.com` and retain `.nojekyll` for GitHub Pages static hosting.
- The current HotelHub template is intentionally stood up as-is; future content work should be explicit and should not silently rewrite every template page.

## Verification

Because there is no build system, preview changes with a local static server and check that `index.html` loads its CSS, JavaScript, fonts, and images. For deployment changes, confirm the GitHub Pages source remains `gh-pages` at `/` and that the custom domain remains configured.
