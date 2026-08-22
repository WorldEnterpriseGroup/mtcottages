import type { ImageMetadata } from "astro";

import broadLiving from "../../assets/images/cottages/parkersburg-01/photo-44.avif";
import broadLivingAlt from "../../assets/images/cottages/parkersburg-01/photo-06.avif";
import broadBedroomAlt from "../../assets/images/cottages/parkersburg-01/photo-49.avif";
import broadBathroom from "../../assets/images/cottages/parkersburg-01/photo-20.avif";
import broadExtraShower from "../../assets/images/cottages/parkersburg-01/photo-42.avif";
import broadQueenBedroom from "../../assets/images/cottages/parkersburg-01/photo-45.avif";
import broadVanity from "../../assets/images/cottages/parkersburg-01/photo-12.avif";
import broadConceptTopDown from "../../assets/images/cottages/parkersburg-01/3d/broad-concept-top-down.png";
import broadConcept45 from "../../assets/images/cottages/parkersburg-01/3d/broad-concept-45-degree.png";

export type VerificationState =
  | "listed"
  | "owner-confirmed"
  | "photographically-verified"
  | "provider-api-verified"
  | "estimated"
  | "illustrative"
  | "pending-confirmation"
  | "not-available"
  | "not-applicable";

export type EvidenceSourceKind =
  | "current-listing"
  | "public-photo-set"
  | "illustrative-concept"
  | "owner-confirmation"
  | "field-measurement"
  | "provider-data"
  | "direct-inquiry"
  | "mixed"
  | "unknown";

export type EvidenceRole =
  | "property-owner"
  | "photo-curator"
  | "listing-editor"
  | "field-verifier"
  | "provider"
  | "operations"
  | "unknown";

export type EvidenceFreshnessState = "date-known" | "date-unknown" | "pending-review" | "not-applicable";

export type EvidenceProvenance = {
  sourceKind: EvidenceSourceKind;
  sourceKinds?: EvidenceSourceKind[];
  capturedAt?: string;
  verifiedAt?: string;
  verifierRole?: EvidenceRole;
  ownerRole?: EvidenceRole;
};

export type EvidenceFreshness = {
  state: EvidenceFreshnessState;
  reviewBy?: string;
  expiresAt?: string;
};

export type EvidenceUnit =
  | "count"
  | "square-feet"
  | "feet"
  | "inches"
  | "megabits-per-second"
  | "miles"
  | "minutes"
  | "dollars-per-month"
  | "unknown";

export type PropertyPhoto = {
  id: string;
  src: ImageMetadata;
  alt: string;
  caption: string;
  category: string;
  room?: string;
  status: Extract<VerificationState, "listed" | "photographically-verified" | "illustrative">;
  focal?: string;
  provenance?: EvidenceProvenance;
  freshness?: EvidenceFreshness;
};

export type VerifiedFact = {
  label: string;
  value: string;
  status: VerificationState;
  note?: string;
  provenance?: EvidenceProvenance;
  freshness?: EvidenceFreshness;
  units?: EvidenceUnit[];
};

export type InventoryItem = VerifiedFact & {
  quantity?: string;
};

export type InventoryGroup = {
  title: string;
  items: InventoryItem[];
};

export type Room = {
  slug: string;
  name: string;
  description: string;
  status: VerificationState;
  photoIds: string[];
  facts: VerifiedFact[];
  amenities: InventoryItem[];
};

export type MicrositeSection = {
  slug: string;
  label: string;
  title: string;
  description: string;
  status: "ready" | "pending";
  facts: VerifiedFact[];
  pendingNote?: string;
  provenance?: EvidenceProvenance;
  freshness?: EvidenceFreshness;
};

export type LongStaySignalKey =
  | "furnished-baseline"
  | "sleeping-arrangement"
  | "meal-preparation"
  | "laundry"
  | "internet"
  | "workspace"
  | "storage"
  | "parking-arrival"
  | "accessibility"
  | "daily-life-routes"
  | "pricing-and-availability";

export type LongStaySignalStatus = "supported" | "partial" | "pending-confirmation" | "unknown" | "not-applicable";

export type LongStayAudienceSignal = {
  key: LongStaySignalKey;
  status: LongStaySignalStatus;
  note: string;
  relatedSectionSlugs?: string[];
};

export type LongStayAudienceFit = {
  audience: "long-stay-resident";
  overall: Exclude<LongStaySignalStatus, "not-applicable">;
  signals: LongStayAudienceSignal[];
};

export type PhotoCoverageArea =
  | "living-room"
  | "bedroom"
  | "bathroom"
  | "shower"
  | "laundry"
  | "workspace"
  | "kitchen"
  | "exterior"
  | "entrance"
  | "porch"
  | "yard"
  | "driveway"
  | "parking"
  | "street-context"
  | "arrival-path"
  | "concept-study";

export type PhotoCoverageStatus = "covered" | "partial" | "not-covered" | "illustrative-only" | "unknown";

export type PhotoCoverage = {
  area: PhotoCoverageArea;
  status: PhotoCoverageStatus;
  photoIds: string[];
  note?: string;
};

export type CaptureBacklogKind = "ask" | "capture" | "measure" | "verify" | "source";
export type CaptureBacklogStatus = "pending" | "unknown" | "complete";
export type CaptureBacklogPriority = "high" | "medium" | "low";

export type CaptureBacklogItem = {
  id: string;
  kind: CaptureBacklogKind;
  priority: CaptureBacklogPriority;
  status: CaptureBacklogStatus;
  title: string;
  request: string;
  ownerRole: EvidenceRole;
  evidenceNeeded: EvidenceSourceKind[];
  units?: EvidenceUnit[];
  relatedSectionSlugs?: string[];
};

export type BroadCottageData = {
  id: string;
  name: string;
  city: string;
  state: string;
  location: string;
  canonicalPath: string;
  legacyPath: string;
  summary: string;
  description: string;
  monthlyGuide: string;
  bedrooms: number;
  bathrooms: number;
  furnished: VerifiedFact;
  photos: PropertyPhoto[];
  rooms: Room[];
  inventory: InventoryGroup[];
  sections: MicrositeSection[];
  verification: VerifiedFact[];
  illustrativeStudy: PropertyPhoto[];
  longStayAudienceFit: LongStayAudienceFit;
  photoCoverage: PhotoCoverage[];
  captureBacklog: CaptureBacklogItem[];
};

const provenance = (sourceKind: EvidenceSourceKind): EvidenceProvenance => ({
  sourceKind,
  verifierRole: "unknown",
  ownerRole: "unknown",
});

const freshness = (state: EvidenceFreshnessState): EvidenceFreshness => ({ state });

const sourceForPhotoStatus = (status: PropertyPhoto["status"]): EvidenceSourceKind => {
  if (status === "illustrative") return "illustrative-concept";
  if (status === "listed") return "current-listing";
  return "public-photo-set";
};

const photo = (
  id: string,
  src: ImageMetadata,
  alt: string,
  caption: string,
  category: string,
  room?: string,
  status: PropertyPhoto["status"] = "photographically-verified",
): PropertyPhoto => ({
  id,
  src,
  alt,
  caption,
  category,
  ...(room ? { room } : {}),
  status,
  provenance: provenance(sourceForPhotoStatus(status)),
  freshness: freshness(status === "illustrative" ? "not-applicable" : "date-unknown"),
});

const pending = (label: string, value: string, note?: string): VerifiedFact => ({
  label,
  value,
  status: "pending-confirmation",
  note,
  provenance: provenance("unknown"),
  freshness: freshness("pending-review"),
});

const listed = (label: string, value: string, note?: string): VerifiedFact => ({
  label,
  value,
  status: "listed",
  note,
  provenance: provenance("current-listing"),
  freshness: freshness("date-unknown"),
});

const photographed = (label: string, value: string, note?: string): VerifiedFact => ({
  label,
  value,
  status: "photographically-verified",
  note,
  provenance: provenance("public-photo-set"),
  freshness: freshness("date-unknown"),
});

const illustrative = (label: string, value: string, note?: string): VerifiedFact => ({
  label,
  value,
  status: "illustrative",
  note,
  provenance: provenance("illustrative-concept"),
  freshness: freshness("not-applicable"),
});

const withUnits = (fact: VerifiedFact, units: EvidenceUnit[]): VerifiedFact => ({ ...fact, units });

const withSectionEvidence = (section: MicrositeSection): MicrositeSection => {
  const sourceKinds = [...new Set(section.facts.map((fact) => fact.provenance?.sourceKind ?? "unknown"))];
  return {
    ...section,
    provenance: {
      sourceKind: sourceKinds.length === 1 ? sourceKinds[0] : "mixed",
      sourceKinds,
      verifierRole: "unknown",
      ownerRole: "unknown",
    },
    freshness: freshness(section.status === "pending" ? "pending-review" : "date-unknown"),
  };
};

export const broadCottageLongStayAudienceFit: LongStayAudienceFit = {
  audience: "long-stay-resident",
  overall: "partial",
  signals: [
    { key: "furnished-baseline", status: "supported", note: "Furnished status is part of the current listing.", relatedSectionSlugs: ["amenities"] },
    { key: "sleeping-arrangement", status: "supported", note: "One bedroom is published and a queen bed is shown in the current public bedroom photograph.", relatedSectionSlugs: ["bedroom"] },
    { key: "meal-preparation", status: "partial", note: "A full kitchen is listed; appliance, cookware, utensil, and dining inventory need confirmation.", relatedSectionSlugs: ["kitchen"] },
    { key: "laundry", status: "partial", note: "Washer and dryer are listed; configuration and supplies need confirmation.", relatedSectionSlugs: ["laundry"] },
    { key: "internet", status: "partial", note: "Fiber technology is listed; actual speed is not published.", relatedSectionSlugs: ["connectivity"] },
    { key: "workspace", status: "partial", note: "A chair or small work surface is visible, but dedicated workspace details and network performance need confirmation.", relatedSectionSlugs: ["workspace"] },
    { key: "storage", status: "pending-confirmation", note: "Closet, dresser, hangers, and drawer inventory need confirmation.", relatedSectionSlugs: ["bedroom"] },
    { key: "parking-arrival", status: "partial", note: "Off-street parking is listed; space, surface, route, and arrival details need confirmation.", relatedSectionSlugs: ["parking"] },
    { key: "accessibility", status: "pending-confirmation", note: "Parking-to-door path, steps, thresholds, door widths, clearances, and bathroom access are not measured.", relatedSectionSlugs: ["accessibility"] },
    { key: "daily-life-routes", status: "pending-confirmation", note: "Nearby places and practical routes are not published in the current record.", relatedSectionSlugs: ["neighborhood", "healthcare", "dining", "recreation", "shopping", "transportation"] },
    { key: "pricing-and-availability", status: "partial", note: "The monthly price is published as a guide; availability and final pricing require a direct inquiry.", relatedSectionSlugs: ["availability"] },
  ],
};

export const broadCottagePhotoCoverage: PhotoCoverage[] = [
  { area: "living-room", status: "covered", photoIds: ["living-room-hero", "living-room-window"] },
  { area: "bedroom", status: "covered", photoIds: ["bedroom-queen", "bedroom-bath-access"] },
  { area: "bathroom", status: "covered", photoIds: ["bathroom-tub", "bathroom-shower"] },
  { area: "shower", status: "covered", photoIds: ["bathroom-shower"] },
  { area: "laundry", status: "partial", photoIds: ["laundry-vanity"] },
  { area: "workspace", status: "partial", photoIds: ["bedroom-queen"] },
  { area: "kitchen", status: "not-covered", photoIds: [] },
  { area: "exterior", status: "not-covered", photoIds: [] },
  { area: "entrance", status: "not-covered", photoIds: [] },
  { area: "porch", status: "not-covered", photoIds: [] },
  { area: "yard", status: "not-covered", photoIds: [] },
  { area: "driveway", status: "not-covered", photoIds: [] },
  { area: "parking", status: "not-covered", photoIds: [] },
  { area: "street-context", status: "not-covered", photoIds: [] },
  { area: "arrival-path", status: "not-covered", photoIds: [] },
  { area: "concept-study", status: "illustrative-only", photoIds: ["concept-top-down", "concept-45-degree"] },
];

export const broadCottageCaptureBacklog: CaptureBacklogItem[] = [
  {
    id: "kitchen-inventory",
    kind: "capture",
    priority: "high",
    status: "pending",
    title: "Kitchen capture and counted inventory",
    request: "Capture the kitchen, then count appliances, cookware, utensils, dining items, and seating.",
    ownerRole: "unknown",
    evidenceNeeded: ["public-photo-set", "owner-confirmation"],
    relatedSectionSlugs: ["kitchen"],
  },
  {
    id: "exterior-arrival-photos",
    kind: "capture",
    priority: "high",
    status: "pending",
    title: "Exterior and arrival photo set",
    request: "Capture owner-approved front, entrance, porch, yard, driveway, parking, and street-context views.",
    ownerRole: "unknown",
    evidenceNeeded: ["public-photo-set", "owner-confirmation"],
    relatedSectionSlugs: ["outdoors", "parking"],
  },
  {
    id: "measured-plan",
    kind: "measure",
    priority: "high",
    status: "pending",
    title: "Measured plan",
    request: "Capture a measured plan with doors, windows, closets, appliances, fixtures, entrances, and parking relationship.",
    ownerRole: "unknown",
    evidenceNeeded: ["field-measurement"],
    units: ["unknown"],
    relatedSectionSlugs: ["floor-plan"],
  },
  {
    id: "accessibility-measurements",
    kind: "measure",
    priority: "high",
    status: "pending",
    title: "Access measurements and photographs",
    request: "Measure the parking-to-door path, steps, thresholds, door widths, clearances, and bathroom access.",
    ownerRole: "unknown",
    evidenceNeeded: ["field-measurement", "public-photo-set"],
    units: ["unknown"],
    relatedSectionSlugs: ["accessibility"],
  },
  {
    id: "connectivity-test",
    kind: "measure",
    priority: "medium",
    status: "pending",
    title: "Dated connectivity test",
    request: "Publish a dated wired and Wi-Fi test with method and location.",
    ownerRole: "unknown",
    evidenceNeeded: ["field-measurement", "provider-data"],
    units: ["unknown"],
    relatedSectionSlugs: ["connectivity", "workspace"],
  },
  {
    id: "parking-arrival-context",
    kind: "capture",
    priority: "medium",
    status: "pending",
    title: "Annotated parking and arrival context",
    request: "Publish an annotated arrival photo and a simple parking map after confirmation.",
    ownerRole: "unknown",
    evidenceNeeded: ["public-photo-set", "field-measurement"],
    relatedSectionSlugs: ["parking", "map"],
  },
  {
    id: "nearby-routes",
    kind: "source",
    priority: "medium",
    status: "pending",
    title: "Verified nearby routes",
    request: "Add verified nearby places, route distances, and practical daily-life notes when the address and mapping data are approved.",
    ownerRole: "unknown",
    evidenceNeeded: ["provider-data", "unknown"],
    units: ["miles", "minutes", "unknown"],
    relatedSectionSlugs: ["neighborhood", "healthcare", "dining", "recreation", "shopping", "transportation"],
  },
  {
    id: "safety-inventory",
    kind: "verify",
    priority: "high",
    status: "pending",
    title: "Safety inventory confirmation",
    request: "Confirm smoke and carbon-monoxide alarms, fire extinguisher, and first-aid inventory.",
    ownerRole: "unknown",
    evidenceNeeded: ["owner-confirmation"],
    relatedSectionSlugs: ["amenities", "accessibility"],
  },
  {
    id: "policies-and-availability",
    kind: "ask",
    priority: "high",
    status: "pending",
    title: "Booking and stay questions",
    request: "Confirm minimum stay, occupancy, pets, smoking, quiet hours, utilities, parking, arrival instructions, dates, pricing, fees, deposit, and next step by direct inquiry.",
    ownerRole: "unknown",
    evidenceNeeded: ["direct-inquiry"],
    relatedSectionSlugs: ["policies", "availability"],
  },
];

export const broadCottage: BroadCottageData = {
  id: "broad",
  name: "Broad Cottage",
  city: "Parkersburg",
  state: "West Virginia",
  location: "Parkersburg, West Virginia",
  canonicalPath: "/parkersburg/broad-cottage/",
  legacyPath: "/parkersburg/broad-cottage.html",
  summary: "A warm, wood-paneled one-bedroom furnished home with a generous living room and practical spaces for a peaceful stay.",
  description: "Explore the current public record for Broad Cottage: the rooms we can show, the amenities that are listed, and the details that still need confirmation before booking.",
  monthlyGuide: "$1,895/month",
  bedrooms: 1,
  bathrooms: 1,
  furnished: listed("Furnished status", "Furnished home"),
  photos: [
    photo("living-room-hero", broadLiving, "Broad Cottage wood-paneled living room with sectional seating and television", "The current hero view shows the home’s main living space and its wood-paneled interior.", "Living Room", "living-room"),
    photo("living-room-window", broadLivingAlt, "Broad Cottage living room alternate angle with a sunlit window and television", "An alternate living-room angle adds context without presenting a second room.", "Living Room", "living-room"),
    photo("bedroom-queen", broadQueenBedroom, "Broad Cottage bedroom with a queen bed, nightstand, hardwood floor, large window, and visible desk chair", "The public bedroom view shows a queen bed and a small work surface beside the window.", "Bedroom", "bedroom"),
    photo("bedroom-bath-access", broadBedroomAlt, "Broad Cottage bedroom viewed from a second angle with the adjoining bathroom doorway", "A second angle of the bedroom shows the adjoining bathroom doorway.", "Bedroom", "bedroom"),
    photo("bathroom-tub", broadBathroom, "Broad Cottage bathroom with tub and mirror", "The published bathroom view shows the tub, mirror, and vanity area.", "Bathroom", "bathroom"),
    photo("bathroom-shower", broadExtraShower, "Broad Cottage bathroom shower area with sink, mirror, and cabinets", "A separate shower-area view is published alongside the tub image.", "Shower", "bathroom"),
    photo("laundry-vanity", broadVanity, "Broad Cottage combined bathroom, laundry area, vanity, and mirror", "The published utility view shows the laundry and vanity relationship.", "Laundry", "laundry"),
  ],
  rooms: [
    {
      slug: "living-room",
      name: "Living Room",
      description: "The living room is the most fully documented public space: a generous, wood-paneled room with sectional seating, a television, and natural light.",
      status: "photographically-verified",
      photoIds: ["living-room-hero", "living-room-window"],
      facts: [
        photographed("Seating", "Sectional seating is visible in the public photographs."),
        photographed("Television", "A television is visible in the living-room photographs."),
        pending("Television details", "Smart TV platform and screen size are not published."),
        pending("Climate", "HVAC configuration and controls need confirmation."),
      ],
      amenities: [
        photographed("Sectional seating", "Visible in the public living-room photographs."),
        photographed("Television", "Visible; platform and size need confirmation."),
        pending("Work-friendly seating", "Not evaluated or published as a dedicated workspace."),
      ],
    },
    {
      slug: "kitchen",
      name: "Kitchen",
      description: "A full kitchen is listed for Broad Cottage. The detailed appliance, cookware, utensil, and dining inventory is intentionally held for confirmation.",
      status: "pending-confirmation",
      photoIds: [],
      facts: [
        listed("Kitchen status", "Full kitchen listed."),
        pending("Major appliances", "Refrigerator, stove, oven, microwave, sink, and exhaust details need confirmation."),
        pending("Cookware and tools", "Pans, knives, utensils, and baking equipment are not inventoried publicly."),
        pending("Dining inventory", "Plates, bowls, glasses, mugs, flatware, and seating count need confirmation."),
      ],
      amenities: [
        listed("Full kitchen", "Listed in the current public property description."),
        pending("Appliance inventory", "Confirm before relying on a specific appliance."),
        pending("Cookware inventory", "Confirm before planning a long stay around a specific item."),
      ],
    },
    {
      slug: "bedroom",
      name: "Bedroom",
      description: "Broad Cottage is currently documented as a one-bedroom home. The public photographs show a queen bed, nightstand, window, hardwood floor, and a visible desk chair.",
      status: "photographically-verified",
      photoIds: ["bedroom-queen", "bedroom-bath-access"],
      facts: [
        listed("Bedroom count", "One bedroom."),
        photographed("Bed", "Queen bed shown in the current public bedroom photograph."),
        photographed("Visible work surface", "A desk chair or small work surface is visible; dedicated workspace details need confirmation."),
        pending("Room dimensions", "Square footage and room dimensions are not published."),
        pending("Storage", "Closet, dresser, hangers, and drawer inventory need confirmation."),
      ],
      amenities: [
        photographed("Queen bed", "Shown in the current public photograph."),
        pending("Bedding inventory", "Pillows, linens, and blackout treatment need confirmation."),
        pending("Charging", "Outlet and USB availability is not published."),
      ],
    },
    {
      slug: "bathroom",
      name: "Bathroom",
      description: "The public photo set includes a tub, a separate shower-area view, and a vanity/laundry view. Dimensions, clearances, fixtures, and accessibility characteristics remain open.",
      status: "photographically-verified",
      photoIds: ["bathroom-tub", "bathroom-shower"],
      facts: [
        listed("Bathroom count", "One full bathroom."),
        photographed("Tub and shower area", "Both are represented in the current public photo set."),
        photographed("Vanity and mirror", "Shown in the published bathroom views."),
        pending("Dimensions and clearances", "Door width, thresholds, turning clearance, and fixture clearances need measurement."),
        pending("Supplies", "Towels, hair dryer, toiletries, and storage inventory need confirmation."),
      ],
      amenities: [
        photographed("Tub", "Shown in the public bathroom photograph."),
        photographed("Separate shower area", "Shown in a dedicated public photo."),
        pending("Accessibility features", "Do not infer step-free or wheelchair access from photographs."),
      ],
    },
    {
      slug: "laundry",
      name: "Laundry",
      description: "Washer and dryer are listed, and the current public photo set includes a combined laundry, bathroom, and vanity view.",
      status: "listed",
      photoIds: ["laundry-vanity"],
      facts: [
        listed("Laundry", "Washer and dryer listed."),
        photographed("Location", "Laundry relationship to the vanity is visible in the public photograph."),
        pending("Configuration", "Stacked or side-by-side placement, model, load size, and storage need confirmation."),
        pending("Supplies", "Detergent, baskets, iron, ironing board, and drying rack need confirmation."),
      ],
      amenities: [
        listed("Washer", "Listed; model and capacity not published."),
        listed("Dryer", "Listed; model and capacity not published."),
        pending("Laundry supplies", "Confirm what is supplied before arrival."),
      ],
    },
  ],
  inventory: [
    {
      title: "Essentials",
      items: [
        listed("Furnished home", "Furnished status is part of the current listing."),
        pending("Linens and towels", "Confirm current supplied quantities."),
        pending("Cleaning supplies", "Not inventoried in the public record."),
      ],
    },
    {
      title: "Kitchen",
      items: [
        listed("Full kitchen", "Listed in the property description."),
        pending("Refrigerator, range, and oven", "Confirm current appliance configuration."),
        pending("Microwave and dishwasher", "Presence is not published."),
        pending("Cookware and utensils", "Counts and specific items are not published."),
        pending("Dishware and glassware", "Counts are not published."),
      ],
    },
    {
      title: "Laundry",
      items: [
        listed("Washer and dryer", "Listed in the current property description."),
        pending("Iron and ironing board", "Confirm before relying on them."),
        pending("Drying rack and baskets", "Not published."),
      ],
    },
    {
      title: "Internet and work",
      items: [
        listed("Fiber-optic internet", "Fiber technology is listed; actual speed is not published."),
        photographed("Visible desk chair or work surface", "A chair or small work surface is visible in the bedroom photo."),
        pending("Measured speed", "No dated wired or Wi-Fi speed test is published."),
        pending("Ethernet and monitor", "Not published."),
      ],
    },
    {
      title: "Parking and arrival",
      items: [
        listed("Off-street parking", "Off-street parking is listed."),
        pending("Space count and surface", "Confirm driveway or lot configuration before arrival."),
        pending("Arrival path", "Entrance lighting, steps, and distance from parking need confirmation."),
        pending("EV charging", "Not published."),
      ],
    },
    {
      title: "Safety and accessibility",
      items: [
        pending("Smoke and carbon-monoxide alarms", "Safety inventory needs operational confirmation."),
        pending("Fire extinguisher and first aid", "Not inventoried publicly."),
        pending("Accessibility characteristics", "Publish only after field measurements and photographs."),
      ],
    },
  ],
  sections: ([
    { slug: "gallery", label: "Photos", title: "The current Broad Cottage photo record", description: "Browse the published living room, bedroom, bathroom, shower, and laundry views. Filters are room-based so the coverage—and its limits—stay visible.", status: "ready", facts: [listed("Published photo categories", "Living Room, Bedroom, Bathroom, Shower, Laundry")] },
    { slug: "virtual-tour", label: "Tour", title: "A digital tour is not published yet", description: "An interactive digital twin would need a measured property capture. The current conceptual study is not a scan, floor plan, or property-specific rendering.", status: "pending", facts: [pending("Interactive digital twin", "Not available"), illustrative("Concept study", "Illustrative only")], pendingNote: "Replace the concept study with an owner-approved Matterport or equivalent capture before calling this an interactive tour." },
    { slug: "floor-plan", label: "Floor Plan", title: "Measured floor plan pending", description: "A floor plan should explain how Broad Cottage is laid out without turning a concept image into an architectural claim.", status: "pending", facts: [pending("Measured plan", "Not published"), pending("Room dimensions", "Not published"), pending("Furniture overlay", "Not published")], pendingNote: "The public record confirms one bedroom and one bathroom, but not a measured plan, dimensions, doors, windows, or parking relationship." },
    { slug: "kitchen", label: "Kitchen", title: "What does the kitchen include?", description: "The full-kitchen listing is a starting point, not a complete inventory. This page separates the published claim from the items a long-stay resident should confirm.", status: "pending", facts: [listed("Kitchen type", "Full kitchen"), pending("Appliance and cookware inventory", "Confirm before booking")], pendingNote: "A complete kitchen shoot and counted inventory are still needed." },
    { slug: "living-room", label: "Living Room", title: "The room that anchors the stay", description: "The living room currently has the strongest visual coverage: two angles show the wood paneling, sectional seating, television, and windows.", status: "ready", facts: [photographed("Visual coverage", "Two published living-room angles"), photographed("Television", "Visible in the public photo set"), pending("Smart TV details", "Not published")] },
    { slug: "bedroom", label: "Bedroom", title: "One bedroom, clearly documented", description: "Broad Cottage is presently documented as a one-bedroom home. The public photographs show the queen bed and the adjoining bathroom relationship.", status: "ready", facts: [withUnits(listed("Bedroom count", "1"), ["count"]), photographed("Bed", "Queen bed shown"), pending("Dimensions and storage", "Confirm before booking")] },
    { slug: "bathroom", label: "Bathroom", title: "Tub, shower area, and vanity", description: "The public set gives a useful first look at the bathroom without making unsupported accessibility or dimension claims.", status: "ready", facts: [withUnits(listed("Bathroom count", "1 full bathroom"), ["count"]), photographed("Fixtures shown", "Tub, shower area, vanity, and mirror"), pending("Accessibility", "Requires field verification")] },
    { slug: "laundry", label: "Laundry", title: "Laundry is part of the furnished baseline", description: "Washer and dryer are listed and the public photo set shows their relationship to the vanity area. Operational details remain to be verified.", status: "ready", facts: [listed("Washer and dryer", "Listed"), pending("Models, capacity, and supplies", "Confirm before booking")] },
    { slug: "outdoors", label: "Outdoors", title: "Exterior coverage is still a content gap", description: "A premium property story needs front, entrance, porch, yard, driveway, and arrival context. Those approved Broad Cottage views are not currently published.", status: "pending", facts: [pending("Exterior photography", "Not available"), pending("Porch, yard, and gardens", "Not published"), pending("Arrival context", "Not published")], pendingNote: "Do not use the illustrative study as a substitute for exterior photography." },
    { slug: "amenities", label: "Amenities", title: "A structured inventory with honest gaps", description: "Use the amenity inventory to see what is listed, what is visible in photographs, and what still needs confirmation.", status: "ready", facts: [listed("Furnished", "Listed"), listed("Fiber-optic internet", "Listed"), listed("Washer and dryer", "Listed"), pending("Complete inventory", "Needs confirmation")] },
    { slug: "connectivity", label: "Internet", title: "Fiber is listed; speed is not yet measured", description: "Technology, advertised service, and actual in-home performance are separate facts. Broad Cottage currently has only the first of those published.", status: "pending", facts: [listed("Technology", "Fiber-optic internet"), pending("Provider and service tier", "Not published"), pending("Measured download/upload", "No dated property test"), pending("Wi-Fi at workspace", "Not tested")], pendingNote: "Publish a dated wired and Wi-Fi test with method and location before making a speed claim." },
    { slug: "workspace", label: "Workspace", title: "A work-friendly question worth measuring", description: "A chair or small work surface is visible in the bedroom photo, but remote-work readiness requires measured desk dimensions, outlets, light, and network performance.", status: "pending", facts: [photographed("Visible work surface", "Shown in bedroom photo"), pending("Desk dimensions and chair", "Not published"), pending("Wi-Fi and Ethernet", "Not tested"), pending("Remote-work rating", "Not calculated")], pendingNote: "Do not label the cottage remote-work ready until the transparent criteria have been measured." },
    { slug: "accessibility", label: "Accessibility", title: "Factual access details are pending", description: "Accessibility should be described feature by feature. The current public record is not enough to claim wheelchair accessibility or step-free access.", status: "pending", facts: [pending("Parking-to-door path", "Not measured"), pending("Steps and thresholds", "Not measured"), pending("Door widths and clearances", "Not measured"), pending("Bathroom access", "Not measured")], pendingNote: "Field measurements and photographs are required before publishing accessibility characteristics." },
    { slug: "parking", label: "Parking", title: "Where will you park?", description: "Off-street parking is listed, but a resident needs the space count, surface, route to the entrance, and arrival lighting.", status: "pending", facts: [listed("Parking headline", "Off-street parking"), pending("Number of vehicles", "Not published"), pending("Surface and route", "Not published"), pending("Night arrival", "Not photographed")], pendingNote: "Publish an annotated arrival photo and a simple parking map after confirmation." },
    { slug: "neighborhood", label: "Neighborhood", title: "Parkersburg context, with routed detail to come", description: "Broad Cottage is in Parkersburg, West Virginia. A useful neighborhood guide must go beyond generic tourism copy and publish verified daily routes.", status: "pending", facts: [listed("City", "Parkersburg, West Virginia"), pending("Exact neighborhood", "Not published"), pending("Daily destinations", "Needs routed verification"), pending("Walkability", "No licensed score published")], pendingNote: "Add verified nearby places, route distances, and practical Tuesday-life notes when the address and mapping data are approved." },
    { slug: "map", label: "Map", title: "Property map pending a privacy decision", description: "The map must balance useful orientation with residential location privacy. The exact address and coordinates are not published in the current record.", status: "pending", facts: [pending("Map mode", "Exact or approximate decision pending"), pending("Property marker", "Not published"), pending("Nearby pins and routes", "Not published")], pendingNote: "Choose exact versus approximate display per property before adding a map provider or POI data." },
    { slug: "healthcare", label: "Healthcare", title: "Healthcare routes need verified destinations", description: "A relocation-quality healthcare page should show the closest hospital, emergency department, urgent care, and pharmacy with routed times—not unsupported “best” claims.", status: "pending", facts: [pending("Hospital and emergency route", "Not published"), pending("Urgent care and pharmacy", "Not published"), pending("Drive times", "Not calculated")], pendingNote: "Add licensed place and route data only after the property location is approved." },
    { slug: "dining", label: "Dining", title: "A local dining guide is not published yet", description: "Closest, highly rated, and Mt Cottages recommended are different signals. The page will keep them distinct when local place data is curated.", status: "pending", facts: [pending("Restaurant guide", "Not published"), pending("Ratings and hours", "Not sourced"), pending("Drive and walk times", "Not calculated")], pendingNote: "Curate nearby dining from an approved provider or staff-maintained source; do not invent recommendations." },
    { slug: "recreation", label: "Recreation", title: "Recreation routes need a verified map", description: "Parks, trails, gyms, recreation centers, and dog-friendly options should be shown with route distance and a short factual description.", status: "pending", facts: [pending("Parks and trails", "Not published"), pending("Gyms and recreation", "Not published"), pending("Routes", "Not calculated")], pendingNote: "Publish practical recreational options once the nearby-place source and property location are verified." },
    { slug: "shopping", label: "Shopping", title: "Everyday shopping detail is pending", description: "Groceries, pharmacies, convenience stores, and other daily services are high-value relocation information, but they need verified nearby-place data.", status: "pending", facts: [pending("Grocery route", "Not published"), pending("Pharmacy route", "Not published"), pending("Convenience and retail", "Not published")], pendingNote: "Do not publish straight-line or guessed distances as daily travel guidance." },
    { slug: "transportation", label: "Transportation", title: "Transportation context is pending", description: "A practical transportation page should distinguish driving, walking, biking, transit, airport, and cellular context where data is available.", status: "pending", facts: [pending("Transit", "Not sourced"), pending("Walk and bike routes", "Not calculated"), pending("Airport and employer routes", "Not published")], pendingNote: "Add route modes only when an approved provider can supply current data." },
    { slug: "policies", label: "Policies", title: "Policies should be confirmed before booking", description: "Minimum stay, occupancy, pets, smoking, quiet hours, utilities, parking, and arrival instructions are important stay decisions and are not fully published here.", status: "pending", facts: [pending("Minimum stay", "Confirm"), pending("Pets and smoking", "Confirm"), pending("Occupancy and quiet hours", "Confirm"), pending("Utilities and access", "Confirm")], pendingNote: "The public page keeps these questions visible without turning an unverified operational detail into a promise." },
    { slug: "availability", label: "Availability", title: "Start with the guide, then confirm the stay", description: "The monthly price is published as a guide. Availability, final pricing, fees, deposit, utilities, and the right next step require a direct inquiry.", status: "ready", facts: [withUnits(listed("Published monthly guide", "$1,895/month"), ["dollars-per-month"]), pending("Confirmed quote", "Not provided until inquiry"), pending("Confirmed dates", "Not published")], pendingNote: "Use the inquiry CTA to share move-in timing, move-out timing, household, pets, vehicle count, and questions." },
  ] as MicrositeSection[]).map(withSectionEvidence),
  verification: [
    listed("One-bedroom layout", "Published in the current property record."),
    listed("Furnished home", "Published."),
    listed("Fiber-optic internet", "Technology is published; speed is not."),
    listed("Washer and dryer", "Published."),
    photographed("Queen bedroom", "Shown in the current public photo set."),
    pending("Square footage", "Not published."),
    pending("Exact address and coordinates", "Not published; privacy decision pending."),
    pending("Exterior, parking, accessibility, and policies", "Need confirmation."),
  ],
  illustrativeStudy: [
    photo(
      "concept-top-down",
      broadConceptTopDown,
      "Illustrative top-down cottage massing concept with porch, path, driveway, and trees; not a measured survey or Broad Cottage floor plan.",
      "Illustrative Concept — Not to Scale. This is a generic orientation study, not a Broad Cottage survey.",
      "3D / Virtual Tour",
      undefined,
      "illustrative",
    ),
    photo(
      "concept-45-degree",
      broadConcept45,
      "Illustrative 45-degree cottage massing concept with porch, path, driveway, and trees; not a verified property rendering.",
      "Illustrative Concept — Not to Scale. Do not use this view to infer Broad Cottage dimensions or exterior features.",
      "3D / Virtual Tour",
      undefined,
      "illustrative",
    ),
  ],
  longStayAudienceFit: broadCottageLongStayAudienceFit,
  photoCoverage: broadCottagePhotoCoverage,
  captureBacklog: broadCottageCaptureBacklog,
};

export const broadCottageByRoom = new Map(broadCottage.rooms.map((room) => [room.slug, room]));
export const broadCottageBySection = new Map(broadCottage.sections.map((section) => [section.slug, section]));
export const broadCottagePhotoById = new Map(broadCottage.photos.map((item) => [item.id, item]));
export const broadCottageLongStaySignalByKey = new Map(broadCottage.longStayAudienceFit.signals.map((item) => [item.key, item]));
export const broadCottagePhotoCoverageByArea = new Map(broadCottage.photoCoverage.map((item) => [item.area, item]));
export const broadCottageCaptureBacklogById = new Map(broadCottage.captureBacklog.map((item) => [item.id, item]));
export const broadCottageInquiryUrl = "https://stay.mtcottages.com/?property=broad";

export const broadCottageNavItems = [
  { label: "Overview", href: broadCottage.canonicalPath, section: "overview" },
  { label: "Photos", href: `${broadCottage.canonicalPath}gallery/`, section: "gallery" },
  { label: "Tour", href: `${broadCottage.canonicalPath}virtual-tour/`, section: "virtual-tour" },
  { label: "Floor plan", href: `${broadCottage.canonicalPath}floor-plan/`, section: "floor-plan" },
  { label: "Rooms", href: "#rooms", section: "rooms" },
  { label: "Amenities", href: `${broadCottage.canonicalPath}amenities/`, section: "amenities" },
  { label: "Internet", href: `${broadCottage.canonicalPath}connectivity/`, section: "connectivity" },
  { label: "Neighborhood", href: `${broadCottage.canonicalPath}neighborhood/`, section: "neighborhood" },
  { label: "Map", href: `${broadCottage.canonicalPath}map/`, section: "map" },
  { label: "Availability", href: `${broadCottage.canonicalPath}availability/`, section: "availability" },
];

export const broadCottagePropertySchema = {
  "@context": "https://schema.org",
  "@type": "Accommodation",
  name: broadCottage.name,
  identifier: "mtcottages:broad-cottage",
  description: broadCottage.summary,
  url: `https://mtcottages.com${broadCottage.canonicalPath}`,
  numberOfBedrooms: broadCottage.bedrooms,
  numberOfBathroomsTotal: broadCottage.bathrooms,
  address: {
    "@type": "PostalAddress",
    addressLocality: broadCottage.city,
    addressRegion: "WV",
    addressCountry: "US",
  },
  image: broadCottage.photos.filter((item) => item.status !== "illustrative").map((item) => `https://mtcottages.com${item.src.src}`),
  containedInPlace: { "@type": "Place", name: "Mid-Ohio Valley" },
};
