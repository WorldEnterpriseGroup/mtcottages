/**
 * Neighbourhood guide (#54): the areas of Parkersburg, West Virginia, for
 * relocating families and long-term guests. Targets the "best neighborhoods in
 * parkersburg wv" row of docs/marketing/keyword-universe.csv at
 * /guides/parkersburg-neighborhoods/.
 *
 * Fair housing: the guide describes places, never people. It names parks,
 * shops, schools, transit and drive times, and never says who lives in an
 * area, what an area is "good for" or how safe it is; e2e/tests/
 * parkersburg-neighborhoods.spec.js fails the page on those words.
 *
 * Nothing here is new, unverified fact. The places are the shared Parkersburg
 * list in src/data/homes/towns.ts (each checked against OpenStreetMap or its
 * own site), the drive times come from _data/distances.json through
 * driveMatrix(), and the north-to-south order of the diagram is computed from
 * the measured destinations' coordinates. Buck Cottage's street is not
 * published, so the guide never places it in an area: its drives are the
 * town centre's and say so. Charts and a diagram only: no map tiles, no area
 * photo.
 */
import { homes } from "../homes";
import { parkersburgNearby } from "../homes/towns";
import { destinationPoint, driveMatrix, formatMeasured, type DriveFromHome, type DriveMatrixRow } from "../distances";
import type { ChartSpec, DiagramSpec, GuideArticle, GuidePlace } from "./types";

const parkersburgHomes = homes.filter((home) => home.town.slug === "parkersburg");
if (parkersburgHomes.length === 0) throw new Error("parkersburg-neighborhoods: no Parkersburg homes");
const broadStreetHomes = parkersburgHomes.filter((home) => home.id === "broad" || home.id === "oak");
if (broadStreetHomes.length !== 2) throw new Error("parkersburg-neighborhoods: Broad and Oak Cottages must both be listed");

/** Places from the shared, checked Parkersburg list, by name, so a renamed or removed place fails the build. */
const places = (names: string[]): GuidePlace[] =>
  names.map((name) => {
    const place = parkersburgNearby.find((candidate) => candidate.name === name);
    if (!place?.source) throw new Error(`parkersburg-neighborhoods: ${name} is not in parkersburgNearby with a source`);
    const url = place.source;
    return url.includes("openstreetmap.org") ? { name: place.name, kind: place.note, url, via: "OpenStreetMap" } : { name: place.name, kind: place.note, url };
  });

type Area = { id: string; label: string; anchor: string; detail: string };
/** Each area is anchored on a measured destination; the diagram sorts them by that point's latitude. */
const AREAS: Area[] = [
  { id: "south-side", label: "The south side", anchor: "parkersburg-south-high-school", detail: "Parkersburg South High School and a second Kroger, on Division Street." },
  { id: "downtown", label: "Downtown, at the two rivers", anchor: "downtown-parkersburg", detail: "Point Park, the Smoot Theatre, museums, the bus hub and Camden Clark Medical Center." },
  { id: "vienna", label: "Vienna, a separate city", anchor: "vienna-centre", detail: "Its own city government, and Grand Central Mall." },
  { id: "city-park", label: "Broad Street and City Park", anchor: "parkersburg-city-park", detail: "City Park, Kroger and CVS on 7th Street, and Parkersburg High School. Broad and Oak Cottages are on Broad Street." },
];
const latitude = (destination: string) => {
  const point = destinationPoint(destination);
  if (!point) throw new Error(`parkersburg-neighborhoods: ${destination} has no coordinates in _data/distances.json`);
  return point.lat;
};
const northToSouth = [...AREAS].sort((a, b) => latitude(b.anchor) - latitude(a.anchor));

const areaMap: DiagramSpec = {
  id: "parkersburg-areas",
  title: "Parkersburg's areas from north to south (a sketch, not to scale)",
  steps: northToSouth.map((area) => ({ label: area.label, detail: area.detail })),
};

const fromLabel = (drive: DriveFromHome) => (drive.originKind === "address" ? drive.homeName : `${drive.homeName} (from the Parkersburg centre)`);
const matrixOf = (destinations: string[]) => {
  const matrix = driveMatrix(destinations, parkersburgHomes);
  for (const row of matrix) if (row.drives.length === 0) throw new Error(`parkersburg-neighborhoods: no measured drive to ${row.destination}`);
  return matrix;
};
const areaMatrix = matrixOf(northToSouth.map((area) => area.anchor));
const everydayMatrix = matrixOf(["camden-clark", "kroger-7th-parkersburg", "parkersburg-high-school", "wvu-parkersburg", "i77-parkersburg"]);
const allDrives = [...areaMatrix, ...everydayMatrix].flatMap((row) => row.drives);
const measuredDates = [...new Set(allDrives.map((drive) => drive.measured))].sort();
const measuredText = measuredDates.length === 1 ? formatMeasured(measuredDates[0]) : `${formatMeasured(measuredDates[0])} to ${formatMeasured(measuredDates.at(-1) as string)}`;
const driveSource = allDrives[0].sourceUrl;
const method = `Driving routes on OpenStreetMap roads from the public OSRM router, measured ${measuredText}, rounded up to the next whole minute. Buck Cottage's street address is not published, so its times are measured from the Parkersburg town centre and labelled so.`;

const chartOf = (id: string, title: string, matrix: DriveMatrixRow[]): ChartSpec => ({
  id,
  title,
  subtitle: "About this many minutes by car, with no traffic. Nearest home first.",
  valueHeading: "Drive",
  groups: matrix.map((row) => ({
    label: row.label,
    bars: row.drives.map((drive) => ({ label: fromLabel(drive), value: drive.minutes, valueText: `${drive.minutes} min`, note: `${drive.miles} mi, measured ${formatMeasured(drive.measured)}` })),
  })),
  method,
  sourceLabel: "OSRM route data",
  sourceUrl: driveSource,
});

const areaChart = chartOf("parkersburg-area-drives", "How far each area is from our Parkersburg homes", areaMatrix);
const everydayChart = chartOf("parkersburg-everyday-drives", "Everyday drives from our Parkersburg homes", everydayMatrix);

const addressedMiles = (destination: string, matrix: DriveMatrixRow[] = areaMatrix) => {
  const drives = matrix.find((row) => row.destination === destination)?.drives.filter((drive) => drive.originKind === "address") ?? [];
  if (drives.length === 0) throw new Error(`parkersburg-neighborhoods: no addressed drive to ${destination}`);
  const low = Math.min(...drives.map((drive) => drive.miles));
  const high = Math.max(...drives.map((drive) => drive.miles));
  return low === high ? `${low} miles` : `${low} to ${high} miles`;
};

const CITY = "https://www.parkersburgwv.gov/";
const SCHOOLS = "https://www.woodcountyschoolswv.com/";
const BUS = "https://easyriderbus.com/";
const VIENNA = "https://www.vienna-wv.com/31/Community";

export const parkersburgNeighborhoods: GuideArticle = {
  slug: "parkersburg-neighborhoods",
  seoTitle: "Parkersburg, WV Neighborhoods: What's Nearby",
  description: "Parkersburg, WV neighborhoods from north to south: the parks, groceries, schools and buses in each area, with measured drives from our furnished homes.",
  h1: "Parkersburg, WV neighborhoods: what is near each area",
  lede: "Moving to Parkersburg and deciding where to look? Here is the town from north to south, described by what is there: parks, groceries, schools, buses and how long the drives are. We describe places, not people, and the choice of area is yours.",
  published: "2026-11-23",
  updated: "2026-11-23",
  towns: ["parkersburg"],
  topics: ["moving", "family"],
  audiences: ["relocation", "long-term"],
  homeIds: parkersburgHomes.map((home) => home.id),
  sections: [
    {
      id: "short-answer",
      heading: "The town in four areas",
      blocks: [
        { kind: "p", text: "Parkersburg sits where the Little Kanawha River meets the Ohio. For a quick picture, think of four areas, north to south. The sketch below is ours and is not to scale; the drive times further down are measured." },
        { kind: "diagram", diagram: areaMap },
      ],
    },
    {
      id: "city-park",
      heading: "Broad Street and City Park",
      blocks: [
        { kind: "p", text: `The streets around Parkersburg City Park, the city's largest park. Broad and Oak Cottages are on Broad Street here, ${addressedMiles("parkersburg-city-park")} from the park by road. Kroger and CVS are on 7th Street near the park, and Parkersburg High School is ${addressedMiles("parkersburg-high-school", everydayMatrix)} from the two homes.` },
        { kind: "places", places: places(["Parkersburg City Park", "Kroger on 7th Street", "CVS Pharmacy on 7th Street", "Parkersburg High School"]) },
      ],
    },
    {
      id: "downtown",
      heading: "Downtown, at the two rivers",
      blocks: [
        { kind: "p", text: "The older centre of town, on the point where the Little Kanawha joins the Ohio. It has the riverfront park and trail, the theatre and museums and the bus hub, with the main hospital campus close by on Garfield Avenue. Federal offices of the Bureau of the Fiscal Service are downtown too." },
        { kind: "places", places: places(["Point Park", "Fort Boreman Park", "Blennerhassett Island Historical State Park", "Smoot Theatre", "Oil and Gas Museum", "Parkersburg Art Center", "Parkersburg Brewing Company", "Corner Cafe", "Easy Rider (Mid-Ohio Valley Transit Authority)", "WVU Medicine Camden Clark Medical Center"]) },
      ],
    },
    {
      id: "south-side",
      heading: "The south side",
      blocks: [
        { kind: "p", text: "South of the Little Kanawha River. It has the second public high school and a second full-service grocery store, and West Virginia University at Parkersburg is east of town." },
        { kind: "places", places: places(["Parkersburg South High School", "Kroger on Division Street", "West Virginia University at Parkersburg"]) },
      ],
    },
    {
      id: "vienna",
      heading: "Vienna, the city to the north",
      blocks: [
        { kind: "p", text: `Vienna is a separate city on Parkersburg's northern edge, with its own city government and services, and the region's large enclosed mall. Broad and Oak Cottages are ${addressedMiles("vienna-centre")} from the centre of Vienna by road. Our Vienna guide has its population, rents and buses.` },
        { kind: "places", places: places(["Grand Central Mall"]) },
      ],
    },
    {
      id: "schools",
      heading: "Schools",
      blocks: [
        { kind: "p", text: "Wood County Schools runs the public schools in Parkersburg and Vienna alike, and decides which school serves each address. Ask the district for the school that serves a street before you sign a lease. Our Wood County schools guide has more." },
      ],
    },
    {
      id: "drives",
      heading: "How far each area is",
      blocks: [
        { kind: "chart", chart: areaChart },
        { kind: "chart", chart: everydayChart },
      ],
    },
    {
      id: "next-step",
      heading: "Next step",
      blocks: [
        { kind: "cta", heading: "See the areas for yourself from a furnished home.", text: "Send your move-in date and where you will be working, and we will tell you which Parkersburg home fits and whether it is free. A month in town is the easiest way to choose an area before you sign a lease." },
      ],
    },
  ],
  sources: [
    { label: "City of Parkersburg, West Virginia", url: CITY },
    { label: "City of Vienna, West Virginia: community", url: VIENNA },
    { label: "Wood County Schools", url: SCHOOLS },
    { label: "Easy Rider (Mid-Ohio Valley Transit Authority)", url: BUS },
    { label: "OSRM public router, driving profile (route data)", url: driveSource },
    { label: "OpenStreetMap copyright and licence (ODbL 1.0)", url: "https://www.openstreetmap.org/copyright" },
  ],
};
