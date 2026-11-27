import type { ImageMetadata } from "astro";

/** A street address the owner approved for publication, with the home's own coordinates. */
export type StreetAddress = { kind: "street"; streetAddress: string; locality: string; region: string; postalCode: string; lat: number; lng: number };

/** Town-level location for a home whose street address is not approved. lat/lng are the town centre. */
export type TownArea = { kind: "town"; locality: string; region: string; lat: number; lng: number };

/**
 * Shared data contract for every Mt Cottages home microsite. One file per
 * home in src/data/homes/<id>.ts exports a HomeMicrosite; the shared route
 * and components render all of them the same way.
 *
 * Every fact carries a status so the page can say where it comes from:
 * - "confirmed": the owner confirmed it (e.g. the published street address)
 * - "listed": part of the home's published Mt Cottages listing
 * - "photographed": visible in the published photographs
 * - "confirm": not yet confirmed; the page shows "Confirm on inquiry"
 * Never put an unconfirmed price, square footage or availability date on a
 * page. Leave it out and add it to the decision list instead. Rates, deposit,
 * minimum stay, utilities, pets and availability live only in
 * src/data/terms.json (the "Rates & terms" block), never in `facts`.
 */
export type FactStatus = "confirmed" | "listed" | "photographed" | "confirm";

export type HomePhoto = {
  src: ImageMetadata;
  /** Describes what the picture actually shows. */
  alt: string;
  caption: string;
  /** CSS object-position, e.g. "center 40%". */
  focal?: string;
  /** Preserve the full frame when a fixed-ratio gallery crop would hide content. */
  fit?: "contain";
};

export type HomeFact = { label: string; value: string; status: FactStatus };

export type HomeRoom = {
  /** Anchor id on the tour page, e.g. "kitchen". */
  slug: string;
  name: string;
  summary: string;
  photos: HomePhoto[];
  notes: { text: string; status: FactStatus }[];
  /** Questions guests ask about this room, shown on the tour as native disclosures. */
  faqs?: HomeFaq[];
};

/** A question and answer; the status says where the answer comes from. */
export type HomeFaq = { q: string; a: string; status: FactStatus };

/**
 * One section of the resident guide page (utilities, handbook, arrival).
 * `id` becomes the anchor on guide.html, so legacy pages can point at it.
 */
export type GuideSection = {
  id: string;
  title: string;
  intro: string;
  items: { text: string; status: FactStatus }[];
  links?: { label: string; href: string }[];
};

export type PlanRoomKind =
  | "bedroom"
  | "bath"
  | "kitchen"
  | "living"
  | "dining"
  | "laundry"
  | "porch"
  | "hall"
  | "office"
  | "stairs"
  | "other";

/**
 * Concept layout rectangle in grid units (roughly feet, illustrative only).
 * Origin is the top-left (north-west) corner of the floor; rooms must not
 * overlap. The plan and 3D model are labelled as concepts, never as a
 * measured survey.
 */
export type PlanRoom = { id: string; label: string; kind: PlanRoomKind; x: number; y: number; w: number; h: number };

export type PlanFloor = { name: string; rooms: PlanRoom[] };

/** An AI-generated concept image. Always rendered with an "AI-generated concept" label. */
export type ConceptImage = { src: ImageMetadata; alt: string; caption: string };

export type NearbyKind = "health" | "grocery" | "food" | "park" | "trail" | "school" | "transit" | "shopping" | "civic" | "event";

export type NearbyPlace = {
  name: string;
  kind: NearbyKind;
  /** One plain sentence; no unverified hours or prices. */
  note: string;
  /** Google Maps search text, e.g. "Jackson General Hospital Ripley WV". */
  mapsQuery: string;
  /**
   * Where the place was checked: its OpenStreetMap element or its own website.
   * Anything closed or uncertain is left out rather than listed (#88).
   */
  source?: string;
  /** ISO date (YYYY-MM-DD) the place was checked against `source`. */
  checked?: string;
};

export type HomeMicrosite = {
  /** Matches the cottage id in src/data/site.ts (e.g. "henrietta", "oak", "broad"). */
  id: string;
  /** URL segment under the town, e.g. "henrietta-cottage" → /ravenswood/henrietta-cottage/. */
  slug: string;
  /** Older one-page URLs in the same town (no .html) that also redirect here, beyond `${slug}.html`. */
  legacySlugs?: string[];
  /**
   * Older pages inside this home's folder that moved, e.g. { rooms: "tour.html#bedrooms" }.
   * Each key is emitted as `<base><key>.html`, a redirect to the target (relative to the base).
   * A key must not be one of the template's own page names.
   */
  legacyPages?: Record<string, string>;
  name: string;
  town: { name: string; state: "WV" | "OH"; slug: string };
  tagline: string;
  summary: string;
  /**
   * "street" only for an owner-approved address (see CLAUDE.md). Every other
   * home is "town": the page names the town only, and lat/lng are the town
   * centre, never the house, so no street, house number or pin is published.
   */
  address: StreetAddress | TownArea;
  bedrooms: number;
  bathrooms?: number;
  sleeps?: number;
  hero: HomePhoto;
  /** Three short reasons to choose this home, each ideally with a photo. */
  highlights: { title: string; body: string; photo?: HomePhoto }[];
  facts: HomeFact[];
  rooms: HomeRoom[];
  amenities: { group: string; items: { name: string; status: FactStatus }[] }[];
  plan: { floors: PlanFloor[]; note: string };
  concepts: ConceptImage[];
  nearby: NearbyPlace[];
  /** Places a resident might drive from; the page links Google Maps directions from each to the home. */
  directionsFrom: { label: string; origin: string }[];
  /** Optional resident guide (utilities, handbook, arrival). When present, the home gets a guide.html page. */
  guide?: GuideSection[];
};
