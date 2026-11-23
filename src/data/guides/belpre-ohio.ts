/**
 * Town guide (#56): Belpre, Ohio, across the Ohio River from Parkersburg.
 * Targets the "furnished rentals belpre ohio" and "belpre ohio things to do"
 * rows of docs/marketing/keyword-universe.csv at /guides/belpre-ohio/. We have
 * no home in Belpre, so the guide says so and offers the Parkersburg homes a
 * bridge away.
 *
 * Drive times come from _data/distances.json through driveMatrix() (measured
 * to the point OpenStreetMap places the town at), the rent from
 * _data/area-stats.json (HUD), and each place links to the OpenStreetMap
 * element it was checked against on the published date. Charts only: no area
 * photo.
 */
import { homes } from "../homes";
import { driveMatrix, formatMeasured, type DriveFromHome, type DriveMatrixRow } from "../distances";
import { areaStats, formatDollars, rentArea, rentSizes } from "../areaStats";
import type { ChartSpec, GuidePlace } from "./types";
import type { GuideArticle } from "./types";

const parkersburgHomes = homes.filter((home) => home.town.slug === "parkersburg");
if (parkersburgHomes.length === 0) throw new Error("belpre-ohio: no Parkersburg homes");

const { fairMarketRent } = areaStats;
const county = rentArea("washington-county-oh");

const [toBelpre] = driveMatrix(["belpre-centre"], parkersburgHomes) as [DriveMatrixRow];
const drives = toBelpre.drives;
const addressed = drives.filter((drive) => drive.originKind === "address");
if (addressed.length === 0) throw new Error("belpre-ohio: no home with a published address has a measured drive to Belpre");
const nearest = addressed[0];
const fromLabel = (drive: DriveFromHome) => (drive.originKind === "address" ? drive.homeName : `${drive.homeName} (from the Parkersburg centre)`);
const measuredOn = formatMeasured(drives[0].measured);

const driveChart: ChartSpec = {
  id: "belpre-drives",
  title: "Drive times to Belpre from our Parkersburg homes",
  subtitle: "About this many minutes by car, with no traffic. Nearest home first.",
  valueHeading: "Drive",
  groups: [{
    label: toBelpre.label,
    bars: drives.map((drive) => ({ label: fromLabel(drive), value: drive.minutes, valueText: `${drive.minutes} min`, note: `${drive.miles} mi, measured ${formatMeasured(drive.measured)}` })),
  }],
  method: `Driving routes on OpenStreetMap roads from the public OSRM router, measured ${measuredOn}, to the point OpenStreetMap places the city of Belpre at, rounded up to the next whole minute. Homes without a published street address are measured from the Parkersburg town centre and labelled so.`,
  sourceLabel: "OSRM route data",
  sourceUrl: drives[0].sourceUrl,
};

const rentChart: ChartSpec = {
  id: "belpre-rent",
  title: `What an unfurnished rental costs in Washington County, Ohio, FY${fairMarketRent.fiscalYear}`,
  subtitle: "HUD Fair Market Rent per month, rent plus utilities, by bedroom count.",
  valueHeading: "Per month",
  groups: [{
    label: county.label,
    bars: county.rents.map((rent, size) => ({ label: rentSizes[size], value: rent, valueText: formatDollars(rent) })),
  }],
  method: `HUD's FY${fairMarketRent.fiscalYear} Fair Market Rents for Washington County, Ohio, which includes Belpre: the gross rent (rent plus tenant-paid utilities) of a standard-quality unfurnished rental, at the 40th percentile of recent movers' rents. Actual listings vary by street and condition.`,
  sourceLabel: fairMarketRent.source.label,
  sourceUrl: fairMarketRent.source.url,
};

const osm = (element: string) => `https://www.openstreetmap.org/${element}`;
const places: GuidePlace[] = [
  { name: "Mid-Ohio Railroad Museum", kind: "A railroad museum on Depot Street", url: osm("node/6373546493"), via: "OpenStreetMap" },
  { name: "Belpre Historical Society", kind: "The local history museum on Ridge Street", url: osm("way/752138376"), via: "OpenStreetMap" },
  { name: "Depot Park", kind: "A city park in Belpre", url: osm("way/680666244"), via: "OpenStreetMap" },
  { name: "Belpre Branch Library", kind: "The town's public library, on Washington Boulevard", url: osm("way/398072053"), via: "OpenStreetMap" },
  { name: "Kroger, Belpre", kind: "A supermarket on Washington Boulevard", url: osm("way/91547328"), via: "OpenStreetMap" },
  { name: "Belpre High School", kind: "The public high school, on Stone Road", url: osm("way/664035374"), via: "OpenStreetMap" },
];

const ABOUT = "https://en.wikipedia.org/wiki/Belpre,_Ohio";
const BRIDGE = osm("way/680628671");

export const belpreOhio: GuideArticle = {
  slug: "belpre-ohio",
  seoTitle: "Belpre, Ohio: Things to Do, Rentals, Drives",
  description: "Belpre, Ohio: the museums, park and library in town, what a rental costs in Washington County, and measured drives from our furnished Parkersburg homes.",
  h1: "Belpre, Ohio: things to do, rentals and our nearest homes",
  lede: "Belpre sits on the Ohio side of the river, across one bridge from Parkersburg. We have no home in Belpre itself, but our Parkersburg homes are a short drive away. Here is what is in town, what renting costs, and how far the drive is.",
  published: "2026-11-23",
  updated: "2026-11-23",
  towns: ["parkersburg"],
  topics: ["moving", "things-to-do"],
  audiences: ["relocation", "long-term"],
  homeIds: parkersburgHomes.map((home) => home.id),
  sections: [
    {
      id: "short-answer",
      heading: "Belpre in three lines",
      blocks: [
        {
          kind: "list",
          items: [
            "Belpre is a city in Washington County, Ohio, on the Ohio River across from Parkersburg, West Virginia.",
            `${nearest.homeName}, our nearest home with a published address, is about ${nearest.minutes} minutes from Belpre by car (${nearest.miles} miles).`,
            `HUD's Fair Market Rent for an unfurnished two-bedroom in Washington County, Ohio is ${formatDollars(county.rents[2])} a month, utilities included (FY${fairMarketRent.fiscalYear}).`,
          ],
        },
      ],
    },
    {
      id: "the-town",
      heading: "The town",
      blocks: [
        { kind: "p", text: "Belpre is a small Ohio city on the river, facing Parkersburg. Its name comes from \"Belle Prairie\", the name French trappers gave the valley before the first American settlement there. The Parkersburg–Belpre Bridge links the two downtowns, so for daily life Belpre and Parkersburg work as one place on two sides of a state line." },
      ],
    },
    {
      id: "things-to-do",
      heading: "Things to do in Belpre",
      blocks: [
        { kind: "places", places },
        { kind: "p", text: "Across the bridge, downtown Parkersburg has Point Park and the sternwheeler to Blennerhassett Island; our Blennerhassett Island guide has the season and tickets." },
      ],
    },
    {
      id: "rent",
      heading: "What renting costs",
      blocks: [
        { kind: "p", text: `Belpre is in Washington County, Ohio, which has its own HUD Fair Market Rent: ${formatDollars(county.rents[1])} a month for a one-bedroom and ${formatDollars(county.rents[2])} for a two-bedroom, rent plus utilities, unfurnished. It is a yardstick, not a listing price.` },
        { kind: "chart", chart: rentChart },
        { kind: "p", text: "For a long stay, an unfurnished lease is cheaper than a furnished month. A furnished home is for the weeks before you sign one: no furniture to buy or move, no utilities to set up, and time to see both sides of the river." },
      ],
    },
    {
      id: "nearest-homes",
      heading: "Our nearest homes",
      blocks: [
        { kind: "p", text: `Our Parkersburg homes are on the West Virginia side, a bridge away. ${nearest.homeName} is about ${nearest.minutes} minutes from Belpre, measured ${measuredOn}.` },
        { kind: "chart", chart: driveChart },
      ],
    },
    {
      id: "next-step",
      heading: "Next step",
      blocks: [
        { kind: "cta", heading: "Live a bridge away from Belpre while you settle in.", text: "Send your move-in date and where you will be working, and we will tell you which Parkersburg home fits and whether it is free." },
      ],
    },
  ],
  sources: [
    { label: "Belpre, Ohio (Wikipedia)", url: ABOUT },
    { label: "Parkersburg–Belpre Bridge (OpenStreetMap)", url: BRIDGE },
    { label: fairMarketRent.source.label, url: fairMarketRent.source.url },
    { label: "OSRM public router, driving profile (route data)", url: drives[0].sourceUrl },
    { label: "OpenStreetMap copyright and licence (ODbL 1.0)", url: "https://www.openstreetmap.org/copyright" },
  ],
};
