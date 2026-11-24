/**
 * Town guide (#56): Ripley, West Virginia, the Jackson County seat and home of
 * Jackson General Hospital. Covers the Ripley rows of
 * docs/marketing/keyword-universe.csv alongside the Jackson General landing
 * (/travel-nurses/jackson-general/), which the guide links. We have no home
 * in Ripley, so the guide offers the Ravenswood homes up US 33.
 *
 * Drive times come from _data/distances.json through driveMatrix(), the rent
 * from _data/area-stats.json (HUD), and each place links to the OpenStreetMap
 * element it was checked against. Charts only: no area photo.
 */
import { homes } from "../homes";
import { ravenswoodNearby } from "../homes/towns";
import { driveMatrix, formatMeasured, type DriveFromHome, type DriveMatrixRow } from "../distances";
import { areaStats, formatDollars, rentArea, rentSizes } from "../areaStats";
import type { ChartSpec, GuidePlace } from "./types";
import type { GuideArticle } from "./types";

const ravenswoodHomes = homes.filter((home) => home.town.slug === "ravenswood");
if (ravenswoodHomes.length === 0) throw new Error("ripley-wv: no Ravenswood homes");

const { fairMarketRent } = areaStats;
const county = rentArea("jackson-county-wv");

const matrix = driveMatrix(["ripley-centre", "jackson-general", "ripley-high-school"], ravenswoodHomes);
for (const row of matrix) if (row.drives.length === 0) throw new Error(`ripley-wv: no measured drive to ${row.destination}`);
const toRipley = matrix[0] as DriveMatrixRow;
const addressed = toRipley.drives.filter((drive) => drive.originKind === "address");
if (addressed.length === 0) throw new Error("ripley-wv: no home with a published address has a measured drive to Ripley");
const nearest = addressed[0];
const hospital = (matrix[1] as DriveMatrixRow).drives.find((drive) => drive.homeId === nearest.homeId);
if (!hospital) throw new Error("ripley-wv: no measured drive from the nearest home to Jackson General");
const fromLabel = (drive: DriveFromHome) => (drive.originKind === "address" ? drive.homeName : `${drive.homeName} (from the Ravenswood centre)`);
const dates = [...new Set(matrix.flatMap((row) => row.drives.map((drive) => drive.measured)))].sort();
const measuredText = dates.length === 1 ? formatMeasured(dates[0] as string) : `${formatMeasured(dates[0] as string)} to ${formatMeasured(dates.at(-1) as string)}`;

const driveChart: ChartSpec = {
  id: "ripley-drives",
  title: "Drive times to Ripley from our Ravenswood homes",
  subtitle: "About this many minutes by car, with no traffic. Nearest home first.",
  valueHeading: "Drive",
  groups: matrix.map((row) => ({
    label: row.label,
    bars: row.drives.map((drive) => ({ label: fromLabel(drive), value: drive.minutes, valueText: `${drive.minutes} min`, note: `${drive.miles} mi, measured ${formatMeasured(drive.measured)}` })),
  })),
  method: `Driving routes on OpenStreetMap roads from the public OSRM router, measured ${measuredText}, rounded up to the next whole minute. Ripley itself is measured to the point OpenStreetMap places the city at. Virginia Cottage's street address is not published, so its times are measured from the Ravenswood town centre and labelled so.`,
  sourceLabel: "OSRM route data",
  sourceUrl: toRipley.drives[0]!.sourceUrl,
};

const rentChart: ChartSpec = {
  id: "ripley-rent",
  title: `What an unfurnished rental costs in Jackson County, WV, FY${fairMarketRent.fiscalYear}`,
  subtitle: "HUD Fair Market Rent per month, rent plus utilities, by bedroom count.",
  valueHeading: "Per month",
  groups: [{
    label: county.label,
    bars: county.rents.map((rent, size) => ({ label: rentSizes[size], value: rent, valueText: formatDollars(rent) })),
  }],
  method: `HUD's FY${fairMarketRent.fiscalYear} Fair Market Rents for Jackson County, West Virginia, which includes Ripley and Ravenswood: the gross rent (rent plus tenant-paid utilities) of a standard-quality unfurnished rental, at the 40th percentile of recent movers' rents. Actual listings vary by street and condition.`,
  sourceLabel: fairMarketRent.source.label,
  sourceUrl: fairMarketRent.source.url,
};

const osm = (element: string) => `https://www.openstreetmap.org/${element}`;
const shared = (name: string): GuidePlace => {
  const place = ravenswoodNearby.find((candidate) => candidate.name === name);
  if (!place?.source) throw new Error(`ripley-wv: ${name} is not in ravenswoodNearby with a source`);
  return { name: place.name, kind: place.note, url: place.source, via: "OpenStreetMap" };
};
const places: GuidePlace[] = [
  shared("Jackson General Hospital"),
  { name: "Jackson County Courthouse", kind: "The county courthouse, on Court Street North", url: osm("way/391140598"), via: "OpenStreetMap" },
  { name: "Jackson County Public Library", kind: "The county's public library, on North Church Street", url: osm("way/391140597"), via: "OpenStreetMap" },
  { name: "Ripley High School", kind: "The public high school, on School Street", url: osm("node/356530073"), via: "OpenStreetMap" },
  shared("Walmart Supercenter"),
  shared("Cedar Lakes Conference Center"),
];

const ABOUT = "https://en.wikipedia.org/wiki/Ripley,_West_Virginia";

export const ripleyWv: GuideArticle = {
  slug: "ripley-wv",
  seoTitle: "Ripley, WV: Jackson General, Rentals, Drives",
  description: "Ripley, WV: the county seat, Jackson General Hospital, what a rental costs in Jackson County, and measured drives from our furnished Ravenswood homes.",
  h1: "Ripley, West Virginia: the hospital, rentals and our nearest homes",
  lede: "Ripley is the Jackson County seat and home of Jackson General Hospital. We have no home in Ripley itself, but our two Ravenswood homes are a short drive up the road. Here is what is in town, what renting costs, and how far the drives are.",
  published: "2026-11-23",
  updated: "2026-11-23",
  towns: ["ravenswood"],
  topics: ["moving", "healthcare"],
  audiences: ["healthcare", "relocation", "long-term"],
  homeIds: ravenswoodHomes.map((home) => home.id),
  sections: [
    {
      id: "short-answer",
      heading: "Ripley in three lines",
      blocks: [
        {
          kind: "list",
          items: [
            "Ripley is a city in West Virginia and the county seat of Jackson County.",
            `${nearest.homeName}, our nearest home with a published address, is about ${nearest.minutes} minutes from Ripley by car, and about ${hospital.minutes} minutes from Jackson General Hospital.`,
            `HUD's Fair Market Rent for an unfurnished two-bedroom in Jackson County is ${formatDollars(county.rents[2])} a month, utilities included (FY${fairMarketRent.fiscalYear}).`,
          ],
        },
      ],
    },
    {
      id: "the-town",
      heading: "The town",
      blocks: [
        { kind: "p", text: "Ripley is the seat of Jackson County, with the county courthouse and the county's main public library in town. Jackson General Hospital, a WVU Medicine facility, is on Pinnell Street. Ravenswood, the county's river town, is to the north along US 33 and WV 2." },
        { kind: "p", text: "Starting an assignment at Jackson General? Our Jackson General page has the drives from each Ravenswood home to the hospital and what a 13-week stay includes." },
      ],
    },
    {
      id: "in-town",
      heading: "What is in Ripley",
      blocks: [{ kind: "places", places }],
    },
    {
      id: "rent",
      heading: "What renting costs",
      blocks: [
        { kind: "p", text: `Jackson County has its own HUD Fair Market Rent: ${formatDollars(county.rents[1])} a month for a one-bedroom and ${formatDollars(county.rents[2])} for a two-bedroom, rent plus utilities, unfurnished. It is a yardstick, not a listing price.` },
        { kind: "chart", chart: rentChart },
      ],
    },
    {
      id: "nearest-homes",
      heading: "Our nearest homes",
      blocks: [
        { kind: "p", text: `Henrietta and Virginia Cottages are in Ravenswood, north of Ripley. ${nearest.homeName} is about ${nearest.minutes} minutes from Ripley (${nearest.miles} miles).` },
        { kind: "chart", chart: driveChart },
      ],
    },
    {
      id: "next-step",
      heading: "Next step",
      blocks: [
        { kind: "cta", heading: "Stay in Ravenswood, a short drive from Ripley.", text: "Send your start date and where you will be working, and we will tell you which Ravenswood home fits and whether it is free." },
      ],
    },
  ],
  sources: [
    { label: "Ripley, West Virginia (Wikipedia)", url: ABOUT },
    { label: fairMarketRent.source.label, url: fairMarketRent.source.url },
    { label: "OSRM public router, driving profile (route data)", url: toRipley.drives[0]!.sourceUrl },
    { label: "OpenStreetMap copyright and licence (ODbL 1.0)", url: "https://www.openstreetmap.org/copyright" },
  ],
};
