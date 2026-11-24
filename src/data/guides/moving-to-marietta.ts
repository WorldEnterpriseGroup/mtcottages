/**
 * Relocation guide (#49): moving to Marietta, Ohio, with Frederick Cottage as
 * the landing home. Targets the "moving to marietta ohio" and Marietta schools
 * rows of docs/marketing/keyword-universe.csv, for persona P4 (relocating
 * families and new hires). It always says Marietta, Ohio.
 *
 * Every figure comes from a data file: population and Fair Market Rents from
 * _data/area-stats.json (Census Bureau and HUD files, refreshed by
 * scripts/area-stats.mjs), drive and walk times from _data/distances.json
 * (driveMatrix and measuredWalk). The prose quotes those values through
 * template strings, so nothing is typed by hand. Charts and diagrams only: no
 * area photo. Washington County publishes no machine-readable employer list,
 * so the page names the large institutions without head counts.
 */
import { homes } from "../homes";
import { driveMatrix, formatMeasured, measuredWalk, type MeasuredRoute } from "../distances";
import { areaStats, formatCount, formatDollars, percentChange, populationOf, rentArea, rentSizes } from "../areaStats";
import { publishedLuxuryFurnishedRates } from "../site";
import type { ChartBar, ChartSpec, GuideArticle } from "./types";

const frederick = homes.find((home) => home.id === "frederick");
if (!frederick) throw new Error("moving-to-marietta: no Frederick Cottage in src/data/homes");
const mariettaHomes = homes.filter((home) => home.town.slug === "marietta");

// Population (Census Bureau estimates).
const { population, fairMarketRent } = areaStats;
const city = populationOf("marietta");
const county = populationOf("washington-county-oh");
const estimateYear = population.estimateDate.slice(0, 4);

const populationChart: ChartSpec = {
  id: "marietta-population",
  title: "How many people live in Marietta and Washington County, Ohio",
  subtitle: `Resident population, Census Bureau estimate for July 1, ${estimateYear}.`,
  valueHeading: "Residents",
  groups: [{
    label: `July ${estimateYear} estimate`,
    bars: [county, city].map((place) => ({
      label: place.label,
      value: place.estimate,
      valueText: formatCount(place.estimate),
      note: `April 2020 estimates base ${formatCount(place.base2020)} (${percentChange(place.base2020, place.estimate)})`,
    })),
  }],
  method: `Vintage ${population.vintage} population estimates from the U.S. Census Bureau, for July 1, ${estimateYear}, compared with the April 1, 2020 estimates base. Marietta is the county seat of Washington County, Ohio; the county figure includes the city.`,
  sourceLabel: population.source.label,
  sourceUrl: population.source.url,
};

// Housing costs (HUD Fair Market Rents), with Parkersburg across the river for comparison.
const washington = rentArea("washington-county-oh");
const parkersburgMetro = rentArea("parkersburg-vienna");
const rentChart: ChartSpec = {
  id: "marietta-fair-market-rent",
  title: `What an unfurnished rental costs, FY${fairMarketRent.fiscalYear}`,
  subtitle: "HUD Fair Market Rent per month, rent plus utilities, by bedroom count.",
  valueHeading: "Per month",
  groups: [washington, parkersburgMetro].map((area) => ({
    label: area.label,
    bars: area.rents.map((rent, size) => ({ label: rentSizes[size], value: rent, valueText: formatDollars(rent) })),
  })),
  method: `HUD sets a Fair Market Rent for each area every year: the gross rent (rent plus tenant-paid utilities) of a standard-quality, unfurnished rental, at the 40th percentile of recent movers' rents. These are the FY${fairMarketRent.fiscalYear} figures for Washington County, Ohio, and, across the river, the Parkersburg-Vienna metro. Actual listings vary by street and condition.`,
  sourceLabel: fairMarketRent.source.label,
  sourceUrl: fairMarketRent.source.url,
};

// Drives from Frederick Cottage (measured).
const DRIVES = [
  "kroger-acme-marietta",
  "i77-marietta",
  "marietta-college",
  "selby-general",
  "washington-state-cc",
  "downtown-marietta",
  "marietta-high-school",
  "marietta-memorial",
  "camden-clark",
  "chemours-washington-works",
] as const;
const driveRows = driveMatrix([...DRIVES], [frederick]).map((row) => {
  const drive = row.drives.find((candidate) => candidate.homeId === "frederick" && candidate.originKind === "address");
  if (!drive) throw new Error(`moving-to-marietta: no measured drive from Frederick Cottage to ${row.destination}`);
  return { id: row.destination, label: row.label, drive };
});
const driveTo = (id: (typeof DRIVES)[number]) => {
  const found = driveRows.find((row) => row.id === id);
  if (!found) throw new Error(`moving-to-marietta: no drive row for ${id}`);
  return found.drive;
};
const measuredDates = [...new Set(driveRows.map((row) => row.drive.measured))].sort();
const measuredText = measuredDates.length === 1 ? formatMeasured(measuredDates[0]) : `${formatMeasured(measuredDates[0])} to ${formatMeasured(measuredDates.at(-1) as string)}`;
const driveSource = driveRows[0].drive.sourceUrl;

const minutesBar = (label: string, route: MeasuredRoute): ChartBar => ({
  label,
  value: route.minutes,
  valueText: `${route.minutes} min`,
  note: `${route.miles} mi, measured ${formatMeasured(route.measured)}`,
});

const driveChart: ChartSpec = {
  id: "frederick-drives",
  title: "Drive times from Frederick Cottage",
  subtitle: "About this many minutes by car, with no traffic. Nearest first.",
  valueHeading: "Drive",
  groups: [{
    label: "From Frederick Cottage, Marietta, Ohio",
    bars: [...driveRows].sort((a, b) => a.drive.minutes - b.drive.minutes).map((row) => minutesBar(row.label, row.drive)),
  }],
  method: `Driving routes on OpenStreetMap roads from the public OSRM router, from Frederick Cottage's published address, measured ${measuredText}, rounded up to the next whole minute.`,
  sourceLabel: "OSRM route data",
  sourceUrl: driveSource,
};

// Walks from Frederick Cottage (measured only where a route was measured).
const WALKS = [
  { id: "marietta-college", label: "Marietta College" },
  { id: "downtown-marietta", label: "Downtown Marietta" },
  { id: "marietta-memorial", label: "Marietta Memorial Hospital" },
] as const;
const walks = WALKS.map((walk) => ({ ...walk, route: measuredWalk("frederick", walk.id) }));
const walkTo = (id: (typeof WALKS)[number]["id"]) => {
  const found = walks.find((walk) => walk.id === id);
  if (!found) throw new Error(`moving-to-marietta: no walk row for ${id}`);
  return found.route;
};
const walkChart: ChartSpec = {
  id: "frederick-walks",
  title: "Walking from Frederick Cottage",
  subtitle: "About this many minutes on foot. Nearest first.",
  valueHeading: "Walk",
  groups: [{
    label: "On foot from Frederick Cottage",
    bars: [...walks].sort((a, b) => a.route.minutes - b.route.minutes).map((walk) => minutesBar(walk.label, walk.route)),
  }],
  method: "Walking routes on OpenStreetMap paths and streets from the public OSRM router's foot profile, from Frederick Cottage's published address, rounded up to the next whole minute.",
  sourceLabel: "OSRM route data (foot profile)",
  sourceUrl: walks[0].route.sourceUrl,
};

const range = (route: MeasuredRoute) => `about ${route.minutes} min`;

export const movingToMarietta: GuideArticle = {
  slug: "moving-to-marietta-ohio",
  seoTitle: "Moving to Marietta, Ohio: Rent and Commutes",
  description: "Moving to Marietta, Ohio: population, what a rental costs, schools, Memorial Health System and measured drives from Frederick Cottage.",
  h1: "Moving to Marietta, Ohio",
  lede: "Starting a job at the hospital or the college, or moving the family to Marietta, Ohio? Here is the town in numbers, from official sources: who lives here, what a rental costs, where the schools and hospitals are, and how long the drives and walks take. Then a furnished home to live in while you find your own.",
  published: "2026-11-23",
  updated: "2026-11-23",
  towns: ["marietta"],
  topics: ["moving", "commuting", "family"],
  audiences: ["relocation", "long-term"],
  homeIds: mariettaHomes.map((home) => home.id),
  sections: [
    {
      id: "short-answer",
      heading: "Marietta, Ohio in four numbers",
      blocks: [
        {
          kind: "list",
          items: [
            `${formatCount(city.estimate)} people live in the city of Marietta and ${formatCount(county.estimate)} in Washington County, Ohio (Census Bureau estimate, July ${estimateYear}).`,
            `HUD's Fair Market Rent for an unfurnished two-bedroom in Washington County, Ohio is ${formatDollars(washington.rents[2])} a month, utilities included (FY${fairMarketRent.fiscalYear}).`,
            `From Frederick Cottage, Marietta Memorial Hospital is ${range(driveTo("marietta-memorial"))} by car and Marietta College ${range(driveTo("marietta-college"))}.`,
            `I-77 is ${range(driveTo("i77-marietta"))} away, and Parkersburg, WV is across the Ohio River: Camden Clark Medical Center is ${range(driveTo("camden-clark"))}.`,
          ],
        },
      ],
    },
    {
      id: "population",
      heading: "Who lives here",
      blocks: [
        { kind: "p", text: `Marietta is the county seat of Washington County, Ohio, where the Muskingum River meets the Ohio, across the river from West Virginia. The city's population was estimated at ${formatCount(city.estimate)} in July ${estimateYear}, ${percentChange(city.base2020, city.estimate)} since April 2020, and the county's at ${formatCount(county.estimate)} (${percentChange(county.base2020, county.estimate)}).` },
        { kind: "chart", chart: populationChart },
      ],
    },
    {
      id: "housing-costs",
      heading: "What housing costs",
      blocks: [
        { kind: "p", text: `HUD's Fair Market Rent is the most consistent public yardstick for rent: ${formatDollars(washington.rents[2])} a month for a two-bedroom and ${formatDollars(washington.rents[3])} for a three-bedroom in Washington County, Ohio, rent plus utilities, unfurnished. Across the river in the Parkersburg-Vienna metro, the same sizes are ${formatDollars(parkersburgMetro.rents[2])} and ${formatDollars(parkersburgMetro.rents[3])}.` },
        { kind: "chart", chart: rentChart },
        { kind: "p", text: `A furnished month costs more than a lease: our published guide is ${publishedLuxuryFurnishedRates["1 Bedroom"]} for a one-bedroom and ${publishedLuxuryFurnishedRates["3 Bedrooms"]} for a three-bedroom. For a long stay an unfurnished lease is cheaper. A furnished home is for the months before you sign one: there is no furniture to buy or move, no utilities to set up, and no year-long lease in a town you are still getting to know.` },
      ],
    },
    {
      id: "schools",
      heading: "Schools and colleges",
      blocks: [
        { kind: "p", text: `Public schools in the city are run by Marietta City Schools. The district decides which school serves each address, so check with it before you choose a home or a lease. Marietta High School, for grades 7 to 12, is ${range(driveTo("marietta-high-school"))} from Frederick Cottage by car.` },
        { kind: "p", text: `Marietta College is ${range(walkTo("marietta-college"))} on foot from Frederick Cottage (${walkTo("marietta-college").miles} miles), and Washington State Community College is ${range(driveTo("washington-state-cc"))} by car.` },
      ],
    },
    {
      id: "healthcare",
      heading: "Hospitals and healthcare",
      blocks: [
        { kind: "p", text: `Memorial Health System runs the town's two hospitals: Marietta Memorial Hospital, ${range(driveTo("marietta-memorial"))} from Frederick Cottage by car, and Selby General Hospital, ${range(driveTo("selby-general"))}. Across the river, WVU Medicine Camden Clark Medical Center in Parkersburg, WV is ${range(driveTo("camden-clark"))}.` },
        { kind: "p", text: "Our travel-nurse page for Memorial Health compares every Mt Cottages home by its drive to Marietta Memorial." },
      ],
    },
    {
      id: "getting-around",
      heading: "Getting around",
      blocks: [
        { kind: "p", text: `Marietta is small enough that most errands are a short drive: the Kroger on Acme Street is ${range(driveTo("kroger-acme-marietta"))} from Frederick Cottage and I-77 ${range(driveTo("i77-marietta"))}. Downtown, around the Washington County Courthouse on Putnam Street, is ${range(driveTo("downtown-marietta"))} by car or ${range(walkTo("downtown-marietta"))} on foot. Washington Works, west of Parkersburg, is ${range(driveTo("chemours-washington-works"))}.` },
        { kind: "chart", chart: driveChart },
        { kind: "chart", chart: walkChart },
      ],
    },
    {
      id: "a-move-in-steps",
      heading: "A move, in four steps",
      blocks: [
        {
          kind: "diagram",
          diagram: {
            id: "marietta-move-steps",
            title: "From a job offer to your own front door",
            steps: [
              { label: "Furnished month", detail: "Arrive with a suitcase. The home is furnished and the utilities are on." },
              { label: "Learn the town", detail: "Drive the commute, walk downtown and visit the schools." },
              { label: "Find your home", detail: "Rent or buy once you know which part of town fits." },
              { label: "Move in", detail: "Stay month to month until the keys are yours, then move." },
            ],
          },
        },
        { kind: "p", text: "Stays are a month or more. How long you can stay on, and the notice to end it, are confirmed with you when you inquire." },
      ],
    },
    {
      id: "next-step",
      heading: "Next step",
      blocks: [
        { kind: "cta", heading: "Stay in Marietta, Ohio while you find your own home.", text: "Send your start date and where you will be working, and we will tell you whether Frederick Cottage is free." },
      ],
    },
  ],
  sources: [
    { label: population.source.label, url: population.source.url },
    { label: fairMarketRent.source.label, url: fairMarketRent.source.url },
    { label: "Marietta City Schools", url: "https://www.mariettacityschools.k12.oh.us/" },
    { label: "Marietta College", url: "https://www.marietta.edu/" },
    { label: "Memorial Health System", url: "https://www.mhsystem.org/" },
    { label: "OSRM public router, driving profile (route data)", url: driveSource },
    { label: "OSRM public router, foot profile (route data)", url: walks[0].route.sourceUrl },
    { label: "OpenStreetMap copyright and licence (ODbL 1.0)", url: "https://www.openstreetmap.org/copyright" },
  ],
};
