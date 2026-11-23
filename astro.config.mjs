import { defineConfig } from "astro/config";
import buildStamp from "./integrations/build-stamp.mjs";
import canonicalSitemap from "./integrations/canonical-sitemap.mjs";

// The 23 section pages of the old bespoke Broad Cottage site now land on the closest new page.
const broadBase = "/parkersburg/broad-cottage";
const broadSectionTargets = {
  gallery: "tour.html",
  "virtual-tour": "plan.html",
  "floor-plan": "plan.html",
  kitchen: "tour.html",
  "living-room": "tour.html",
  bedroom: "tour.html",
  bathroom: "tour.html",
  laundry: "tour.html",
  outdoors: "tour.html",
  amenities: "amenities.html",
  connectivity: "amenities.html",
  workspace: "amenities.html",
  accessibility: "amenities.html",
  parking: "amenities.html",
  policies: "amenities.html",
  neighborhood: "location.html",
  map: "location.html",
  healthcare: "location.html",
  dining: "location.html",
  recreation: "location.html",
  shopping: "location.html",
  transportation: "location.html",
  availability: "",
};
// Under build.format "preserve" a redirect from ".../<section>/index" is written to ".../<section>/index.html",
// which keeps the old directory URLs working. The old summary pages (/parkersburg/broad-cottage.html,
// oak-cottage.html, henrietta-cottage.html) are emitted by src/pages/[town]/[home].html.ts.
const redirects = {
  ...Object.fromEntries(
    Object.entries(broadSectionTargets).map(([section, target]) => [`${broadBase}/${section}/index`, `${broadBase}/${target}`]),
  ),
  // The keyword map (docs/marketing/keyword-universe.csv) names /<town>/furnished-rentals/;
  // the town guide is that page, so the path redirects there instead of competing with it.
  "/parkersburg/furnished-rentals/index": "/parkersburg/index.html",
  "/marietta/furnished-rentals/index": "/marietta/index.html",
  "/ravenswood/furnished-rentals/index": "/ravenswood/index.html",
};

export default defineConfig({
  site: "https://mtcottages.com",
  output: "static",
  compressHTML: true,
  // Outside node_modules so `npm ci` keeps it: CI caches this folder, and the
  // optimised images in it save re-encoding every photo on each build.
  cacheDir: "./.cache/astro",
  build: {
    format: "preserve",
    assets: "_astro"
  },
  redirects,
  image: {
    responsiveStyles: true,
    service: { entrypoint: "astro/assets/services/sharp" }
  },
  // sitemap.xml is written from the built pages: every indexable page whose
  // canonical points at itself (integrations/canonical-sitemap.mjs). Redirects,
  // noindex pages and parked homes drop out on their own.
  // build.json names the commit this build came from, for the post-deploy
  // live-build gate (integrations/build-stamp.mjs, scripts/check-live-build.py).
  integrations: [canonicalSitemap(), buildStamp()]
});
