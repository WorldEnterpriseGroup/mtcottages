/**
 * Washington Works crew landing (#44): /corporate-housing/washington-works/,
 * the plant-specific child of the corporate and crew hub (#34), for
 * contractors and shutdown crews at the Chemours Washington Works site in
 * Washington, WV, west of Parkersburg. It targets the Washington Works rows of
 * docs/marketing/keyword-universe.csv. Rendered by
 * src/components/WashingtonWorksPage.astro.
 *
 * The hub's honesty rules apply (src/data/corporateHousing.ts), plus:
 * - Every minute and mile is read from _data/distances.json through
 *   driveMatrix(). Homes with an approved street address are measured from it;
 *   Buck Cottage has none, so it is measured from the Parkersburg town centre
 *   and labelled so. A home without a measured row is not listed.
 * - The capacity rows are the hub's own (each home's facts), filtered to the
 *   homes on this page, so the two pages cannot disagree.
 * - Neutral and factual: the plant is named only to say where the homes are.
 *   No comment on the plant, its owner or any litigation, and no affiliation.
 */
import { homes } from "./homes";
import { homeHref } from "./homes/links";
import { driveMatrix, formatMeasured, type DriveFromHome, type DriveMatrixRow } from "./distances";
import { capacityRows as hubCapacityRows, disclaimer as hubDisclaimer, hubAudience, hubHref, termsRows, type CapacityRow } from "./corporateHousing";
import type { Faq } from "./townLanding";
import type { HomeMicrosite } from "./homes/types";

export const washingtonWorksHref = "/corporate-housing/washington-works/";
export { hubAudience, hubHref };

const PLANT = "chemours-washington-works";

const home = (id: string): HomeMicrosite => {
  const found = homes.find((entry) => entry.id === id);
  if (!found) throw new Error(`The Washington Works page lists "${id}", which has no live home microsite`);
  return found;
};

/** The Parkersburg homes, then Frederick Cottage across the river in Marietta, Ohio. */
const pageHomes = ["broad", "oak", "buck", "frederick"].map(home);

export const fromLabel = (line: DriveFromHome): string =>
  line.originKind === "address" ? `${line.homeName}, from its street address` : `${line.homeName}, from the Parkersburg town centre`;

const [plantRow] = driveMatrix([PLANT], pageHomes);
if (plantRow.drives.length < 2) throw new Error(`_data/distances.json has fewer than two measured ${PLANT} drives for the Washington Works page`);
/** One line per measured home, nearest first. */
export const plantDrives: DriveFromHome[] = plantRow.drives;
export const plantLabel = plantRow.label;
export const plantNote = plantRow.note ?? "";
export const nearest = plantDrives[0];

/** The homes on the page, in drive order, with their measured line. */
export const pageHomeIds = plantDrives.map((line) => line.homeId);
export const homeLinks = pageHomeIds.map((id) => { const entry = home(id); return { id, name: entry.name, href: homeHref(entry) }; });

/** The hub's capacity rows for these homes, nearest to the plant first. */
export const capacityRows: CapacityRow[] = pageHomeIds.map((id) => {
  const row = hubCapacityRows.find((entry) => entry.id === id);
  if (!row) throw new Error(`The corporate hub has no capacity row for ${id}`);
  return row;
});

/** Other measured places a crew uses, from the same homes; only measured pairs show. */
export const areaRows: DriveMatrixRow[] = driveMatrix(["i77-parkersburg", "downtown-parkersburg"], pageHomes.filter((entry) => pageHomeIds.includes(entry.id)))
  .filter((row) => row.drives.length > 0);

const dates = [...new Set([...plantDrives, ...areaRows.flatMap((row) => row.drives)].map((line) => line.measured))].sort();
export const driveSource =
  `Routes from OpenStreetMap data (OSRM), measured ${dates.map(formatMeasured).join(" and ")}, to the plant site as OpenStreetMap maps it. Buck Cottage has no published address, so it is measured from the Parkersburg town centre. Free-flow driving times; allow longer at shift change, and gate times vary by shift entrance.`;

const parkersburgMinutes = plantDrives.filter((line) => line.homeId !== "frederick").map((line) => line.minutes);
const range = `${Math.min(...parkersburgMinutes)} to ${Math.max(...parkersburgMinutes)}`;

export const page = {
  title: "Crew Housing Near Washington Works, WV | Mt Cottages",
  description: `Furnished homes for contractors and shutdown crews near Chemours Washington Works: Parkersburg, WV homes ${range} minutes away by measured drive.`,
  eyebrow: "Washington Works and the Parkersburg plants",
  h1: "Crew housing near Washington Works, west of Parkersburg, WV",
  lede: `Bringing contractors or a shutdown crew to the Chemours Washington Works site? Our Parkersburg homes are ${range} minutes from the plant by measured drive: whole furnished houses, so a crew shares one address and one kitchen instead of a row of hotel rooms.`,
  intro: "This page gives the measured drive from each home to the plant, what each home holds for a crew, and what we confirm before you commit. It covers housing only: we say nothing about the plant itself.",
  inquiryLabel: "Find a home for your crew",
} as const;

export const disclaimer = hubDisclaimer;

const oneMonthEverywhere = termsRows
  .filter((row) => pageHomeIds.includes(row.id))
  .every((row) => row.minimumStay.confirmed && /^(30 days|one month)$/i.test(row.minimumStay.text.trim()));

export const faqs: Faq[] = [
  {
    q: "How far are the homes from Washington Works?",
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
    q: "Is Mt Cottages connected to Chemours?",
    a: "No. Mt Cottages is an independent furnished-housing company, not affiliated with, endorsed by or sponsored by Chemours or any employer. The plant is named only to say where our homes are in relation to it.",
  },
];
