/**
 * Town guide (#55): Williamstown, West Virginia, across the Ohio River from
 * Marietta, Ohio. Targets the "williamstown wv furnished rental" row of
 * docs/marketing/keyword-universe.csv. We have no home in Williamstown, so the
 * guide says so and offers Frederick Cottage across the river and the
 * Parkersburg homes down the valley.
 *
 * Every figure comes from a data file: population and Fair Market Rents from
 * _data/area-stats.json (Census Bureau and HUD, refreshed by
 * scripts/area-stats.mjs) and drive times from _data/distances.json through
 * driveMatrix(). Facts about the town cite the City of Williamstown's own
 * site. Charts only: no area photo.
 */
import { homes } from "../homes";
import { driveMatrix, formatMeasured, type DriveFromHome } from "../distances";
import { areaStats, formatCount, formatDollars, percentChange, populationOf, rentArea, rentSizes } from "../areaStats";
import type { ChartSpec, GuideArticle } from "./types";

const nearbyHomes = homes.filter((home) => home.town.slug === "marietta" || home.town.slug === "parkersburg");
if (!nearbyHomes.some((home) => home.town.slug === "marietta")) throw new Error("williamstown-wv: no Marietta home");

const { population, fairMarketRent } = areaStats;
const williamstown = populationOf("williamstown");
const county = populationOf("wood-county");
const estimateYear = population.estimateDate.slice(0, 4);
const metro = rentArea("parkersburg-vienna");
const washington = rentArea("washington-county-oh");

const [toWilliamstown] = driveMatrix(["williamstown-centre"], nearbyHomes);
const drives = toWilliamstown.drives;
const addressed = drives.filter((drive) => drive.originKind === "address");
if (addressed.length === 0) throw new Error("williamstown-wv: no home with a published address has a measured drive to Williamstown");
const nearest = addressed[0];
const fromLabel = (drive: DriveFromHome) => (drive.originKind === "address" ? drive.homeName : `${drive.homeName} (from the Parkersburg centre)`);
const measuredOn = formatMeasured(drives[0].measured);

const populationChart: ChartSpec = {
  id: "williamstown-population",
  title: "How many people live in Williamstown and Wood County",
  subtitle: `Resident population, Census Bureau estimate for July 1, ${estimateYear}.`,
  valueHeading: "Residents",
  groups: [{
    label: `July ${estimateYear} estimate`,
    bars: [county, williamstown].map((place) => ({
      label: place.label,
      value: place.estimate,
      valueText: formatCount(place.estimate),
      note: `April 2020 estimates base ${formatCount(place.base2020)} (${percentChange(place.base2020, place.estimate)})`,
    })),
  }],
  method: `Vintage ${population.vintage} population estimates from the U.S. Census Bureau, for July 1, ${estimateYear}. Williamstown is a city inside Wood County; the county figure includes it.`,
  sourceLabel: population.source.label,
  sourceUrl: population.source.url,
};

const rentChart: ChartSpec = {
  id: "williamstown-rent",
  title: `What an unfurnished rental costs on each bank, FY${fairMarketRent.fiscalYear}`,
  subtitle: "HUD Fair Market Rent per month, rent plus utilities, by bedroom count.",
  valueHeading: "Per month",
  groups: [metro, washington].map((area) => ({
    label: area.label,
    bars: area.rents.map((rent, size) => ({ label: rentSizes[size], value: rent, valueText: formatDollars(rent) })),
  })),
  method: `HUD's FY${fairMarketRent.fiscalYear} Fair Market Rents: the gross rent (rent plus tenant-paid utilities) of a standard-quality unfurnished rental, at the 40th percentile of recent movers' rents. Williamstown is in Wood County, so it falls in the Parkersburg-Vienna metro figure; Washington County, Ohio is Marietta, across the river. Actual listings vary by street and condition.`,
  sourceLabel: fairMarketRent.source.label,
  sourceUrl: fairMarketRent.source.url,
};

const driveChart: ChartSpec = {
  id: "williamstown-drives",
  title: "Drive times to Williamstown from our homes",
  subtitle: "About this many minutes by car, with no traffic. Nearest home first.",
  valueHeading: "Drive",
  groups: [{
    label: toWilliamstown.label,
    bars: drives.map((drive) => ({ label: fromLabel(drive), value: drive.minutes, valueText: `${drive.minutes} min`, note: `${drive.miles} mi, measured ${formatMeasured(drive.measured)}` })),
  }],
  method: `Driving routes on OpenStreetMap roads from the public OSRM router, measured ${measuredOn}, to the point OpenStreetMap places the city of Williamstown at, rounded up to the next whole minute. Homes without a published street address are measured from the Parkersburg town centre and labelled so.`,
  sourceLabel: "OSRM route data",
  sourceUrl: drives[0].sourceUrl,
};

const CITY = "https://williamstownwv.org/";
const BEE_CITY = "https://williamstownwv.org/wv-bee-city-usa";
const SCHOOLS = "https://www.woodcountyschoolswv.com/";

export const williamstownWv: GuideArticle = {
  slug: "williamstown-wv",
  seoTitle: "Renting near Williamstown, WV: Costs, Drives",
  description: "Furnished rentals near Williamstown, WV: the town in numbers, rent on both banks of the Ohio, and how far our Marietta and Parkersburg homes are.",
  h1: "Renting near Williamstown, West Virginia",
  lede: "Williamstown sits on the West Virginia bank of the Ohio River, facing Marietta, Ohio. We have no home in Williamstown itself, but Frederick Cottage in Marietta is minutes away across the river. Here is the town in numbers, from official sources.",
  published: "2026-11-23",
  updated: "2026-11-23",
  towns: ["marietta", "parkersburg"],
  topics: ["moving"],
  audiences: ["relocation", "long-term"],
  homeIds: nearbyHomes.map((home) => home.id),
  sections: [
    {
      id: "short-answer",
      heading: "Williamstown in three numbers",
      blocks: [
        {
          kind: "list",
          items: [
            `${formatCount(williamstown.estimate)} people live in the city of Williamstown (Census Bureau estimate, July ${estimateYear}).`,
            `HUD's Fair Market Rent for an unfurnished two-bedroom is ${formatDollars(metro.rents[2])} a month in Wood County and ${formatDollars(washington.rents[2])} across the river in Washington County, Ohio (FY${fairMarketRent.fiscalYear}).`,
            `${nearest.homeName} is about ${nearest.minutes} minutes from Williamstown by car (${nearest.miles} miles).`,
          ],
        },
      ],
    },
    {
      id: "the-town",
      heading: "The town",
      blocks: [
        { kind: "p", text: "Williamstown is a city in Wood County, West Virginia, along the Ohio River, and part of the Parkersburg-Marietta-Vienna metropolitan area. Marietta, Ohio is directly across the river, so daily life here runs on both banks." },
        { kind: "p", text: `The city's population was estimated at ${formatCount(williamstown.estimate)} in July ${estimateYear}, ${percentChange(williamstown.base2020, williamstown.estimate)} since April 2020.` },
        { kind: "chart", chart: populationChart },
        { kind: "p", text: "The city is a Bee City USA affiliate: the city has passed a Bee City resolution to protect pollinators, and its site links a list of West Virginia native plants for local gardens." },
      ],
    },
    {
      id: "schools",
      heading: "Schools",
      blocks: [
        { kind: "p", text: "Public schools in Williamstown are run by Wood County Schools, the same district as Parkersburg and Vienna. Across the river, Marietta is in Ohio and has its own districts. The district decides which school serves each address, so ask it before you sign a lease." },
      ],
    },
    {
      id: "rent",
      heading: "What renting costs on each bank",
      blocks: [
        { kind: "p", text: `Williamstown is in the Parkersburg-Vienna metro, where HUD's Fair Market Rent for a one-bedroom is ${formatDollars(metro.rents[1])} a month. Across the river in Washington County, Ohio it is ${formatDollars(washington.rents[1])}. Both are rent plus utilities, unfurnished: a yardstick, not a listing price.` },
        { kind: "chart", chart: rentChart },
        { kind: "p", text: "For a long stay, an unfurnished lease is cheaper than a furnished month. A furnished home is for the weeks before you sign one: there is no furniture to buy or move, no utilities to set up, and time to see both banks before you commit." },
      ],
    },
    {
      id: "nearest-homes",
      heading: "Our nearest homes",
      blocks: [
        { kind: "p", text: `${nearest.homeName} in Marietta, Ohio is our nearest home, about ${nearest.minutes} minutes from Williamstown across the river. Our Parkersburg homes are down the valley on the West Virginia side.` },
        { kind: "chart", chart: driveChart },
      ],
    },
    {
      id: "next-step",
      heading: "Next step",
      blocks: [
        { kind: "cta", heading: "Stay across the river from Williamstown while you find a place.", text: "Send your move-in date and where you will be working, and we will tell you which home fits and whether it is free." },
      ],
    },
  ],
  sources: [
    { label: "City of Williamstown, West Virginia", url: CITY },
    { label: "City of Williamstown: Bee City USA", url: BEE_CITY },
    { label: population.source.label, url: population.source.url },
    { label: fairMarketRent.source.label, url: fairMarketRent.source.url },
    { label: "Wood County Schools", url: SCHOOLS },
    { label: "OSRM public router, driving profile (route data)", url: drives[0].sourceUrl },
    { label: "OpenStreetMap copyright and licence (ODbL 1.0)", url: "https://www.openstreetmap.org/copyright" },
  ],
};
