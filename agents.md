# Agent handoff

## Mission

Maintain the public Mid-Ohio Valley Cottages website for furnished cottage rentals. The site serves guests looking for cottages in Marietta, Athens, Racine, and Grantsville, Ohio, and Parkersburg and Ravenswood, West Virginia.

## Business relationship

Mt Cottages serves guests, tenants, and renters. SILK Homes serves the hospitality staff and operators who care for the homes. Both programs cover the same physical properties, so their private inventory and photo-curation knowledge overlaps; keep their audiences, voice, and public claims distinct.

## Canonical internal property map

Source: private `/home/mrh/repos/silkcorp/overview/SILK Homes image curation.md`. Keep these addresses in agent context only unless the owner explicitly approves public-facing use.

| Town in source map | Count | Addresses |
| --- | ---: | --- |
| Ravenswood, WV | 5 | 200 Henrietta; 200 Gallatin; 216 Sand St; 107 Virginia; 313 Walnut |
| Parkersburg, WV | 4 | 3113 Broad St; 2405 45th St; 2712 Broad St; 900 32nd St |
| Marietta, OH | 1 | 125 Frederick St |
| Grantsville, WV* | 1 | 255 Court St |

Total: 11 canonical properties. The source map says Grantsville, WV, which conflicts with the earlier Mt Cottages context saying Ohio; verify before publishing. Athens and Racine have no canonical addresses in that source. `216 Sand St` is canonical but absent from the current photo CSV; `287 Ridgeway Ave` is present in the CSV but not canonical. Treat the latter as an unassigned reconciliation lead, not as part of the city counts.

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
