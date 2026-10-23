import { stayApplicationUrl } from "../site";
import type { HomeMicrosite, FactStatus, NearbyKind, PlanRoomKind } from "./types";

export const fullAddress = (home: HomeMicrosite) =>
  `${home.address.streetAddress}, ${home.address.locality}, ${home.address.region} ${home.address.postalCode}`;

export const homeBase = (home: HomeMicrosite) => `/${home.town.slug}/${home.slug}/`;

/** Directory URL for the index page, .html files for the rest (build.format "preserve"). */
export const homeHref = (home: HomeMicrosite, page: "index" | "tour" | "plan" | "amenities" | "location" = "index") =>
  page === "index" ? homeBase(home) : `${homeBase(home)}${page}.html`;

export const inquiryUrl = (id: string) => `${stayApplicationUrl}?property=${encodeURIComponent(id)}`;

export const googleDirectionsTo = (address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

export const googleDirectionsFrom = (origin: string, address: string) =>
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(address)}`;

export const googleSearch = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const appleMapsTo = (address: string) => `https://maps.apple.com/?daddr=${encodeURIComponent(address)}&dirflg=d`;

export const osmEmbedUrl = (lat: number, lng: number) => {
  const dLat = 0.006;
  const dLng = 0.009;
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat].map((n) => n.toFixed(6)).join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
};

export const osmLargeUrl = (lat: number, lng: number) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

export const statusLabel: Record<FactStatus, string> = {
  confirmed: "Confirmed",
  listed: "Listed",
  photographed: "In photos",
  confirm: "Confirm on inquiry",
};

export const statusHelp: Record<FactStatus, string> = {
  confirmed: "The owner has confirmed this detail.",
  listed: "Part of the home's published Mt Cottages listing.",
  photographed: "Visible in the published photographs.",
  confirm: "Not yet confirmed. Ask us before you rely on it.",
};

export const nearbyKindLabel: Record<NearbyKind, string> = {
  health: "Health care",
  grocery: "Groceries",
  food: "Food and coffee",
  park: "Parks and outdoors",
  school: "Schools",
  transit: "Getting around",
  shopping: "Shopping",
  civic: "Community and services",
};

export const nearbyKindOrder: NearbyKind[] = ["health", "grocery", "food", "shopping", "park", "school", "transit", "civic"];

export const planKindLabel: Record<PlanRoomKind, string> = {
  bedroom: "Bedroom",
  bath: "Bath",
  kitchen: "Kitchen",
  living: "Living",
  dining: "Dining",
  laundry: "Laundry",
  porch: "Porch",
  hall: "Hall",
  office: "Office",
  stairs: "Stairs",
  other: "Other",
};

/** Light fills so dark label text keeps AA contrast. */
export const planKindColor: Record<PlanRoomKind, string> = {
  bedroom: "#dbe5f1",
  bath: "#d3ebe7",
  kitchen: "#f4dfc6",
  living: "#e1eadd",
  dining: "#f0e6c4",
  laundry: "#e6dcef",
  porch: "#ebe5d3",
  hall: "#f0f0e8",
  office: "#dde8cf",
  stairs: "#d8d8d0",
  other: "#ebe9e1",
};
