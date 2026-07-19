# Mid-Ohio Valley Cottages

Static website for furnished cottages operated by Mid-Ohio Valley Cottages. The site is hosted from this repository with GitHub Pages and uses `mtcottages.com` as its public domain.

## Service area

Our furnished cottages are located across:

- Marietta, Ohio
- Athens, Ohio
- Racine, Ohio
- Parkersburg, West Virginia
- Ravenswood, West Virginia
- Grantsville, Ohio

## Current site

The current site is the HotelHub HTML5 template stood up as-is as the initial public presence. The template includes multiple page variants and supporting pages; `index.html` is the default GitHub Pages entry point.

## Local preview

This is a static HTML site with no package manager or build step. From the repository root, run:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deployment

- Repository: <https://github.com/WorldEnterpriseGroup/mtcottages>
- Production site: <https://mtcottages.com>
- Hosting: GitHub Pages from the `main` branch and repository root
- Custom-domain marker: [`CNAME`](CNAME)

Push changes to `main` to publish them through GitHub Pages. Keep the site static and preserve relative asset paths when editing the template.

## Future content

The next iteration can replace the template’s hotel copy with cottage listings, availability/contact flows, photography, amenities, and location-specific pages for each Mid-Ohio Valley community listed above.
