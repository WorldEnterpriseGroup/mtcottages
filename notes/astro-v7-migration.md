# Astro v7 migration

The production site is rebuilt as a static Astro v7 site while preserving the previous HotelHub theme.

- Toolchain: Astro `7.2.1`, TypeScript `7.0.2`, Vite 8, Node 22+.
- `@astrojs/check` is intentionally not installed: its latest release still declares a TypeScript 5/6 peer range. The build gate is `astro sync && tsc --noEmit`, followed by `astro build`.
- `build.format: "preserve"` retains the existing `.html` and nested `index.html` URLs.
- The original HotelHub pages under the repository root are synchronized into `src/pages` as Astro page sources by `scripts/sync-hotelhub-pages.mjs`. This keeps the prior markup, CSS hooks, route map, and approved photo assignments intact instead of introducing another visual redesign.
- `scripts/copy-hotelhub-assets.mjs` copies the existing public `assets`, `venobox`, and `font` bundles into `dist` after Astro builds the page sources.
- Raw SharePoint downloads, house maps, source manifests, and address-level inventory stay outside the Astro build.
- The prior HotelHub pages retain their curated public derivatives and exact image assignments. Raw SharePoint downloads and private inventory maps remain outside the Astro build.
- Wardah is the photo reviewer. The next release should be reviewed only after the previous visual system is re-established; her guidance remains authoritative for hero choices, room coverage, ordering, crops, and newer/final photos.
