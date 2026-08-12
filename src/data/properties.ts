import houses from "../../_data/houses.json";

export type Property = {
  id: string;
  name: string;
  route: string;
  town: string;
  townSlug: string;
  bedrooms: number;
  bathrooms: number;
  priceMonthly: number;
  priceShort: number;
  summary: string;
  description: string;
  amenities: string[];
  neighborhood: string;
  proximity: string[];
  floorPlan: string;
};

type HouseRecord = {
  name: string;
  route: string;
  town: string;
  town_slug: string;
  bedrooms: number;
  bathrooms: number;
  price_monthly_12: number;
  price_monthly_short: number;
  summary: string;
  description: string;
  unique_amenities: string[];
  neighborhood: string;
  proximity: string[];
  floor_plan: string;
};

const source = houses as Record<string, HouseRecord>;

export const properties: Property[] = Object.entries(source).map(([id, house]) => ({
  id,
  name: house.name,
  route: house.route,
  town: house.town,
  townSlug: house.town_slug,
  bedrooms: house.bedrooms,
  bathrooms: house.bathrooms,
  priceMonthly: house.price_monthly_12,
  priceShort: house.price_monthly_short,
  summary: house.summary,
  description: house.description,
  amenities: house.unique_amenities,
  neighborhood: house.neighborhood,
  proximity: house.proximity,
  floorPlan: house.floor_plan,
}));

export const towns = [...new Set(properties.map((property) => property.townSlug))];

export function getProperty(id: string): Property {
  const property = properties.find((candidate) => candidate.id === id);
  if (!property) throw new Error(`Unknown property: ${id}`);
  return property;
}

export function getTownName(slug: string): string {
  const property = properties.find((candidate) => candidate.townSlug === slug);
  return property?.town.replace(/,\s*(OH|WV)$/, "") ?? slug;
}

export function getTownRoute(slug: string): string {
  return `/${slug}/index.html`;
}
