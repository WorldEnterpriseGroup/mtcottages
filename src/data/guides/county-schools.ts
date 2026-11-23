/**
 * County schools guides (#53): one guide per county where we have homes, for
 * families choosing by school (personas P3 and P4). Targets the "marietta ohio
 * schools" and "ravenswood wv high school" rows of
 * docs/marketing/keyword-universe.csv.
 *
 * Honesty rules for these guides:
 * - Districts, schools and colleges only, each linked to its official site
 *   (a school without a page we could verify links to its district's site,
 *   named in `via`). No rankings, ratings or test scores: we cannot source them
 *   to a standard we would publish.
 * - Every drive time comes from _data/distances.json through driveMatrix();
 *   a school we never measured is listed without one, never estimated.
 * - The district decides which school serves an address, so every guide says
 *   to confirm with it. Charts only: no school photos.
 */
import { homes } from "../homes";
import { driveMatrix, formatMeasured, type DriveFromHome } from "../distances";
import type { ChartSpec, GuideArticle, GuidePlace, GuideTown } from "./types";

type CountySchools = {
  slug: string;
  seoTitle: string;
  description: string;
  h1: string;
  lede: string;
  /** Where the district serves, as the short answer names it. */
  area: string;
  town: GuideTown;
  /** Town label used in chart labels for homes measured from the town centre. */
  centreLabel: string;
  district: GuidePlace;
  /** What the district covers, one or two plain sentences. */
  districtText: string;
  places: GuidePlace[];
  /** distances.json destinations charted, in reading order. */
  destinations: string[];
  ctaHeading: string;
};

const PUBLISHED = "2026-11-23";

function countySchoolsGuide(spec: CountySchools): GuideArticle {
  const countyHomes = homes.filter((home) => home.town.slug === spec.town);
  if (countyHomes.length === 0) throw new Error(`${spec.slug}: no homes in ${spec.town}`);
  const matrix = driveMatrix(spec.destinations, countyHomes);
  const measured = matrix.filter((row) => row.drives.length > 0);
  if (measured.length !== spec.destinations.length) {
    const missing = matrix.filter((row) => row.drives.length === 0).map((row) => row.destination);
    throw new Error(`${spec.slug}: no measured drive from a ${spec.town} home to ${missing.join(", ")}`);
  }
  const fromLabel = (drive: DriveFromHome) => (drive.originKind === "address" ? drive.homeName : `${drive.homeName} (from the ${spec.centreLabel} centre)`);
  const dates = [...new Set(measured.flatMap((row) => row.drives.map((drive) => drive.measured)))].sort();
  const measuredText = dates.length === 1 ? formatMeasured(dates[0]) : `${formatMeasured(dates[0])} to ${formatMeasured(dates.at(-1) as string)}`;
  const nearest = (row: (typeof measured)[number]) => row.drives[0];

  const chart: ChartSpec = {
    id: `${spec.slug}-drives`,
    title: `Drive times to schools and colleges from our ${spec.centreLabel} homes`,
    subtitle: "About this many minutes by car, with no traffic. Nearest home first.",
    valueHeading: "Drive",
    groups: measured.map((row) => ({
      label: row.label,
      bars: row.drives.map((drive) => ({ label: fromLabel(drive), value: drive.minutes, valueText: `${drive.minutes} min`, note: `${drive.miles} mi, measured ${formatMeasured(drive.measured)}` })),
    })),
    method: `Driving routes on OpenStreetMap roads from the public OSRM router, measured ${measuredText}, rounded up to the next whole minute. Homes without a published street address are measured from the ${spec.centreLabel} town centre and labelled so.`,
    sourceLabel: "OSRM route data",
    sourceUrl: nearest(measured[0]).sourceUrl,
  };

  return {
    slug: spec.slug,
    seoTitle: spec.seoTitle,
    description: spec.description,
    h1: spec.h1,
    lede: spec.lede,
    published: PUBLISHED,
    updated: PUBLISHED,
    towns: [spec.town],
    topics: ["family", "moving"],
    audiences: ["relocation", "long-term"],
    homeIds: countyHomes.map((home) => home.id),
    sections: [
      {
        id: "short-answer",
        heading: "The short answer",
        blocks: [{
          kind: "list",
          items: [
            `Public schools in ${spec.area} are run by ${spec.district.name}.`,
            ...measured.map((row) => `${row.label}: about ${nearest(row).minutes} minutes from ${fromLabel(nearest(row))}.`),
            "The district decides which school serves each address. Confirm it with the district before you choose a home or a lease.",
          ],
        }],
      },
      {
        id: "district",
        heading: "The school district",
        blocks: [
          { kind: "p", text: spec.districtText },
          { kind: "places", places: [spec.district] },
        ],
      },
      {
        id: "schools-and-colleges",
        heading: "High schools and colleges",
        blocks: [
          { kind: "p", text: "Each name links to the school's or college's own site, or, where we could not verify one, to its district's site. We list no rankings or ratings: visit, and ask the school directly." },
          { kind: "places", places: spec.places },
        ],
      },
      {
        id: "drives",
        heading: "How far the drives are",
        blocks: [{ kind: "chart", chart }],
      },
      {
        id: "next-step",
        heading: "Next step",
        blocks: [{ kind: "cta", heading: spec.ctaHeading, text: "Send your move-in date and the school you have in mind, and we will tell you which home fits and whether it is free." }],
      },
    ],
    sources: [
      { label: spec.district.name, url: spec.district.url },
      ...spec.places.filter((place) => place.url !== spec.district.url).map((place) => ({ label: place.name, url: place.url })),
      { label: "OSRM public router, driving profile (route data)", url: chart.sourceUrl },
      { label: "OpenStreetMap copyright and licence (ODbL 1.0)", url: "https://www.openstreetmap.org/copyright" },
    ],
  };
}

const WOOD = "https://www.woodcountyschoolswv.com/";
const MARIETTA_CITY = "https://www.mariettacityschools.k12.oh.us/";
const JACKSON = "https://www.boe.jack.k12.wv.us/";

export const woodCountySchools = countySchoolsGuide({
  slug: "wood-county-wv-schools",
  seoTitle: "Parkersburg, WV Schools: Wood County Guide",
  description: "Schools near our Parkersburg, WV homes: Wood County Schools, its Parkersburg-area high schools and WVU Parkersburg, with measured drive times.",
  h1: "Schools in Wood County, West Virginia",
  lede: "Moving to Parkersburg with children, or starting college nearby? Here are the district, the high schools and the college closest to our Parkersburg homes, each with its official link and a measured drive time.",
  area: "Wood County",
  town: "parkersburg",
  centreLabel: "Parkersburg",
  district: { name: "Wood County Schools", kind: "Public school district for all of Wood County", url: WOOD },
  districtText: "Wood County Schools runs the public schools across the county: Parkersburg, Vienna and Williamstown alike. It sets attendance zones, enrolment and the school calendar.",
  places: [
    { name: "Parkersburg High School", kind: "Public high school", url: WOOD, via: "Wood County Schools site" },
    { name: "Parkersburg South High School", kind: "Public high school", url: WOOD, via: "Wood County Schools site" },
    { name: "Williamstown High School", kind: "Public high school", url: WOOD, via: "Wood County Schools site" },
    { name: "West Virginia University at Parkersburg", kind: "Public college", url: "https://www.wvup.edu/" },
  ],
  destinations: ["parkersburg-high-school", "parkersburg-south-high-school", "williamstown-high-school", "wvu-parkersburg"],
  ctaHeading: "Live near the school while you settle in.",
});

export const washingtonCountySchools = countySchoolsGuide({
  slug: "marietta-ohio-schools",
  seoTitle: "Marietta, Ohio Schools and Colleges",
  description: "Schools in Marietta, Ohio: Marietta City Schools, Marietta High School, Marietta College and Washington State, with measured drives from our home.",
  h1: "Schools and colleges in Marietta, Ohio",
  lede: "Moving to Marietta, Ohio with children, or studying in town? Here are the city's school district, its high school and its two colleges, each with its official link and a measured drive from Frederick Cottage.",
  area: "Marietta, Ohio",
  town: "marietta",
  centreLabel: "Marietta",
  district: { name: "Marietta City Schools", kind: "Public school district for the city of Marietta", url: MARIETTA_CITY },
  districtText: "Marietta City Schools runs the public schools in the city of Marietta, Ohio. Other parts of Washington County are served by their own local districts, so check which district an address is in.",
  places: [
    { name: "Marietta High School", kind: "Public high school, grades 7 to 12", url: `${MARIETTA_CITY}o/mhs` },
    { name: "Marietta College", kind: "Private college", url: "https://www.marietta.edu/" },
    { name: "Washington State College of Ohio", kind: "Public community college", url: "https://www.wscc.edu/" },
  ],
  destinations: ["marietta-high-school", "marietta-college", "washington-state-cc"],
  ctaHeading: "Live minutes from school in Marietta, Ohio.",
});

export const jacksonCountySchools = countySchoolsGuide({
  slug: "ravenswood-wv-schools",
  seoTitle: "Ravenswood, WV Schools: Jackson County Guide",
  description: "Schools near our Ravenswood, WV homes: Jackson County Schools, Ravenswood High School and Ripley High School, with measured drive times.",
  h1: "Schools in Ravenswood and Jackson County, West Virginia",
  lede: "Moving to Ravenswood with children? Here are the district and the county's two high schools, each with its official link and a measured drive from our Ravenswood homes.",
  area: "Jackson County",
  town: "ravenswood",
  centreLabel: "Ravenswood",
  district: { name: "Jackson County Schools", kind: "Public school district for all of Jackson County", url: JACKSON },
  districtText: "Jackson County Schools runs the public schools across the county, in Ravenswood, Ripley and the country between. It sets attendance zones, enrolment and the school calendar.",
  places: [
    { name: "Ravenswood High School", kind: "Public high school, grades 9 to 12", url: JACKSON, via: "Jackson County Schools site" },
    { name: "Ripley High School", kind: "Public high school", url: JACKSON, via: "Jackson County Schools site" },
  ],
  destinations: ["ravenswood-high-school", "ripley-high-school"],
  ctaHeading: "Live near Ravenswood's schools while you settle in.",
});
