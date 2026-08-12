# Astro v7 migration

The production site is being rebuilt as a static Astro v7 editorial site.

- Toolchain: Astro `7.2.1`, TypeScript `7.0.2`, Vite 8, Node 22+.
- `@astrojs/check` is intentionally not installed: its latest release still declares a TypeScript 5/6 peer range. The build gate is `astro sync && tsc --noEmit`, followed by `astro build`.
- `build.format: "preserve"` retains the existing `.html` and nested `index.html` URLs.
- Raw SharePoint downloads, house maps, source manifests, and address-level inventory stay outside the Astro build.
- Only curated public derivatives are imported into `src/assets/media`; Astro generates responsive WebP variants during build.
- Wardah is the photo reviewer. The current lead-image decisions are explicit in `src/data/media.ts` and should be revised from her review before finalizing the visual direction.
