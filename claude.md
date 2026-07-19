# Claude instructions

## Project context

This repository is the public website for furnished cottage rentals in the Mid-Ohio Valley. The service area includes Marietta, Athens, Racine, and Grantsville in Ohio, plus Parkersburg and Ravenswood in West Virginia.

## Mt Cottages and SILK Homes

Mt Cottages is the guest-facing operation for furnished homes, tenants, renters, and short- or mid-term stays. SILK Homes is the staff-facing hospitality network for the people who operate and care for those homes. They cover the same physical properties, so private inventory and photo-curation work may overlap, but SILK staff/community messaging should not be copied into Mt Cottages guest-facing copy without an explicit decision.

## Internal property map

The following is the current canonical property map from the private SILK Homes overview curation record (`/home/mrh/repos/silkcorp/overview/SILK Homes image curation.md`). It is internal operational context for future agents, not approved public website copy.

| Town in source map | Count | Street-level addresses |
| --- | ---: | --- |
| Ravenswood, WV | 5 | 200 Henrietta; 200 Gallatin; 216 Sand St; 107 Virginia; 313 Walnut |
| Parkersburg, WV | 4 | 3113 Broad St; 2405 45th St; 2712 Broad St; 900 32nd St |
| Marietta, OH | 1 | 125 Frederick St |
| Grantsville, WV* | 1 | 255 Court St |

Canonical total: 11 properties. The source record labels Grantsville as West Virginia, while earlier Mt Cottages context called it Ohio; verify the state before publishing public location copy. No canonical property addresses were found for Athens or Racine in the source record. `287 Ridgeway Ave` appears as a confirmed UnitedHome media folder in the private `homes.csv`, but not in the canonical property map, so do not include it in counts until reconciled. The CSV is a duplicate-prone photo inventory, not a property count.

## Working rules

- Treat the files in the repository root as a static HTML site.
- Keep `index.html` as the public entry point unless a deployment change is intentional.
- Preserve the existing relative paths under `assets/`, `fonts/`, `images/`, and `venobox/`.
- Do not add secrets, API tokens, credentials, or private tenant data to the repository.
- Keep `CNAME` set to `mtcottages.com` and retain `.nojekyll` for GitHub Pages static hosting.
- The current HotelHub template is intentionally stood up as-is; future content work should be explicit and should not silently rewrite every template page.

## Verification

Because there is no build system, preview changes with a local static server and check that `index.html` loads its CSS, JavaScript, fonts, and images. For deployment changes, confirm the GitHub Pages source remains `gh-pages` at `/` and that the custom domain remains configured.
