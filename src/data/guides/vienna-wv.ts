/**
 * Town guide (#55): Vienna, West Virginia, the city on Parkersburg's northern
 * edge. Targets the "apartments for rent vienna wv", "house for rent vienna wv"
 * and "furnished rentals vienna wv" rows of docs/marketing/keyword-universe.csv.
 * We have no home in Vienna, so the guide says so and offers the Parkersburg
 * homes a few minutes away.
 *
 * Every figure comes from a data file: population and Fair Market Rents from
 * _data/area-stats.json (Census Bureau and HUD, refreshed by
 * scripts/area-stats.mjs) and drive times from _data/distances.json through
 * driveMatrix(). Facts about the town cite the City of Vienna's own site.
 * Charts only: no area photo.
 */
import { homes } from "../homes";
import { driveMatrix, formatMeasured, type DriveFromHome } from "../distances";
import { areaStats, formatCount, formatDollars, percentChange, populationOf, rentArea, rentSizes } from "../areaStats";
import type { ChartSpec, GuideArticle } from "./types";

const parkersburgHomes = homes.filter((home) => home.town.slug === "parkersburg");
if (parkersburgHomes.length === 0) throw new Error("vienna-wv: no Parkersburg homes");

const { population, fairMarketRent } = areaStats;
const vienna = populationOf("vienna");
const parkersburg = populationOf("parkersburg");
const county = populationOf("wood-county");
const estimateYear = population.estimateDate.slice(0, 4);
const metro = rentArea("parkersburg-vienna");

const [toVienna] = driveMatrix(["vienna-centre"], parkersburgHomes);
const drives = toVienna.drives;
if (drives.length === 0) throw new Error("vienna-wv: no measured drive from a Parkersburg home to Vienna");
const addressed = drives.filter((drive) => drive.originKind === "address");
if (addressed.length === 0) throw new Error("vienna-wv: no home with a published address has a measured drive to Vienna");
const nearest = addressed[0];
const fromLabel = (drive: DriveFromHome) => (drive.originKind === "address" ? drive.homeName : `${drive.homeName} (from the Parkersburg centre)`);
const measuredOn = formatMeasured(drives[0].measured);

const populationChart: ChartSpec = {
  id: "vienna-population",
  title: "How many people live in Vienna, Parkersburg and Wood County",
  subtitle: `Resident population, Census Bureau estimate for July 1, ${estimateYear}.`,
  valueHeading: "Residents",
  groups: [{
    label: `July ${estimateYear} estimate`,
    bars: [county, parkersburg, vienna].map((place) => ({
      label: place.label,
      value: place.estimate,
      valueText: formatCount(place.estimate),
      note: `April 2020 estimates base ${formatCount(place.base2020)} (${percentChange(place.base2020, place.estimate)})`,
    })),
  }],
  method: `Vintage ${population.vintage} population estimates from the U.S. Census Bureau, for July 1, ${estimateYear}. Vienna and Parkersburg are separate cities inside Wood County; the county figure includes both.`,
  sourceLabel: population.source.label,
  sourceUrl: population.source.url,
};

const rentChart: ChartSpec = {
  id: "vienna-rent",
  title: `What an unfurnished rental costs around Vienna, FY${fairMarketRent.fiscalYear}`,
  subtitle: "HUD Fair Market Rent per month, rent plus utilities, by bedroom count.",
  valueHeading: "Per month",
  groups: [{
    label: metro.label,
    bars: metro.rents.map((rent, size) => ({ label: rentSizes[size], value: rent, valueText: formatDollars(rent) })),
  }],
  method: `HUD's FY${fairMarketRent.fiscalYear} Fair Market Rents for the Parkersburg-Vienna metro: the gross rent (rent plus tenant-paid utilities) of a standard-quality unfurnished rental, at the 40th percentile of recent movers' rents. HUD publishes one figure for the whole metro, so Vienna and Parkersburg share it. Actual listings vary by street and condition.`,
  sourceLabel: fairMarketRent.source.label,
  sourceUrl: fairMarketRent.source.url,
};

const driveChart: ChartSpec = {
  id: "vienna-drives",
  title: "Drive times to Vienna from our Parkersburg homes",
  subtitle: "About this many minutes by car, with no traffic. Nearest home first.",
  valueHeading: "Drive",
  groups: [{
    label: toVienna.label,
    bars: drives.map((drive) => ({ label: fromLabel(drive), value: drive.minutes, valueText: `${drive.minutes} min`, note: `${drive.miles} mi, measured ${formatMeasured(drive.measured)}` })),
  }],
  method: `Driving routes on OpenStreetMap roads from the public OSRM router, measured ${measuredOn}, to the point OpenStreetMap places the city of Vienna at, rounded up to the next whole minute. Homes without a published street address are measured from the Parkersburg town centre and labelled so.`,
  sourceLabel: "OSRM route data",
  sourceUrl: drives[0].sourceUrl,
};

const CITY = "https://www.vienna-wv.com/31/Community";
const BUS = "https://easyriderbus.com/routes-schedules/";
const MALL = "https://www.grandcentralmall.com/";
const SCHOOLS = "https://www.woodcountyschoolswv.com/";

export const viennaWv: GuideArticle = {
  slug: "vienna-wv",
  seoTitle: "Renting in Vienna, WV: Costs, Drives, Homes",
  description: "Renting in Vienna, WV: who lives there, what a rental costs, how far our furnished Parkersburg homes are, and how to get around, from official sources.",
  h1: "Renting in Vienna, West Virginia",
  lede: "Looking for a place to rent in Vienna? We have no home inside the city limits, but our Parkersburg homes are a few minutes' drive away. Here is Vienna in numbers, from official sources, and how a furnished month nearby can bridge the gap while you look.",
  published: "2026-11-23",
  updated: "2026-11-23",
  towns: ["parkersburg"],
  topics: ["moving"],
  audiences: ["relocation", "long-term"],
  homeIds: parkersburgHomes.map((home) => home.id),
  sections: [
    {
      id: "short-answer",
      heading: "Vienna in three numbers",
      blocks: [
        {
          kind: "list",
          items: [
            `${formatCount(vienna.estimate)} people live in the city of Vienna (Census Bureau estimate, July ${estimateYear}).`,
            `HUD's Fair Market Rent for an unfurnished two-bedroom in the Parkersburg-Vienna metro is ${formatDollars(metro.rents[2])} a month, utilities included (FY${fairMarketRent.fiscalYear}).`,
            `${nearest.homeName}, our nearest home with a published address, is about ${nearest.minutes} minutes from Vienna by car.`,
          ],
        },
      ],
    },
    {
      id: "the-town",
      heading: "The town",
      blocks: [
        { kind: "p", text: "Vienna is a city in Wood County, West Virginia, along the Ohio River and next to Parkersburg. It was incorporated in 1935, and the City of Vienna runs its own council, public works and services from the City Building." },
        { kind: "p", text: `The city's population was estimated at ${formatCount(vienna.estimate)} in July ${estimateYear}, ${percentChange(vienna.base2020, vienna.estimate)} since April 2020. Parkersburg, its larger neighbour to the south, had ${formatCount(parkersburg.estimate)}.` },
        { kind: "chart", chart: populationChart },
      ],
    },
    {
      id: "everyday-life",
      heading: "Shopping, buses and schools",
      blocks: [
        {
          kind: "list",
          items: [
            "Grand Central Mall, the area's large enclosed mall, is in Vienna.",
            "Easy Rider, the Mid-Ohio Valley Transit Authority's bus system, runs two routes named for Vienna, Vienna and Vienna 2. Check the current schedule before you rely on it for work.",
            "Public schools are run by Wood County Schools, which serves Vienna and Parkersburg alike. The district decides which school serves each address, so ask it before you sign a lease.",
          ],
        },
      ],
    },
    {
      id: "rent",
      heading: "What renting costs",
      blocks: [
        { kind: "p", text: `HUD sets one Fair Market Rent for the Parkersburg-Vienna metro: ${formatDollars(metro.rents[1])} a month for a one-bedroom and ${formatDollars(metro.rents[2])} for a two-bedroom, rent plus utilities, unfurnished. It is a yardstick, not a listing price.` },
        { kind: "chart", chart: rentChart },
        { kind: "p", text: "For a long stay, an unfurnished lease is cheaper than a furnished month. A furnished home is for the weeks before you sign one: there is no furniture to buy or move, no utilities to set up, and time to see the town before you commit." },
      ],
    },
    {
      id: "nearest-homes",
      heading: "Our nearest homes",
      blocks: [
        { kind: "p", text: `Our Parkersburg homes are south of Vienna, a short drive down the same side of the river. ${nearest.homeName} is about ${nearest.minutes} minutes away (${nearest.miles} miles), measured ${measuredOn}.` },
        { kind: "chart", chart: driveChart },
      ],
    },
    {
      id: "next-step",
      heading: "Next step",
      blocks: [
        { kind: "cta", heading: "Live a few minutes from Vienna while you find a place.", text: "Send your move-in date and where you will be working, and we will tell you which Parkersburg home fits and whether it is free." },
      ],
    },
  ],
  sources: [
    { label: "City of Vienna, West Virginia: community", url: CITY },
    { label: population.source.label, url: population.source.url },
    { label: fairMarketRent.source.label, url: fairMarketRent.source.url },
    { label: "Easy Rider (Mid-Ohio Valley Transit Authority): routes and schedules", url: BUS },
    { label: "Grand Central Mall", url: MALL },
    { label: "Wood County Schools", url: SCHOOLS },
    { label: "OSRM public router, driving profile (route data)", url: drives[0].sourceUrl },
    { label: "OpenStreetMap copyright and licence (ODbL 1.0)", url: "https://www.openstreetmap.org/copyright" },
  ],
};
