/**
 * Jackson General Hospital landing (#45): /travel-nurses/jackson-general/, the
 * Ripley child of the travel-nurse hub (#29), for staff and travellers at WVU
 * Medicine Jackson General Hospital. Our nearest homes are in Ravenswood.
 * It targets the Jackson General and Ripley rows of
 * docs/marketing/keyword-universe.csv. Rendered by
 * src/components/JacksonGeneralPage.astro.
 *
 * Honesty rules, enforced by e2e/tests/jackson-general.spec.js:
 * - Every minute and mile is read from _data/distances.json through
 *   driveMatrix(); none is typed into the copy. Henrietta Cottage is measured
 *   from its approved street address. Virginia Cottage has no published
 *   address, so it is measured from the Ravenswood town centre and labelled so.
 * - The hospital is in Ripley, not Ravenswood, and the page says so.
 * - The Ravenswood context lists only places with a measured drive.
 * - Parking and internet repeat only what each home's facts say; the rest is
 *   confirmed on inquiry. No affiliation with WVU Medicine is claimed.
 */
import { homes } from "./homes";
import { homeHref } from "./homes/links";
import { driveMatrix, formatMeasured, type DriveFromHome, type DriveMatrixRow } from "./distances";
import { disclaimer, faqs as hubFaqs, hubHref, terms as hubTerms } from "./travelNurses";
import type { Faq } from "./townLanding";
import type { HomeMicrosite } from "./homes/types";

export const jacksonGeneralHref = "/travel-nurses/jackson-general/";
export { disclaimer, hubHref };

const HOSPITAL = "jackson-general";

const home = (id: string): HomeMicrosite => {
  const found = homes.find((entry) => entry.id === id);
  if (!found) throw new Error(`The Jackson General page lists "${id}", which has no live home microsite`);
  return found;
};

/** The Ravenswood homes, in the order the page shows them once sorted by drive. */
export const ravenswoodHomes = ["henrietta", "virginia"].map(home);

/** Who the drive is measured from, as the page prints it. */
export const fromLabel = (line: DriveFromHome): string =>
  line.originKind === "address" ? `${line.homeName}, from its street address` : `${line.homeName}, from the Ravenswood town centre`;

const [hospitalRow] = driveMatrix([HOSPITAL], ravenswoodHomes);
if (hospitalRow.drives.length !== ravenswoodHomes.length) {
  throw new Error(`_data/distances.json is missing a ${HOSPITAL} drive for one of ${ravenswoodHomes.map((entry) => entry.id).join(", ")}`);
}
/** One line per Ravenswood home, nearest first. */
export const hospitalDrives: DriveFromHome[] = hospitalRow.drives;
export const nearest: DriveFromHome = hospitalDrives[0];
export const hospitalLabel = hospitalRow.name;

const minutes = hospitalDrives.map((line) => line.minutes);
const driveRange = Math.min(...minutes) === Math.max(...minutes) ? `${minutes[0]}` : `${Math.min(...minutes)} to ${Math.max(...minutes)}`;

/**
 * Places around Ravenswood with a measured drive from both homes; a place without one is not listed.
 * Downtown Ravenswood is left out: it is the town-centre point Virginia Cottage is measured from, so
 * it has no drive of its own from that home.
 */
const areaIds = ["foodfair-ravenswood", "riverfront-park-ravenswood", "ravenswood-high-school", "i77-ravenswood"];
export const areaRows: DriveMatrixRow[] = driveMatrix(areaIds, ravenswoodHomes);
for (const row of areaRows) {
  if (row.drives.length !== ravenswoodHomes.length) throw new Error(`_data/distances.json is missing a ${row.destination} drive for a Ravenswood home`);
}

const measuredDates = [...new Set([...hospitalDrives, ...areaRows.flatMap((row) => row.drives)].map((line) => line.measured))].sort();
export const driveSource =
  `Routes from OpenStreetMap data (OSRM), measured ${measuredDates.map(formatMeasured).join(" and ")}. Henrietta Cottage is measured from its street address; Virginia Cottage has no published address, so it is measured from the Ravenswood town centre. Free-flow driving times; allow longer at shift change and in bad weather.`;

export const homePages = ravenswoodHomes.map((entry) => ({ id: entry.id, name: entry.name, href: homeHref(entry) }));

export const page = {
  title: "Housing Near Jackson General, Ripley, WV | Mt Cottages",
  description: `Travel nurse housing near Jackson General Hospital in Ripley, WV: two furnished homes in Ravenswood, ${driveRange} minutes away by measured drive.`,
  eyebrow: "WVU Medicine Jackson General Hospital, Ripley, WV",
  h1: "Housing near Jackson General Hospital in Ripley, WV",
  lede: `On a contract at Jackson General Hospital? Our nearest homes are in Ravenswood, on the Ohio River: Henrietta and Virginia Cottages, each about ${driveRange} minutes by car from the hospital in Ripley.`,
  intro: "The hospital is in Ripley, south of Ravenswood. Ravenswood is a small river town with a grocery store, a riverfront park and the interstate a few minutes from either home. This page gives the measured drive from each home, the everyday places around them, and what we confirm before you commit.",
  inquiryLabel: `Check dates for ${nearest.homeName}`,
} as const;

export const terms = {
  stated: hubTerms.stated,
  confirm: [...hubTerms.confirm.filter((item) => !/^Parking/.test(item)), "Parking at Henrietta and Virginia Cottages, which neither listing states yet"],
};

const hubFaq = (pattern: RegExp): Faq => {
  const found = hubFaqs.find((faq) => pattern.test(faq.q));
  if (!found) throw new Error(`The Jackson General page reuses a travel-nurse hub FAQ matching ${pattern}, which is gone`);
  return found;
};

export const faqs: Faq[] = [
  {
    q: "Is Jackson General Hospital in Ravenswood?",
    a: `No. Jackson General Hospital is in Ripley, West Virginia. Our nearest homes are in Ravenswood: ${hospitalDrives.map((line) => `${line.homeName} is about ${line.minutes} minutes (${line.miles.toFixed(1)} miles) away by car`).join(", and ")}.`,
  },
  {
    q: "What is near the homes in Ravenswood?",
    a: `From Henrietta Cottage the measured drives are short: ${areaRows.map((row) => { const line = row.drives.find((entry) => entry.homeId === "henrietta"); return line ? `${row.label} ${line.minutes} min` : ""; }).filter(Boolean).join(", ")}. We have not measured walking routes in Ravenswood, so ask us for the one you care about.`,
  },
  hubFaq(/13-week/),
  hubFaq(/sleep through the day/),
  {
    q: "Is internet included, and where do I park?",
    a: "Fiber-optic internet is listed for Virginia Cottage and is to be confirmed for Henrietta Cottage. Neither listing states the parking arrangement yet, so we confirm your space and the street rules before you commit.",
  },
  hubFaq(/scam/),
];
