import raw from "../../_data/area-stats.json";

/**
 * Typed, checked view of _data/area-stats.json (#48): Census population
 * estimates, HUD Fair Market Rents, BEA Regional Price Parities (#58) and a
 * sourced employer list. Guides chart
 * these figures and quote them in prose through this module, never by hand.
 * scripts/area-stats.mjs refreshes the official parts from their source files.
 */

/** file: the one data file a figure was read from; files: several (one per state). */
export type Source = { label: string; url: string; file?: string; files?: string[] };
export type PopulationPlace = { id: string; label: string; base2020: number; estimate: number };
export type RentArea = { id: string; label: string; hudArea: string; rents: [number, number, number, number, number] };
export type Employer = { name: string; employees: number };
/** BEA Regional Price Parity categories: all items, goods, housing (rents), utilities, other services. */
export const parityCategories = ["all", "goods", "housing", "utilities", "other"] as const;
export type ParityCategory = (typeof parityCategories)[number];
export type ParityArea = { id: string; label: string; index: Record<ParityCategory, number> };

type AreaStats = {
  retrieved: string;
  population: { vintage: number; estimateDate: string; baseDate: string; source: Source; places: PopulationPlace[] };
  fairMarketRent: { fiscalYear: number; source: Source; areas: RentArea[] };
  employers: { area: string; source: Source; list: Employer[] };
  priceParities: { year: number; released: string; source: Source; portionFile: string; areas: ParityArea[] };
};

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0;
const isIso = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const hasSource = (value: unknown): value is Source =>
  typeof value === "object" && value !== null && typeof (value as Source).label === "string" && /^https:\/\//.test((value as Source).url);

function validate(data: unknown): string[] {
  const problems: string[] = [];
  const stats = data as Partial<AreaStats>;
  if (!isIso(stats.retrieved)) problems.push("retrieved must be an ISO date");
  const population = stats.population;
  if (!population || !hasSource(population.source) || !isIso(population.estimateDate) || !Array.isArray(population.places) || population.places.length === 0) {
    problems.push("population needs a source, an estimate date and places");
  } else {
    for (const place of population.places) if (!place.id || !isCount(place.base2020) || !isCount(place.estimate)) problems.push(`population ${place.id}: base2020 and estimate must be whole numbers`);
  }
  const rent = stats.fairMarketRent;
  if (!rent || !hasSource(rent.source) || !Array.isArray(rent.areas) || rent.areas.length === 0) {
    problems.push("fairMarketRent needs a source and areas");
  } else {
    for (const area of rent.areas) if (!area.id || !Array.isArray(area.rents) || area.rents.length !== 5 || !area.rents.every(isCount)) problems.push(`fairMarketRent ${area.id}: rents must be five whole-dollar figures (studio to four bedrooms)`);
  }
  const employers = stats.employers;
  if (!employers || !hasSource(employers.source) || !Array.isArray(employers.list) || employers.list.length === 0) {
    problems.push("employers needs a source and a list");
  } else {
    for (const employer of employers.list) if (!employer.name || !isCount(employer.employees)) problems.push(`employer ${employer.name}: employees must be a whole number`);
  }
  const parities = stats.priceParities;
  if (!parities || !hasSource(parities.source) || !Number.isInteger(parities.year) || !isIso(parities.released) || !Array.isArray(parities.areas) || parities.areas.length === 0) {
    problems.push("priceParities needs a source, a year, a release date and areas");
  } else {
    for (const area of parities.areas) {
      const index = area.index as Partial<Record<ParityCategory, unknown>> | undefined;
      if (!area.id || !index || !parityCategories.every((category) => typeof index[category] === "number" && (index[category] as number) > 0)) {
        problems.push(`priceParities ${area.id}: index needs a positive number for each of ${parityCategories.join(", ")}`);
      }
    }
  }
  return problems;
}

const problems = validate(raw);
if (problems.length > 0) throw new Error(`_data/area-stats.json is invalid:\n${problems.join("\n")}`);

export const areaStats = raw as unknown as AreaStats;

export function populationOf(id: string): PopulationPlace {
  const place = areaStats.population.places.find((candidate) => candidate.id === id);
  if (!place) throw new Error(`_data/area-stats.json has no population for ${id}`);
  return place;
}

export function rentArea(id: string): RentArea {
  const area = areaStats.fairMarketRent.areas.find((candidate) => candidate.id === id);
  if (!area) throw new Error(`_data/area-stats.json has no Fair Market Rent area ${id}`);
  return area;
}

export function parityArea(id: string): ParityArea {
  const area = areaStats.priceParities.areas.find((candidate) => candidate.id === id);
  if (!area) throw new Error(`_data/area-stats.json has no Regional Price Parity area ${id}`);
  return area;
}

/** Bedroom labels for the five Fair Market Rent sizes, in file order. */
export const rentSizes = ["Studio", "1 bedroom", "2 bedrooms", "3 bedrooms", "4 bedrooms"] as const;

export const formatCount = (value: number) => value.toLocaleString("en-US");
export const formatDollars = (value: number) => `$${value.toLocaleString("en-US")}`;

/** Signed percentage change, one decimal place: "-3.7%". */
export const percentChange = (from: number, to: number) => {
  const change = ((to - from) / from) * 100;
  return `${change > 0 ? "+" : change < 0 ? "−" : ""}${Math.abs(change).toFixed(1)}%`;
};
