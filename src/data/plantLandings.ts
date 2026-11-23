/**
 * Plant crew landings: one page per industrial site, each a child of the
 * corporate and crew hub (#34). Washington Works (#44) and Constellium
 * Ravenswood (#43) are the first two; a new plant is one more entry in
 * `plantLandings` below, rendered by src/components/PlantLandingPage.astro
 * through src/pages/corporate-housing/[plant]/index.astro.
 *
 * The hub's honesty rules apply (src/data/corporateHousing.ts), plus:
 * - Every minute and mile is read from _data/distances.json through
 *   driveMatrix(). Homes with an approved street address are measured from
 *   it; a home without one is measured from its town centre and labelled so.
 *   A home without a measured drive to the plant is not listed.
 * - The capacity rows are the hub's own (each home's facts), filtered to the
 *   homes on the page, so the pages cannot disagree.
 * - Neutral and factual: the plant is named only to say where the homes are.
 *   No comment on the plant, its owner or any litigation, and no affiliation.
 */
import { homes } from "./homes";
import { homeHref } from "./homes/links";
import { driveMatrix, formatMeasured, type DriveFromHome, type DriveMatrixRow } from "./distances";
import { capacityRows as hubCapacityRows, disclaimer as hubDisclaimer, hubAudience, hubHref, termsRows, type CapacityRow } from "./corporateHousing";
import type { Faq } from "./townLanding";
import type { HomeMicrosite } from "./homes/types";

export { hubAudience, hubHref };

/** What a plant landing needs to know; everything else is measured or read from the hub. */
interface PlantSpec {
  /** The URL segment, /corporate-housing/<slug>/, and the _data/distances.json destination id. */
  slug: string;
  destination: string;
  /** Short name used in headings and questions, e.g. "Washington Works". */
  name: string;
  /** The company that runs the plant, named only in the no-affiliation answer. */
  owner: string;
  /** Live home ids to measure, in any order; the page sorts them by drive. */
  homeIds: string[];
  /** Homes counted in the headline minute range (all of homeIds when omitted). */
  rangeHomeIds?: string[];
  /** The town whose centre a home without a published address is measured from. */
  townCentre: string;
  /** Other places a crew uses; a place without a measured drive from any listed home is dropped. */
  areaIds: string[];
  areaCaption: string;
  /** Page copy; `range` is the measured minute range, e.g. "4 to 9". */
  copy: (range: string) => {
    title: string;
    description: string;
    eyebrow: string;
    h1: string;
    lede: string;
    intro: string;
    homesHeading: string;
  };
  /** The related-link text a home page shows for this landing. */
  linkLabel: string;
}

export interface PlantLanding {
  slug: string;
  href: string;
  name: string;
  plantLabel: string;
  plantDrives: DriveFromHome[];
  nearest: DriveFromHome;
  homeLinks: { id: string; name: string; href: string }[];
  capacityRows: CapacityRow[];
  areaRows: DriveMatrixRow[];
  areaCaption: string;
  driveSource: string;
  page: ReturnType<PlantSpec["copy"]> & { inquiryLabel: string };
  faqs: Faq[];
  disclaimer: string;
  linkLabel: string;
  fromLabel: (line: DriveFromHome) => string;
}

const liveHome = (id: string, plant: string): HomeMicrosite => {
  const found = homes.find((entry) => entry.id === id);
  if (!found) throw new Error(`The ${plant} page lists "${id}", which has no live home microsite`);
  return found;
};

const joinNames = (names: string[]): string =>
  names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

export function plantLanding(spec: PlantSpec): PlantLanding {
  const href = `${hubHref}${spec.slug}/`;
  const pageHomes = spec.homeIds.map((id) => liveHome(id, spec.name));
  const fromLabel = (line: DriveFromHome): string =>
    line.originKind === "address" ? `${line.homeName}, from its street address` : `${line.homeName}, from the ${spec.townCentre} town centre`;

  const [plantRow] = driveMatrix([spec.destination], pageHomes);
  if (plantRow.drives.length < 2) throw new Error(`_data/distances.json has fewer than two measured ${spec.destination} drives for the ${spec.name} page`);
  const plantDrives = plantRow.drives;
  const pageHomeIds = plantDrives.map((line) => line.homeId);
  const homeLinks = pageHomeIds.map((id) => { const entry = liveHome(id, spec.name); return { id, name: entry.name, href: homeHref(entry) }; });
  const capacityRows = pageHomeIds.map((id) => {
    const row = hubCapacityRows.find((entry) => entry.id === id);
    if (!row) throw new Error(`The corporate hub has no capacity row for ${id}`);
    return row;
  });
  const areaRows = driveMatrix(spec.areaIds, pageHomes.filter((entry) => pageHomeIds.includes(entry.id))).filter((row) => row.drives.length > 0);

  const dates = [...new Set([...plantDrives, ...areaRows.flatMap((row) => row.drives)].map((line) => line.measured))].sort();
  const centreHomes = plantDrives.filter((line) => line.originKind !== "address").map((line) => line.homeName);
  const centreNote = centreHomes.length === 0
    ? ""
    : ` ${joinNames(centreHomes)} ${centreHomes.length === 1 ? "has" : "have"} no published address, so ${centreHomes.length === 1 ? "it is" : "they are"} measured from the ${spec.townCentre} town centre.`;
  const driveSource =
    `Routes from OpenStreetMap data (OSRM), measured ${dates.map(formatMeasured).join(" and ")}, to the plant site as OpenStreetMap maps it.${centreNote} Free-flow driving times; allow longer at shift change, and gate times vary by shift entrance.`;

  const rangeIds = spec.rangeHomeIds ?? spec.homeIds;
  const rangeMinutes = plantDrives.filter((line) => rangeIds.includes(line.homeId)).map((line) => line.minutes);
  if (rangeMinutes.length === 0) throw new Error(`The ${spec.name} page has no measured drive for its headline homes`);
  const low = Math.min(...rangeMinutes);
  const high = Math.max(...rangeMinutes);
  const range = low === high ? `${low}` : `${low} to ${high}`;

  const oneMonthEverywhere = termsRows
    .filter((row) => pageHomeIds.includes(row.id))
    .every((row) => row.minimumStay.confirmed && /^(30 days|one month)$/i.test(row.minimumStay.text.trim()));

  const faqs: Faq[] = [
    {
      q: `How far are the homes from ${spec.name}?`,
      a: `${plantDrives.map((line) => `${line.homeName} is about ${line.minutes} minutes (${line.miles.toFixed(1)} miles)`).join("; ")}, by measured routes in free-flow driving to the plant site as mapped. Allow longer at shift change; gate times vary by shift entrance.`,
    },
    {
      q: "How many people can a home sleep?",
      a: `Bedrooms: ${capacityRows.map((row) => `${row.name} ${row.bedrooms}`).join(", ")}. How many each home sleeps is shown in the table where the home's own listing states it, and confirmed on inquiry otherwise. Tell us your headcount and we confirm in writing which home fits.`,
    },
    {
      q: "Can a crew stay for a two-week shutdown?",
      a: oneMonthEverywhere
        ? "Every home lists a one-month minimum stay (30 days). Send your outage dates and we tell you plainly whether a shorter stay can work and what it costs, and confirm which home is free, before you commit."
        : "Each home sets its own minimum stay, and the corporate housing page lists them. Send your dates and we confirm which home is free for them before you commit.",
    },
    {
      q: "Where do work trucks park?",
      a: "Parking is shown in the table only where a home's own listing states it. Tell us how many vehicles are coming, and whether any are work trucks or trailers, and we answer for the home you are considering before you commit.",
    },
    {
      q: `Is Mt Cottages connected to ${spec.owner}?`,
      a: `No. Mt Cottages is an independent furnished-housing company, not affiliated with, endorsed by or sponsored by ${spec.owner} or any employer. The plant is named only to say where our homes are in relation to it.`,
    },
  ];

  return {
    slug: spec.slug,
    href,
    name: spec.name,
    plantLabel: plantRow.label,
    plantDrives,
    nearest: plantDrives[0],
    homeLinks,
    capacityRows,
    areaRows,
    areaCaption: spec.areaCaption,
    driveSource,
    page: { ...spec.copy(range), inquiryLabel: "Find a home for your crew" },
    faqs,
    disclaimer: hubDisclaimer,
    linkLabel: spec.linkLabel,
    fromLabel,
  };
}

/** Chemours Washington Works, Washington, WV, west of Parkersburg (#44). */
export const washingtonWorks = plantLanding({
  slug: "washington-works",
  destination: "chemours-washington-works",
  name: "Washington Works",
  owner: "Chemours",
  // The Parkersburg homes, then Frederick Cottage across the river in Marietta, Ohio.
  homeIds: ["broad", "oak", "buck", "frederick"],
  rangeHomeIds: ["broad", "oak", "buck"],
  townCentre: "Parkersburg",
  areaIds: ["i77-parkersburg", "downtown-parkersburg"],
  areaCaption: "Other measured drives: the interstate and downtown Parkersburg",
  copy: (range) => ({
    title: "Crew Housing Near Washington Works, WV | Mt Cottages",
    description: `Furnished homes for contractors and shutdown crews near Chemours Washington Works: Parkersburg, WV homes ${range} minutes away by measured drive.`,
    eyebrow: "Washington Works and the Parkersburg plants",
    h1: "Crew housing near Washington Works, west of Parkersburg, WV",
    lede: `Bringing contractors or a shutdown crew to the Chemours Washington Works site? Our Parkersburg homes are ${range} minutes from the plant by measured drive: whole furnished houses, so a crew shares one address and one kitchen instead of a row of hotel rooms.`,
    intro: "This page gives the measured drive from each home to the plant, what each home holds for a crew, and what we confirm before you commit. It covers housing only: we say nothing about the plant itself.",
    homesHeading: "Furnished homes within a short drive of the plant",
  }),
  linkLabel: "Crew housing near Chemours Washington Works",
});

/** Constellium's rolling mill at Ravenswood, WV, on Century Road south of town (#43). */
export const constelliumRavenswood = plantLanding({
  slug: "constellium-ravenswood",
  destination: "constellium-ravenswood",
  name: "Constellium Ravenswood",
  owner: "Constellium",
  homeIds: ["henrietta", "virginia"],
  townCentre: "Ravenswood",
  // Downtown Ravenswood is left out: it is the town-centre point Virginia Cottage is measured from.
  areaIds: ["i77-ravenswood", "foodfair-ravenswood"],
  areaCaption: "Other measured drives: the interstate and the grocery store in Ravenswood",
  copy: (range) => ({
    title: "Crew Housing Near Constellium Ravenswood, WV | Mt Cottages",
    description: `Furnished homes for contractors, crews and new hires at Constellium Ravenswood: two Ravenswood, WV homes ${range} minutes away by measured drive.`,
    eyebrow: "Constellium and the Ravenswood plant area",
    h1: "Crew housing near Constellium Ravenswood, WV",
    lede: `Bringing contractors or a shutdown crew to the Constellium plant, or starting a job there? Henrietta and Virginia Cottages are ${range} minutes from the plant by measured drive: whole furnished houses, so a crew shares one address and one kitchen instead of a row of hotel rooms.`,
    intro: "This page gives the measured drive from each home to the plant, what each home holds for a crew, and what we confirm before you commit. It covers housing only: we say nothing about the plant itself.",
    homesHeading: "Furnished homes in Ravenswood, a short drive from the plant",
  }),
  linkLabel: "Crew housing near Constellium Ravenswood",
});

/** Every plant landing, in the order the hub lists them. */
export const plantLandings: PlantLanding[] = [washingtonWorks, constelliumRavenswood];

/** The plant landings that list a home, as related links for its microsite. */
export const plantLandingsForHome = (homeId: string) =>
  plantLandings
    .filter((landing) => landing.homeLinks.some((entry) => entry.id === homeId))
    .map((landing) => ({ href: landing.href, label: landing.page.h1, note: landing.page.description }));
