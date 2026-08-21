# Mt Cottages theme selection

- Status: decision documented and implemented; the original theme-selection request is superseded by the custom Astro direction
- Date: 2026-08-21
- Scope: records the shortlist, recommendation, and implementation rationale for [GitHub issue #1](https://github.com/WorldEnterpriseGroup/mtcottages/issues/1)

## Decision

Continue with the existing custom, native Astro v7 direction. Do not adopt an Envato theme as the site foundation.

The current build is a static Astro 7.2.1 site using TypeScript 7, semantic HTML, native CSS, Astro’s responsive image pipeline, and preserved public `.html` URLs. That architecture fits Mt Cottages better than a hotel template: the site needs to present furnished, fiber-connected homes with a quiet, peaceful feel, help guests compare homes across communities, show real property photography, and route people into an inquiry rather than a nightly booking engine.

The Envato candidates remain useful visual references, not dependencies. Any useful pattern should be re-created in the existing Astro components and design tokens; do not bring over demo media, template JavaScript, PHP/AJAX booking assumptions, or legacy jQuery/Bootstrap runtime.

## Candidate set from issue #1

These are the seven candidate links attached to the issue:

| Candidate | Category | Useful signal |
| --- | --- | --- |
| [Albert — Hotel and Bed&Breakfast](https://elements.envato.com/albert-hotel-and-bed-breakfast-N3DECD) | Hotel / B&B | A polished hospitality baseline with booking and accommodation patterns. |
| [SkyLine — Hotel Booking HTML Template](https://elements.envato.com/skyline-hotel-booking-html-template-SN5YGHD) | Hotel / booking | Clear conversion, gallery, and reservation-oriented page cues. |
| [CountryHolidays — Country Hotel and Bed&Breakfast](https://elements.envato.com/countryholidays-country-hotel-and-bed-breakfast-QHKP6D) | Country hotel / B&B | Warm rural hospitality mood and a broad multi-page information architecture. |
| [Peaceful — Nature Cottage & Camping](https://elements.envato.com/peaceful-nature-cottage-camping-html-template-GHMAXUF) | Nature / cottage / camping | The closest visual reference for nature-led cottage storytelling. |
| [Alpine](https://elements.envato.com/alpine-ZXQJCBM) | Alpine / lodge atmosphere | A possible reference for restrained lodge color, type, and outdoor context; validate the live preview before using it as evidence. |
| [Bed&Breakfast — Single Page Template](https://elements.envato.com/bed-breakfast-single-page-template-C5SGMWS) | Single-property B&B | A focused one-page conversion model for a single home. |
| [Villoz — Villa & Holidays Rental](https://elements.envato.com/villoz-villa-holidays-rental-html-template-UGMSFLK) | Multi-property holiday rental | A useful comparison for home discovery and inner-page structure. |

## Shortlist

| Category / candidates | Fit for Mt Cottages | Tradeoff |
| --- | --- | --- |
| Nature and cottage atmosphere — **Peaceful**, with **Alpine** as a secondary mood reference | Supports image-led, place-based storytelling and a warmer cottage identity than a generic hotel shell. | Cottage/camping or alpine framing can imply resort or vacation use; it still needs multi-home, multi-community navigation and furnished-home content. |
| Hotel and B&B information architecture — **Albert**, **CountryHolidays**, and **SkyLine** | Offers familiar hospitality patterns for availability prompts, galleries, service explanations, and contact paths. | Booking-first layouts, sliders, maps, and plugin-era forms can make Mt Cottages feel like a nightly hotel and add runtime that the static site does not need. |
| Multi-property rental structure — **Villoz**, checked against the single-page **Bed&Breakfast** model | Closest match for presenting several homes while preserving a clear property detail path; the single-page option is a useful contrast for a one-home story. | Vacation-rental language and reservation/commerce assumptions need to become an inquiry-led furnished-home experience; the single-page model does not scale to the current portfolio. |

The shortlist is therefore a set of visual and information-architecture references, not a recommendation to purchase or copy any candidate.

## Why the custom Astro direction wins

- **Correct content model:** typed cottage data powers reusable property cards, facts, amenities, galleries, coverage notes, location guides, and comparison views instead of forcing every home into a generic hotel page.
- **Correct route model:** the build has a homepage, cottage directory, location pages, property pages, living/service guides, and utility pages while preserving the existing `.html` URL policy.
- **Correct performance and privacy boundary:** static rendering, native disclosures, and Astro image processing keep the public experience lightweight; the inquiry surface remains separate and the public form does not need private credentials or sensitive identity/payment fields.
- **Correct editorial fit:** real, curated property photographs can lead each page, with captions, focal points, responsive sizes, and different compositions for home, property, and location routes.
- **Lower long-term risk:** the team owns the CSS, content data, accessibility behavior, and route composition instead of inheriting a theme’s slider, booking, form, and third-party runtime assumptions.

## Customization work already completed

- **Brand and visual system:** `src/styles/site.css` defines the Mt Cottages canvas, paper, forest, clay, and sun tokens; serif display type; system body type; mono labels; fluid spacing; editorial grids; responsive breakpoints; focus treatment; reduced-motion handling; and print basics.
- **Mountain-retreat refinement:** the current pass carries forward the Hotel Hub mountain route’s moss, clay, charcoal, serif-led hospitality mood, dark contrast bands, offset compositions, and full-width visual pacing while keeping the implementation native Astro and free of the legacy vendor runtime.
- **Pricing direction:** listed homes now use a luxury-furnished bedroom rate ladder, with the verified three-bedroom guide at `$2,575/month`; the published floor is designed to remain above the HUD-based minimum requested for this portfolio and should be rechecked when HUD geography/year inputs change.
- **Pricing source of truth:** the public rate ladder in `src/data/site.ts` and the analysis inventory in `_data/houses.json` now agree by bedroom count; neither file should be treated as a property-specific lease quote until availability and bath details are confirmed.
- **Site chrome:** the logo, sticky header, desktop mega-navigation, mobile disclosure navigation, skip link, keyboard/Escape behavior, inquiry calls to action, and footer are implemented in `SiteHeader.astro`, `SiteFooter.astro`, and `SiteLayout.astro`.
- **Property discovery:** `PropertyCard.astro` and the cottage directory turn the portfolio into a scannable choice by community, bedroom count, price guide, and photo story; the former comparison table was removed as an unnecessary extra step.
- **Property storytelling:** `DetailsPanel.astro`, `PropertyGallery.astro`, `ResponsivePhoto.astro`, and the dynamic property route provide breadcrumb context, fact rails, amenities, responsive images, captions, coverage labels, and a direct inquiry path.
- **Location and audience paths:** `LocationPage.astro`, `GuidePage.astro`, and the location data support distinct community pages plus guides for living, family, healthcare, work, insurance, and related stay needs.
- **Native inquiry flow:** the form uses semantic fields, staged sections, property context, consent, a privacy notice, and a no-sensitive-data guardrail without importing a theme booking backend.
- **Astro implementation:** `astro.config.mjs` keeps static output, `build.format: "preserve"`, sitemap generation, and responsive image styles; the public marketing artifact remains native Astro/CSS rather than the previous theme runtime.

## Live visual references

Use these public pages as the current visual baseline when reviewing future design changes:

- [Homepage](https://mtcottages.com/) — split editorial hero, trust strip, stay-shape pathways, featured homes, comparison table, and the primary inquiry invitation.
- [Buck Cottage property page](https://mtcottages.com/parkersburg/buck-apartment-1.html) — breadcrumb and property hero, fact rail, details panel, amenities, staggered gallery, and home-specific inquiry CTA.
- [Parkersburg location page](https://mtcottages.com/parkersburg/index.html) — community guide, location narrative, relevant public homes, and a location-level next step.

These references use public town/property-page information only. Keep future design notes and public content free of street addresses, credentials, and sensitive application data.

## Follow-up guardrails

1. Extend the existing Astro data/components/CSS system before evaluating another theme.
2. Treat Envato pages as mood and layout references; do not copy their demo assets or runtime.
3. Recheck the three live reference routes at mobile and desktop widths after meaningful visual changes.
4. Keep the custom direction unless a new requirement materially changes the content model, route policy, rendering target, or inquiry workflow.
