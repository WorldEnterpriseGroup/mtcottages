# Mt Cottages — HTML Theme Comparison

Candidate templates evaluated against the SILK Homes design pattern (HTML5/CSS3/Bootstrap 5, earthy warm palette, multi-page Home/Story/Locations/Crew structure) — GitHub issue: WorldEnterpriseGroup/mtcottages#1

## Comparison Table

| Template | Tech Stack | Structure | Booking System | Design Fit (cottage/earthy) | Customization Effort | Price | Fit Score |
|---|---|---|---|---|---|---|---|
| [Peaceful – Nature Cottage & Camping](https://elements.envato.com/peaceful-nature-cottage-camping-html-template-GHMAXUF) | Bootstrap 5.X, jQuery, FontAwesome, SwiperJS, W3C-validated | Home, About, Staff, Activities, **Cottages (+ detail pages)**, Pricing, FAQ, Gallery, Blog, Contact | Appointment/booking built-in | **Direct cottage/nature branding** — matches earthy warm concept closely | **Low** — page structure (Home/About/Cottages/Contact) already mirrors SILK Homes' Home/Story/Locations/Crew pattern | $16.50/mo (Envato Elements) | **9/10** |
| [Villoz – Villa & Holidays Rental](https://elements.envato.com/villoz-villa-holidays-rental-html-template-UGMSFLK) | Bootstrap 5, HTML5/CSS3, Owl Carousel, RTL | 4 home versions, 30+ inner pages, shop | Not explicitly listed (rental/booking oriented) | Modern villa/vacation-rental tone, decent but not rustic | Medium-High — 30+ pages and built-in shop are more than needed | $16.50/mo (Envato Elements) | 7/10 |
| [Albert – Hotel & B&B](https://elements.envato.com/albert-hotel-and-bed-breakfast-N3DECD) | HTML5/CSS3/JS, Bootstrap, Owl Carousel | 10 homepage variants + booking/contact/reviews | PHP/AJAX form w/ autoresponder | Generic hotel gloss, not rustic/cottage | Medium — too many homepage variants to prune | $16.50/mo (Envato Elements) | 6/10 |
| [CountryHolidays – Country Hotel & B&B](https://elements.envato.com/countryholidays-country-hotel-and-bed-breakfast-QHKP6D) | HTML5/CSS3/JS, Bootstrap, Slider Pro, Google Maps | 40+ pages, 3 homepage variants | PHP/AJAX booking + autoresponder | Rural/farm-hospitality tone — close, but oversized | High — 40+ pages is more than Mt Cottages needs; heavy pruning required | $16.50/mo (Envato Elements) | 6/10 |
| [SkyLine – Hotel Booking](https://elements.envato.com/skyline-hotel-booking-html-template-SN5YGHD) | HTML5/CSS3/LESS/SASS, Bootstrap, Revolution Slider | Homepage + reservation + gallery | Advanced booking/reservation form | City-hotel aesthetic — wrong tone for cottages | Medium-High — slider/mega-menu heavy, needs restyle | $16.50/mo (Envato Elements) | 5/10 |
| [Alpine – Hotel/B&B](https://elements.envato.com/alpine-ZXQJCBM) | HTML/CSS/JS (no framework listed) | Single-page, modular sections | Basic reservation elements + weather widget | Minimalist, could work but lacks multi-page location/story depth | Low for content, but one-page format doesn't support separate Locations/Story pages without rework | $16.50/mo (Envato Elements) | 5/10 |
| [Bed&Breakfast Single Page](https://elements.envato.com/bed-breakfast-single-page-template-C5SGMWS) | HTML5/CSS3/SASS/JS, Bootstrap 5, PHP forms | Single-page, 4 demo variations | Booking request form (SMTP/HTML email) | Clean/modern but single-page — no room for multi-property Locations section | Low content effort, but single-page format is a structural mismatch | $16.50/mo (Envato Elements) | 5/10 |
| **Peaceful — Nature Cottage & Camping (Best Fit)** | | | See recommendation below | | | | |

*Fit Score weighted toward: (1) structural match to SILK Homes' Home/Story/Locations/Crew pages, (2) rustic/cottage brand tone vs. generic hotel gloss, (3) low customization effort, (4) Bootstrap 5 compatibility for easier team maintenance.*

## Comparative Analysis

- **Structural fit:** Mt Cottages needs Home / Story / Locations (multiple cottage properties) / Crew-Contact. Most candidates are single hotel/B&B templates built around one property with a booking engine — **Peaceful** is the only one with a dedicated "Cottages" page pattern plus per-cottage detail pages, which maps almost 1:1 onto Mt Cottages' North Parkersburg property listings (45th St, Broad St, 32nd St).
- **Brand tone:** SILK Homes uses an earthy, warm palette (browns/tans/soft greens) for character/historic properties. Albert, SkyLine, and Villoz lean toward slick city-hotel or modern-villa styling that would need a heavier re-skin to feel "cottage." CountryHolidays and Peaceful already sit in the rural/nature register, requiring less visual rework.
- **Tech stack alignment:** SILK Homes runs Bootstrap 5 + Google Fonts. Peaceful, Villoz, and Bed&Breakfast Single Page are all Bootstrap 5; Albert, SkyLine, CountryHolidays, and Alpine use older/mixed stacks (plain JS, LESS/SASS mixes, unspecified frameworks) — more friction integrating with an existing Bootstrap 5 workflow.
- **Scope vs. bloat:** CountryHolidays (40+ pages) and Villoz (30+ pages + shop) are oversized for a small cottage-rental site — most of that content would be deleted, wasting the "time saved" a template is supposed to provide. Peaceful's page count (Home, About, Staff, Activities, Cottages, Pricing, FAQ, Gallery, Blog, Contact) is close to exactly what's needed with only minor trimming (e.g., drop Staff/Pricing if not needed).
- **Booking complexity:** Mt Cottages doesn't need a full hotel reservation engine (date-range pricing, room inventory) — a simple appointment/contact-style booking form is sufficient, which is what Peaceful ships. The heavier PHP/AJAX booking systems in Albert/CountryHolidays/SkyLine are solving a problem Mt Cottages likely doesn't have yet.
- **Cost:** All seven candidates are on the same Envato Elements subscription ($16.50/mo, unlimited downloads, lifetime commercial license), so price is not a differentiator here.

### Recommendation: Peaceful — Nature Cottage & Camping Template

**[elements.envato.com/peaceful-nature-cottage-camping-html-template-GHMAXUF](https://elements.envato.com/peaceful-nature-cottage-camping-html-template-GHMAXUF)**

Peaceful is the closest match on every axis that matters for Mt Cottages: it's built around "Cottages" as a first-class content type (with detail pages per property — a direct fit for the 45th St / Broad St / 32nd St listings), it's Bootstrap 5 like SILK Homes, and its nature/cottage visual register needs far less re-skinning to hit the earthy brown/tan/soft-green identity than the hotel-focused alternatives.

**Runner-up:** CountryHolidays is a reasonable second choice if more content pages (activities, extensive galleries) end up needed, but its 40+ page scope and older Slider Pro / non-Bootstrap-5 stack mean more pruning and integration work.

**Customization needed for Peaceful:**

- Re-theme colors from its default palette to SILK Homes' browns/tans/soft greens; swap fonts to Merriweather + Open Sans.
- Repurpose the "Cottages" listing/detail pages for the actual North Parkersburg properties (photos, addresses, descriptions).
- Rename/restructure nav to match Home / Story / Locations / Crew-Contact (map "About" → Story, "Cottages" → Locations, "Contact" → Crew/Contact).
- Trim or repurpose Staff and Pricing Plans sections if not applicable to Mt Cottages' operating model.
- Replace stock camping/nature imagery with actual property photography.

---
*Generated for GitHub issue WorldEnterpriseGroup/mtcottages#1*
