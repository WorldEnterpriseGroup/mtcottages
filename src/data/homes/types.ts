import type { ImageMetadata } from "astro";

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
 * page. Leave it out and add it to the decision list instead.
 */
export type FactStatus = "confirmed" | "listed" | "photographed" | "confirm";

export type HomePhoto = {
  src: ImageMetadata;
  /** Describes what the picture actually shows. */
  alt: string;
  caption: string;
  /** CSS object-position, e.g. "center 40%". */
  focal?: string;
};

export type HomeFact = { label: string; value: string; status: FactStatus };

export type HomeRoom = {
  /** Anchor id on the tour page, e.g. "kitchen". */
  slug: string;
  name: string;
  summary: string;
  photos: HomePhoto[];
  notes: { text: string; status: FactStatus }[];
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

export type NearbyKind = "health" | "grocery" | "food" | "park" | "school" | "transit" | "shopping" | "civic";

export type NearbyPlace = {
  name: string;
  kind: NearbyKind;
  /** One plain sentence; no unverified hours or prices. */
  note: string;
  /** Google Maps search text, e.g. "Jackson General Hospital Ripley WV". */
  mapsQuery: string;
};

export type HomeMicrosite = {
  /** Matches the cottage id in src/data/site.ts (e.g. "henrietta", "oak", "broad"). */
  id: string;
  /** URL segment under the town, e.g. "henrietta-cottage" → /ravenswood/henrietta-cottage/. */
  slug: string;
  name: string;
  town: { name: string; state: "WV" | "OH"; slug: string };
  tagline: string;
  summary: string;
  address: { streetAddress: string; locality: string; region: string; postalCode: string; lat: number; lng: number };
  bedrooms: number;
  bathrooms?: number;
  sleeps?: number;
  /** Only the already-published bedroom-count guide from src/data/site.ts. */
  priceGuide?: string;
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
};
