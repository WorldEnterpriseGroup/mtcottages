/**
 * The insurance displacement and ALE housing hub (#42): /insurance-housing/
 * for persona P3, a household displaced by a fire, flood or storm whose
 * insurer's additional living expense (ALE) coverage pays for a temporary
 * home, and for the adjusters and housing coordinators who arrange it. It
 * re-targets the old generic /insurance-housing.html guide, which now
 * redirects here (src/pages/insurance-housing.html.ts), and targets the
 * insurance rows of docs/marketing/keyword-universe.csv. It is written in the
 * guide content model, like the long-term hub (src/data/longTermHub.ts).
 *
 * Decided on #70 (2026-11-16, recorded on #42): the page runs on the existing
 * payment flow. Rules the page keeps:
 * - No direct billing to insurers is offered or implied; direct billing is a
 *   new billing path kept for the CEO.
 * - No promise on how soon a household can move in.
 * - Terms and capacity are the corporate hub's own rows
 *   (src/data/corporateHousing.ts, from src/data/terms.json and each home's
 *   facts), so the two pages cannot disagree; anything unconfirmed says so.
 * - Every drive is read from _data/distances.json through driveMatrix().
 * - An inquiry is not a coverage decision: only the insurer decides coverage.
 */
import { homes } from "./homes";
import { driveMatrix, formatMeasured, type DriveFromHome } from "./distances";
import { capacityRows, statedTerms, type CapacityRow } from "./corporateHousing";
import { validateArticles, type ChartSpec, type GuideArticle } from "./guides";

export const hubHref = "/insurance-housing/";
export const adjusterSummaryHref = "/insurance-housing/adjuster-summary/";
export const hubAudience = "insurance" as const;

const PUBLISHED = "2026-11-23";

/** Each town's public high school, measured from the homes in that town. */
const SCHOOLS = ["marietta-high-school", "parkersburg-high-school", "parkersburg-south-high-school", "ravenswood-high-school"];

const townOf = (homeId: string): string => {
  const home = homes.find((entry) => entry.id === homeId);
  if (!home) throw new Error(`insuranceHub: "${homeId}" has no live home microsite`);
  return home.town.name;
};

/** The same town's homes only: a displaced family looks near its own school. */
const schoolRows = driveMatrix(SCHOOLS, homes).map((row) => {
  const town = row.drives.length > 0 ? townOf(row.drives[0].homeId) : "";
  return { ...row, drives: row.drives.filter((drive) => townOf(drive.homeId) === town) };
});
const missing = schoolRows.filter((row) => row.drives.length === 0).map((row) => row.destination);
if (missing.length > 0) throw new Error(`insuranceHub: no measured drive from a home to ${missing.join(", ")}`);

const fromLabel = (drive: DriveFromHome) => (drive.originKind === "address" ? drive.homeName : `${drive.homeName} (from the town centre)`);
const dates = [...new Set(schoolRows.flatMap((row) => row.drives.map((drive) => drive.measured)))].sort();
const measuredText = dates.length === 1 ? formatMeasured(dates[0]) : `${formatMeasured(dates[0])} to ${formatMeasured(dates.at(-1) as string)}`;

const schoolChart: ChartSpec = {
  id: "insurance-school-drives",
  title: "Drive times from our homes to the local high school",
  subtitle: "About this many minutes by car, with no traffic. Nearest home first.",
  valueHeading: "Drive",
  groups: schoolRows.map((row) => ({
    label: row.label,
    bars: row.drives.map((drive) => ({ label: fromLabel(drive), value: drive.minutes, valueText: `${drive.minutes} min`, note: `${drive.miles} mi, measured ${formatMeasured(drive.measured)}` })),
  })),
  method: `Driving routes on OpenStreetMap roads from the public OSRM router, measured ${measuredText}, rounded up to the next whole minute. Homes without a published street address are measured from their town centre and labelled so.`,
  sourceLabel: "OSRM route data",
  sourceUrl: schoolRows[0].drives[0].sourceUrl,
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** One line per home: its town, bedrooms and beds, and how many it sleeps, or that it is confirmed on inquiry. */
export const householdLine = (row: CapacityRow): string =>
  `${row.name}, ${row.town}: ${plural(row.bedrooms, "bedroom")}${row.beds ? ` (${row.beds.toLowerCase()})` : ""}; ${row.sleeps.confirmed ? row.sleeps.text.toLowerCase() : "how many it sleeps is confirmed on inquiry"}.`;

/** The steps, shared by the hub and the adjuster summary. */
export const steps: string[] = [
  "Check your policy's additional living expense (ALE) or loss-of-use coverage with your adjuster. Only your insurer decides what it covers, and an inquiry here is not a coverage decision.",
  "Send an inquiry: the town or school you need to stay near, who is coming, and the repair timeline your adjuster expects. You can send it, or the person your insurer authorizes can. The form never asks for payment, a Social Security number or bank details.",
  "We reply with the homes that fit and the first date each is free, and we confirm the home, the dates and the monthly rate in writing, so your adjuster has them for the claim.",
  "Payment goes through the same flow every Mt Cottages stay uses, which runs through Furnished Finder and KeyCheck: month to month, or with three months paid. We do not bill insurance companies directly, so ask your adjuster how your policy pays for it.",
];

/** Said plainly, because a displaced household plans around it. */
export const moveInNote = "We make no promise on how soon you can move in: it depends on which home is free for your dates, and we tell you that date when we reply.";

export const insuranceHub: GuideArticle = {
  slug: "insurance-housing",
  seoTitle: "Temporary Housing for Insurance Claims (ALE)",
  description: "Furnished homes in Parkersburg, Ravenswood and Marietta, Ohio for families displaced by a fire, flood or storm: how ALE claims work, terms and school drives.",
  h1: "Temporary furnished housing after a fire, flood or covered loss",
  lede: "If a fire, flood or storm has made your home unlivable, a furnished house nearby can keep school, work and family routines going while it is repaired. Here is how a stay works with your insurer's additional living expense (ALE) coverage, our terms, and which homes fit your household.",
  published: PUBLISHED,
  updated: PUBLISHED,
  towns: ["marietta", "parkersburg", "ravenswood"],
  topics: ["family", "moving"],
  audiences: [hubAudience],
  homeIds: homes.map((home) => home.id),
  sections: [
    {
      id: "how-it-works",
      heading: "How a stay works with your insurer",
      blocks: [
        { kind: "list", items: steps },
        { kind: "p", text: moveInNote },
      ],
    },
    {
      id: "terms",
      heading: "Our terms, for you and your adjuster",
      blocks: [
        { kind: "list", items: statedTerms },
        { kind: "p", text: "What a stay includes and costs is the same for an insurance stay as for any other. Your lease sets what happens if repairs finish early or run long, and we share it before you commit." },
      ],
    },
    {
      id: "household",
      heading: "Room for the whole household",
      blocks: [
        { kind: "p", text: "Every home is a whole furnished house with a full kitchen, so a family keeps its meals, laundry and homework together. Each line is read from the home's own listing." },
        { kind: "list", items: capacityRows.map(householdLine) },
      ],
    },
    {
      id: "schools",
      heading: "Staying near your children's school",
      blocks: [
        { kind: "p", text: "A temporary home in your own town can keep your children at their school. Ask your school district whether they can stay at their current school while you are displaced: the district decides, not us." },
        { kind: "chart", chart: schoolChart },
      ],
    },
    {
      id: "next-step",
      heading: "Next step",
      blocks: [{ kind: "cta", heading: "Tell us where you need to be.", text: "Send the town or school you need to stay near, who is coming and your adjuster's repair timeline, and we tell you which home fits and when it is free." }],
    },
  ],
  sources: [
    { label: "OSRM public router, driving profile (route data)", url: schoolChart.sourceUrl },
    { label: "OpenStreetMap copyright and licence (ODbL 1.0)", url: "https://www.openstreetmap.org/copyright" },
  ],
};

const problems = validateArticles([insuranceHub]);
if (problems.length > 0) throw new Error(`src/data/insuranceHub.ts is invalid:\n${problems.join("\n")}`);

/** The printable one-page summary for adjusters and housing coordinators. */
export const adjusterSummary = {
  seoTitle: "Insurance Housing Summary for Adjusters",
  description: "A one-page summary for adjusters and housing coordinators: Mt Cottages furnished homes, household sizes, terms and how to request a temporary home.",
  h1: "Furnished housing for insurance claims: a one-page summary",
  intro: "Mt Cottages rents whole furnished houses by the month in Parkersburg and Ravenswood, WV and Marietta, Ohio. This page is meant to be printed or saved as a PDF for a claim file.",
} as const;
