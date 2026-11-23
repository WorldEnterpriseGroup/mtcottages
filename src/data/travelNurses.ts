/**
 * Travel-nurse hub (Growth M1, #29): /travel-nurses/ for persona P1 in
 * docs/marketing/brand-and-positioning.md. It replaces the generic
 * /health-professionals.html guide, which is now a noindex redirect to it.
 * Rendered by src/components/TravelNurseHub.astro.
 *
 * Honesty rules, enforced by e2e/tests/travel-nurses.spec.js:
 * - Drive minutes come only from _data/distances.json (measured, dated, sourced),
 *   through distancesFor(); nothing is typed into the copy by hand.
 * - The GSA figures below were read from GSA's own FY2027 files and carry their
 *   fiscal year and source. GSA is a reference for lodging cost, not a promise
 *   of any stipend, and the page says so.
 * - A guide price is labelled "confirm on inquiry" unless the owner confirmed it.
 * - Nothing about minimum stay, pets, utilities, parking, blackout shades or
 *   response time is stated unless a home's own data lists it. The one-month
 *   minimum, included utilities and no pets were matched to the live Furnished
 *   Finder listings and the house rules on #70 (2026-11-16).
 * - No affiliation with any hospital or health system is claimed.
 */
import { homes } from "./homes";
import { hasStreetAddress, homeHref, statusLabel } from "./homes/links";
import { distancesFor, formatMeasured } from "./distances";
import { type Faq } from "./townLanding";
import { monthlyRateText, termRows } from "./terms";
import type { HomeMicrosite } from "./homes/types";

export const hubPath = "travel-nurses/index.html";
/** The URL every internal link uses: Astro writes the directory form under build.format "preserve". */
export const hubHref = "/travel-nurses/";
/** The Camden Clark landing page (#32). */
export const camdenClarkPath = "travel-nurses/camden-clark/index.html";
export const camdenClarkHref = "/travel-nurses/camden-clark/";

export const hub = {
  title: "Travel Nurse Housing in the Mid-Ohio Valley | Mt Cottages",
  description: "Furnished homes near Camden Clark, Marietta Memorial and Jackson General for 13-week and longer stays, with the GSA lodging per diem beside our guide prices.",
  eyebrow: "Travel nurses and medical staff",
  h1: "Travel nurse housing in Parkersburg, WV and Marietta, Ohio",
  lede: "Taking a contract at WVU Medicine Camden Clark in Parkersburg, WV, at Marietta Memorial in Marietta, Ohio, or at Jackson General in Ripley, WV? Mt Cottages offers whole furnished homes instead of a hotel room: your own front door, a full kitchen and fiber-optic internet, a short drive from the hospital.",
  intro: "This page shows the measured drive from each home to each hospital, sets the federal lodging per diem beside our monthly guide prices, and answers what travel nurses ask us most. Anything we have not confirmed says so, and we confirm it in writing before you commit.",
  heroAlt: "Oak Cottage guest bedroom with an upholstered headboard",
  inquiryLabel: "Find a home near your hospital",
} as const;

// ---------------------------------------------------------------------------
// GSA lodging per diem
// ---------------------------------------------------------------------------

/**
 * Read on 15 November 2026 from GSA's published FY2027 files:
 * - FY2027_PerDiemRates_Validated090126.xlsx: "Standard CONUS rate applies to all
 *   counties not specifically listed", lodging 113, M&IE 68; no row for Wood County WV,
 *   Washington County OH or Jackson County WV.
 * - FY2027PerDiemZipCode_Validated090126.xlsx: ZIP 26101, 26104, 26164, 25271 and 45750
 *   are each "Standard Rate", lodging 113.
 * - GSA Per Diem Bulletin FTR 27-01: standard lodging rose from $110 (FY2026) to $113
 *   for travel from 1 October 2026 through 30 September 2027.
 */
export const perDiem = {
  fiscalYear: "FY2027",
  period: "October 1, 2026 to September 30, 2027",
  lodgingPerNight: 113,
  nights: 30,
  prior: { fiscalYear: "FY2026", lodgingPerNight: 110 },
  checked: "November 2026",
  /** Every county the page speaks about falls under the standard CONUS rate. */
  counties: [
    { county: "Wood County, West Virginia", place: "Parkersburg", zips: "ZIP codes 26101 and 26104" },
    { county: "Washington County, Ohio", place: "Marietta, Ohio", zips: "ZIP code 45750" },
    { county: "Jackson County, West Virginia", place: "Ravenswood and Ripley", zips: "ZIP codes 26164 and 25271" },
  ],
  sources: [
    { label: "GSA per diem rates look-up", href: "https://www.gsa.gov/travel/plan-book/per-diem-rates" },
    { label: "GSA Per Diem Bulletin FTR 27-01", href: "https://www.gsa.gov/policy-regulations/regulations/federal-travel-regulation/ftr-and-related-files/gsa-per-diem-bulletin-ftr-2701" },
    { label: "GSA FY2027 per diem rates file", href: "https://www.gsa.gov/system/files/FY2027_PerDiemRates_Validated090126.xlsx" },
  ],
} as const;

export const perDiemMonth = perDiem.lodgingPerNight * perDiem.nights;

export const usd = (amount: number): string => `$${amount.toLocaleString("en-US")}`;

// Rates come from src/data/terms.json through terms.ts (#72), the one source every
// card, microsite and Offer reads, so the chart can never disagree with them.
const rateAmount = (id: string): number | null => {
  const text = monthlyRateText(id);
  if (text === null) return null;
  const match = text.match(/^\$([\d,]+)\/month$/);
  if (!match) throw new Error(`Travel-nurse hub: home "${id}" has monthly rate "${text}", expected "$N/month"`);
  return Number.parseInt(match[1].replace(/,/g, ""), 10);
};

const rateStatus = (id: string): string =>
  termRows(id).find((row) => row.field === "monthlyRate")?.status === "confirmed"
    ? "Monthly rate"
    : "Guide price, confirm on inquiry";

export type ChartRow = {
  id: string;
  label: string;
  detail: string;
  amount: number;
  /** Width of the bar, as a share of the 30-night per diem. */
  share: number;
  status: string;
  /** "$1,495 below" or "$300 above" the 30-night figure; empty for the reference row itself. */
  gap: string;
};

const bedroomWord = (count: number) => `${count} bedroom${count === 1 ? "" : "s"}`;

/** One bar per live home with a published rate or guide, ordered cheapest first. */
export const chartRows: ChartRow[] = homes
  .flatMap((home: HomeMicrosite): ChartRow[] => {
    const amount = rateAmount(home.id);
    if (amount === null) return [];
    const diff = perDiemMonth - amount;
    return [{
      id: home.id,
      label: home.name,
      detail: `${bedroomWord(home.bedrooms)}, ${home.town.name}, ${home.town.state}`,
      amount,
      share: Math.min(100, (amount / perDiemMonth) * 100),
      status: rateStatus(home.id),
      gap: `${usd(Math.abs(diff))} ${diff >= 0 ? "below" : "above"}`,
    }];
  })
  .sort((a, b) => a.amount - b.amount || a.label.localeCompare(b.label));

export const chartLabel =
  `Bar chart. The federal lodging per diem for ${perDiem.fiscalYear} is ${usd(perDiem.lodgingPerNight)} a night, which is ${usd(perDiemMonth)} for ${perDiem.nights} nights. ` +
  `Mt Cottages monthly guide prices: ${chartRows.map((row) => `${row.label} ${usd(row.amount)}`).join(", ")}. ${chartRows.every((row) => row.amount <= perDiemMonth) ? `Every guide price is at or below the ${perDiem.nights}-night figure.` : `${chartRows.filter((row) => row.amount <= perDiemMonth).length} of ${chartRows.length} are at or below the ${perDiem.nights}-night figure.`} The same numbers are in the table below.`;

// ---------------------------------------------------------------------------
// Hospitals and measured drive times
// ---------------------------------------------------------------------------

export type DriveLine = { homeId: string; homeName: string; label: string; minutes: number; miles: number; measured: string; sourceUrl: string };

export type HospitalCard = {
  id: string;
  name: string;
  place: string;
  summary: string;
  /** One group of drive lines per hospital campus named in the card. */
  campuses: { label: string; drives: DriveLine[] }[];
  town: { name: string; href: string };
  /** The hospital's own landing page, once it has one (#32, #33). */
  guide?: { name: string; href: string };
};

const microsite = (id: string): HomeMicrosite => {
  const home = homes.find((entry) => entry.id === id);
  if (!home) throw new Error(`Travel-nurse hub lists "${id}", which has no live home microsite`);
  return home;
};

/** The measured drive from an approved-address home to a destination in _data/distances.json; throws when it is missing. */
export const drive = (homeId: string, destination: string): DriveLine => {
  const home = microsite(homeId);
  if (!hasStreetAddress(home)) throw new Error(`${homeId} has no approved street address, so its hospital drive is not published`);
  const row = distancesFor(home).groups.flatMap((group) => group.rows).find((entry) => entry.destination === destination);
  if (!row) throw new Error(`_data/distances.json has no ${destination} row for ${homeId}`);
  return { homeId, homeName: home.name, label: row.label, minutes: row.minutes, miles: row.miles, measured: row.measured, sourceUrl: row.sourceUrl };
};

export const hospitals: HospitalCard[] = [
  {
    id: "camden-clark",
    name: "WVU Medicine Camden Clark Medical Center",
    place: "Parkersburg, West Virginia",
    summary: "Broad and Oak Cottages sit a few blocks apart on Broad Street in North Parkersburg.",
    campuses: [{ label: "Camden Clark Medical Center", drives: [drive("broad", "camden-clark"), drive("oak", "camden-clark")] }],
    town: { name: "Furnished rentals in Parkersburg, WV", href: "/parkersburg/index.html" },
    guide: { name: "Furnished homes near Camden Clark", href: camdenClarkHref },
  },
  {
    id: "memorial-health",
    name: "Memorial Health System, Marietta Memorial Hospital",
    place: "Marietta, Ohio",
    summary: "Frederick Cottage is a three-bedroom house on Marietta's east side. Memorial Health System also runs Selby General Hospital in Marietta, Ohio.",
    campuses: [
      { label: "Marietta Memorial Hospital", drives: [drive("frederick", "marietta-memorial")] },
      { label: "Selby General Hospital", drives: [drive("frederick", "selby-general")] },
    ],
    town: { name: "Furnished rentals in Marietta, Ohio", href: "/marietta/index.html" },
    guide: { name: "Housing near Marietta Memorial, for staff and residents", href: "/travel-nurses/memorial-health-marietta/" },
  },
  {
    id: "jackson-general",
    name: "WVU Medicine Jackson General Hospital",
    place: "Ripley, West Virginia",
    summary: "The hospital is in Ripley, not Ravenswood. Henrietta Cottage is in Ravenswood, the nearest of our homes to it.",
    campuses: [{ label: "Jackson General Hospital", drives: [drive("henrietta", "jackson-general")] }],
    town: { name: "Ravenswood, West Virginia", href: "/ravenswood/index.html" },
    guide: { name: "Housing near Jackson General, from Ravenswood", href: "/travel-nurses/jackson-general/" },
  },
];

/**
 * The hospital landing pages and the homes each one features, for those homes'
 * Related blocks (src/layouts/HomeLayout.astro), so every landing is linked
 * from the homes it recommends.
 */
export const hospitalLandings: (RelatedLinkShape & { homeIds: string[] })[] = [
  { href: camdenClarkHref, label: "Furnished homes near Camden Clark", note: "Measured drives from Broad and Oak Cottages to Camden Clark Medical Center in Parkersburg.", homeIds: ["broad", "oak"] },
  { href: "/travel-nurses/memorial-health-marietta/", label: "Housing near Marietta Memorial, for staff and residents", note: "Measured drives to Marietta Memorial and Selby General hospitals in Marietta, Ohio.", homeIds: ["frederick", "broad", "oak"] },
  { href: "/travel-nurses/jackson-general/", label: "Housing near Jackson General Hospital in Ripley, WV", note: "Measured drives from Henrietta and Virginia Cottages in Ravenswood to the hospital in Ripley.", homeIds: ["henrietta", "virginia"] },
];
type RelatedLinkShape = { href: string; label: string; note: string };

/** The hospital landings that feature a home. */
export const hospitalLandingsForHome = (homeId: string): RelatedLinkShape[] =>
  hospitalLandings.filter((landing) => landing.homeIds.includes(homeId)).map(({ href, label, note }) => ({ href, label, note }));

/** The latest measurement date behind the hospital drives, e.g. "15 Nov 2026". */
export const drivesMeasured = formatMeasured(
  hospitals.flatMap((card) => card.campuses.flatMap((campus) => campus.drives.map((line) => line.measured))).sort().at(-1) ?? "",
);

export const driveSource =
  `Routes from OpenStreetMap data (OSRM), measured ${drivesMeasured} from each home's approved street address. Free-flow driving times; allow longer at shift change and in bad weather.`;

// ---------------------------------------------------------------------------
// Terms, homes, FAQ
// ---------------------------------------------------------------------------

/** Only what a home's own listing states; everything else is a question to ask. */
export const terms = {
  stated: [
    "Every home has a one-month minimum stay (30 days), so a 13-week contract fits it.",
    "Utilities are included in the monthly price at every home.",
    "No pets, at any home.",
  ],
  confirm: [
    "Whether your 13-week start and end dates fit the home you want",
    "When the home you want is free",
    "The security deposit, set when you book",
    "Parking space and street rules",
    "Which bedroom is quietest and what covers its windows",
  ],
};

export const homesNote =
  "Buck and Virginia Cottages have no published street address, so we give their drive to each hospital on inquiry. Guide prices are for planning; we confirm the current price and what it covers before you commit.";

export const faqs: Faq[] = [
  {
    q: "Is my housing stipend the same as the GSA per diem?",
    a: "No. Your agency sets your stipend in your contract, and it can be higher or lower than the federal figure. GSA publishes the lodging per diem for government travelers, and many people use it as a rough yardstick for what lodging costs in an area. Treat it as a reference, not a promise, and ask your recruiter for the exact amount in your contract. This page is not tax advice; a tax professional can explain how a stipend applies to you.",
  },
  {
    q: "Can I stay for a 13-week contract?",
    a: "Yes. Every home has a one-month minimum stay (30 days), and thirteen weeks is longer than that. Send your start and end dates and we confirm in writing that the home you want is free for them before you commit.",
  },
  {
    q: "Is the bedroom quiet enough to sleep through the day?",
    a: "We cannot promise a home is silent, and we have not confirmed blackout shades for every home. Each home's page shows its real bedroom photos. Ask us which bedroom is farthest from the street and what covers its windows, and we will answer for the home you are considering before you commit.",
  },
  {
    q: "Are utilities and Wi-Fi included?",
    a: "Fiber-optic internet is listed for Frederick Cottage (1 Gbps wired and wifi), Broad, Oak, Buck and Virginia Cottages, and is to be confirmed for Henrietta Cottage. Utilities are included in the monthly price at every home, and we confirm the details in writing before you commit.",
  },
  {
    q: "Where do I park, including when I get home at odd hours?",
    a: "Frederick Cottage lists free parking on the premises and on the street, and its photos show a driveway; we confirm your space and the street rules before you arrive. For the other homes the parking arrangement is to be confirmed, so ask before you commit.",
  },
  {
    q: "Do you allow pets?",
    a: "No. Our house rules allow no pets at any home.",
  },
  {
    q: "How do I know Mt Cottages is real and this is not a scam?",
    a: "Check what you can check. Our photos are of the actual homes. Frederick, Broad, Oak and Henrietta Cottages publish their street addresses on their own pages, so you can look them up on a map. An inquiry on this site asks for your dates and contact details only: no payment, no Social Security number and no bank details. Any screening, agreement or payment is a separate, later step with its own documents, and you should never email card numbers or bank credentials to anyone, us included. Our email address is stay@mtcottages.com, so be wary of a lookalike.",
  },
];

export const disclaimer =
  "Mt Cottages is an independent furnished-housing company. It is not affiliated with, endorsed by or sponsored by WVU Medicine, Camden Clark Medical Center, Jackson General Hospital, Memorial Health System, Marietta Memorial Hospital or Selby General Hospital. Hospital names are used only to say where our homes are in relation to them.";

// ---------------------------------------------------------------------------
// Camden Clark landing page (#32): /travel-nurses/camden-clark/
// ---------------------------------------------------------------------------

/**
 * Same honesty rules as the hub, plus: every minute and mile on the page is read from
 * _data/distances.json through drive(); a place that has no row there (a gym, a late-night
 * restaurant) is not listed at all; parking, laundry and internet repeat only what each
 * home's own facts say, with their status, and everything else says "confirm on inquiry".
 * Buck Cottage has no approved street address, so its drive is given on inquiry, as on the hub.
 */
const nearbyHomeIds = ["broad", "oak"] as const;

/** Drives from each Parkersburg home with a published address to the hospital, nearest first. */
export const camdenDrives: DriveLine[] = nearbyHomeIds
  .map((id) => drive(id, "camden-clark"))
  .sort((a, b) => a.minutes - b.minutes || a.miles - b.miles || a.homeName.localeCompare(b.homeName));

/** The home with the shortest measured drive; the page's inquiry links pre-select it. */
export const nearestHome: DriveLine = camdenDrives[0];

const minutesOf = camdenDrives.map((line) => line.minutes);
/** "7 to 8", or just "7" when the homes tie. */
export const camdenRange = Math.min(...minutesOf) === Math.max(...minutesOf)
  ? `${Math.min(...minutesOf)}`
  : `${Math.min(...minutesOf)} to ${Math.max(...minutesOf)}`;

const drivePhrase = (line: DriveLine): string => `${line.homeName} is about ${line.minutes} minutes (${line.miles.toFixed(1)} miles)`;

export const camdenClark = {
  title: "Travel Nurse Housing near Camden Clark, Parkersburg WV",
  description: `Furnished homes ${camdenRange} minutes from WVU Medicine Camden Clark in Parkersburg, WV: measured drives, what we have confirmed, and what to ask first.`,
  eyebrow: "Camden Clark Medical Center, Parkersburg, WV",
  h1: "Furnished housing near WVU Medicine Camden Clark in Parkersburg, WV",
  lede: `Working at Camden Clark? Broad Cottage and Oak Cottage are whole furnished homes on Broad Street in Parkersburg, ${camdenRange} minutes from the hospital by car. Your own front door, a full kitchen and fiber-optic internet, instead of a hotel room for thirteen weeks.`,
  intro: "Below are the measured drive from each home, what we have and have not confirmed for nights and parking, and the grocery store, park and interstate around you. If we have not checked something, we say so and confirm it in writing before you commit.",
  inquiryLabel: `Check dates for ${nearestHome.homeName}`,
  crumbName: "Camden Clark",
} as const;

export const camdenCrumbs = (): { name: string; href: string }[] => [
  { name: "Home", href: "/" },
  { name: "Travel nurses", href: hubHref },
  { name: camdenClark.crumbName, href: camdenClarkHref },
];

// Area around the hospital: only destinations that exist in _data/distances.json.

type AreaPlace = { id: string; note: string };

/** Destinations from distances.json worth a night-shift nurse's attention, with a plain line each. */
const areaPlaces: AreaPlace[] = [
  { id: "camden-clark", note: "Where you clock in." },
  { id: "kroger-7th-parkersburg", note: "A full-service grocery store near City Park. Check its hours before a run after a late shift." },
  { id: "parkersburg-city-park", note: "Shelters, playgrounds, tennis and pickleball courts and walking paths, for a walk to wind down." },
  { id: "downtown-parkersburg", note: "Measured to the Smoot Theatre on 5th Street." },
  { id: "i77-parkersburg", note: "The nearest I-77 on-ramp, for trips up and down the valley." },
];

export type AreaDrive = { homeId: string; homeName: string; minutes: number; miles: number; share: number };
export type AreaRow = { id: string; label: string; note: string; drives: AreaDrive[] };

const areaDrives = areaPlaces.map((place) => ({ place, lines: nearbyHomeIds.map((id) => drive(id, place.id)) }));
const areaMax = Math.max(...areaDrives.flatMap(({ lines }) => lines.map((line) => line.minutes)));

export const areaRows: AreaRow[] = areaDrives.map(({ place, lines }) => ({
  id: place.id,
  label: lines[0].label,
  note: place.note,
  drives: lines.map((line) => ({
    homeId: line.homeId,
    homeName: line.homeName,
    minutes: line.minutes,
    miles: line.miles,
    share: Math.max(4, (line.minutes / areaMax) * 100),
  })),
}));

export const areaChartLabel =
  `Bar chart of drive minutes from ${nearbyHomeIds.map((id) => microsite(id).name).join(" and ")}. ` +
  areaRows.map((row) => `${row.label}: ${row.drives.map((entry) => `${entry.homeName} ${entry.minutes} minutes`).join(", ")}`).join(". ") +
  ". The same numbers are in the table below.";

const areaMeasured = formatMeasured(
  areaDrives.flatMap(({ lines }) => lines.map((line) => line.measured)).sort().at(-1) ?? "",
);

export const areaSource =
  `Routes from OpenStreetMap data (OSRM), measured ${areaMeasured} from each home's approved street address. Free-flow driving times, so allow longer at shift change and in bad weather.`;

/** A gap the page states rather than papers over: nothing here was measured, so nothing is listed. */
export const areaGap =
  "We have not measured the drive to a gym, a pharmacy or a restaurant that is open late, so we do not list one. Ask us when you inquire, and check opening hours yourself before you rely on any of them.";

// Nights and parking: repeat each home's own facts, with their status.

export type ShiftCell = { label: string; text: string; status: string; confirmed: boolean };
export type ShiftRow = { homeId: string; homeName: string; href: string; cells: ShiftCell[] };

const shiftFacts = ["Parking", "Laundry", "Internet", "Setting"] as const;

const shiftCell = (home: HomeMicrosite, label: (typeof shiftFacts)[number]): ShiftCell => {
  const fact = home.facts.find((entry) => entry.label === label);
  if (!fact) return { label, text: "Confirm on inquiry", status: statusLabel.confirm, confirmed: false };
  if (fact.status === "confirm") {
    const text = /^confirm/i.test(fact.value) ? "Confirm on inquiry" : `${fact.value}. Confirm on inquiry.`;
    return { label, text, status: statusLabel.confirm, confirmed: false };
  }
  return { label, text: fact.value, status: statusLabel[fact.status], confirmed: true };
};

export const shiftRows: ShiftRow[] = nearbyHomeIds.map((id) => {
  const home = microsite(id);
  return { homeId: id, homeName: home.name, href: homeHref(home), cells: shiftFacts.map((label) => shiftCell(home, label)) };
});

/** What the homes' own pages and photos say about sleeping by day and a long contract. */
export const nightNotes = [
  "Broad Cottage is a one-bedroom with a queen bed and a desk and chair by the bedroom window, and a washer and dryer in the home. Both are visible in its photos.",
  "Oak Cottage has three bedrooms, each with a made bed, a nightstand and lamp, and a curtained window in its photos. Its listing calls the setting quiet.",
  "Oak Cottage's photos show wooden steps leading down the slope from the house to the street. Worth knowing if you carry bags or groceries.",
  "Fiber-optic internet is listed for both homes, for charting, calls and streaming between shifts. Broad Cottage's speed is still to be confirmed.",
];

export const nightConfirm = [
  "Parking space for your car, and the street rules",
  "Blackout shades or curtains on the bedroom you would sleep in",
  "Which bedroom is farthest from the street, and how quiet the street is in the daytime",
  "Late arrival after a night shift, and how you get in",
  "Washer and dryer at Oak Cottage",
];

export const camdenFaqs: Faq[] = [
  {
    q: "How far is Camden Clark from your homes?",
    a: `${camdenDrives.map(drivePhrase).join(" and ")} by car, measured from each home's street address in free-flow driving, so allow longer at shift change and in bad weather. Buck Cottage is also in Parkersburg; its street address is not published, so we give you its drive when you inquire.`,
  },
  {
    q: "Where do I park, and what about getting home after a night shift?",
    a: "Neither home's parking is confirmed for your car yet. Oak Cottage's listing mentions off-street parking, and Broad Cottage's parking is to be confirmed. Ask us before you commit for your space, the street rules and how a late arrival works, and we answer in writing for the home you want.",
  },
  {
    q: "Can I sleep through the day there?",
    a: "We cannot promise silence, and we have not confirmed blackout shades for either home. Oak Cottage's listing calls the setting quiet, and each home's page shows its real bedroom photos. Ask which bedroom is farthest from the street and what covers its windows, and we answer for the home you are considering.",
  },
  {
    q: "Is Mt Cottages part of WVU Medicine or Camden Clark?",
    a: "No. Mt Cottages is an independent furnished-housing company. It is not affiliated with, endorsed by or sponsored by WVU Medicine or Camden Clark Medical Center. The hospital's name is used only to say where our homes are in relation to it.",
  },
  {
    q: "Will my housing stipend cover it?",
    a: "Your agency sets your stipend in your contract, not GSA and not us. Our travel nurse page sets the federal lodging per diem beside our monthly guide prices so you can compare, and says plainly that it is a reference, not a promise. Send your dates and we confirm the current price and what it includes before you decide.",
  },
];

export const camdenDisclaimer =
  "Mt Cottages is an independent furnished-housing company. It is not affiliated with, endorsed by or sponsored by WVU Medicine or Camden Clark Medical Center. The hospital's name is used only to say where our homes are in relation to it.";
