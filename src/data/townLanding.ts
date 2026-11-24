/**
 * Town landing pages (Growth M1: #24 Parkersburg, #28 Marietta, #41 Ravenswood). Each town
 * guide that targets "furnished rentals in <town>" searches is rendered by
 * src/components/TownLanding.astro from one entry here.
 *
 * Honesty rules, enforced by e2e/tests/town-landing.spec.js:
 * - A price is shown only for a home whose rate the owner confirmed
 *   (notes/owner-decisions.md row 1); every other home says "confirm on inquiry".
 * - Drive and walk times are measured routes, with the source and date on the page.
 *   Every figure, in the tables and in the prose, is read from _data/distances.json
 *   (measuredDrive / measuredWalk); never type a minute or mile count here (#26).
 * - Facts that are not confirmed for every home are listed as "confirm on inquiry".
 * - Homes the CEO parked (Yellow, Walnut) are never listed.
 */
import type { Photo } from "./site";
import type { StayTown } from "./stay-link";
import { homes } from "./homes";
import type { HomeMicrosite } from "./homes/types";
import { formatMeasured, measuredDrive as drive, measuredWalk as walk, type MeasuredRoute } from "./distances";
import broadLiving from "../../assets/images/cottages/parkersburg-01/photo-44.avif";
import frederickBackyard from "../../assets/images/cottages/marietta-01/frederick-backyard-cover.jpg";
import henriettaYard from "../../assets/images/cottages/ravenswood-03/photo-36.avif";

/** Homes whose monthly price guide the owner confirmed. Only these show a price on a town landing page. */
export const confirmedPriceHomes: readonly string[] = ["frederick"];

export type TownLandingHome = {
  id: string;
  /** One honest line on who this home suits best. */
  fit: string;
  /** Short facts for the card, taken from the home's own fact list. */
  facts: string[];
};

export type RouteTime = { minutes: number; miles: number };

export type DistanceRow = {
  homeId: string;
  /** One value per destination column, in order; null when the home has no published address. */
  times: (RouteTime | null)[];
  /** Shown in place of the times when all are null, or under the home's name when they are measured from somewhere else (a town centre). */
  note?: string;
};

export type Audience = {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
  /** A more specific page for this audience in this town, e.g. one hospital's landing (#33). */
  more?: { href: string; label: string };
};

export type Faq = { q: string; a: string };

export type TownLanding = {
  /** Matches the key in locationData (src/data/site.ts). */
  key: string;
  /** Site path of the page, as in locationData (build.format "preserve"). */
  path: string;
  /** Full town name used in breadcrumbs and copy, e.g. "Parkersburg, West Virginia". */
  town: string;
  /** Short form used in buttons, e.g. "Parkersburg". */
  shortTown: string;
  /** <title>, 60 characters or fewer. */
  title: string;
  /** Meta description, 160 characters or fewer. */
  description: string;
  eyebrow: string;
  h1: string;
  /** First paragraph: carries the town's priority-1 search phrases in plain sentences. */
  lede: string;
  intro: string;
  hero: Photo;
  /** Town the page's "Check dates" links pre-select; the links are built with stayLink (#20). */
  stayTown: StayTown;
  /** When the town has a single home, its "Check dates" links pre-select that home instead. */
  stayHome?: string;
  inquiryLabel: string;
  homesHeading: string;
  homesIntro: string;
  homes: TownLandingHome[];
  distance: {
    heading: string;
    intro: string;
    mode: "drive" | "drive-walk";
    destinations: string[];
    rows: DistanceRow[];
    /** Walking times, same shape as rows; only for "drive-walk". */
    walkRows?: DistanceRow[];
    source: string;
  };
  /** Optional narrative about the town (history, walkability, the river). */
  story?: { eyebrow: string; heading: string; paragraphs: string[] };
  included: string[];
  confirm: string[];
  audiences: Audience[];
  faqs: Faq[];
  /** Other town pages to cross-link. */
  nearbyTowns: { name: string; href: string }[];
};

const homeById = new Map(homes.map((home) => [home.id, home]));

/** The live microsite for a landing-page home; throws at build time if the id is wrong or parked. */
export const landingHome = (id: string): HomeMicrosite => {
  const home = homeById.get(id);
  if (!home) throw new Error(`Town landing lists "${id}", which has no live home microsite`);
  return home;
};

const measuredOn = (routes: MeasuredRoute[]): string =>
  [...new Set(routes.map((route) => route.measured))].sort().map(formatMeasured).join(" and ");

/** The source line under a distance table, dated from the measurements it shows. */
const routeSource = (drives: MeasuredRoute[], walks: MeasuredRoute[] = []): string =>
  `Driving routes from OpenStreetMap data (OSRM), measured ${measuredOn(drives)}.` +
  (walks.length > 0 ? ` Walking routes from the OpenStreetMap foot profile (FOSSGIS OSRM), measured ${measuredOn(walks)}.` : "") +
  " Free-flow driving times; allow longer at shift change and in bad weather.";

// Parkersburg: Broad and Oak have approved addresses; Buck does not, so it gets no times.
const parkersburgDestinations = ["camden-clark", "downtown-parkersburg", "i77-parkersburg"];
const broadDrives = parkersburgDestinations.map((id) => drive("broad", id));
const oakDrives = parkersburgDestinations.map((id) => drive("oak", id));
const broadCamden = drive("broad", "camden-clark");
const oakCamden = drive("oak", "camden-clark");
const oakI77 = drive("oak", "i77-parkersburg");

// Marietta: Frederick, from its approved address.
const mariettaDestinations = ["marietta-memorial", "marietta-college", "downtown-marietta", "kroger-acme-marietta"];
const frederickDrives = mariettaDestinations.map((id) => drive("frederick", id));
const frederickWalks = mariettaDestinations.map((id) => walk("frederick", id));
const frederickMemorial = drive("frederick", "marietta-memorial");
const frederickCollege = drive("frederick", "marietta-college");
const frederickDowntown = drive("frederick", "downtown-marietta");
const frederickSelby = drive("frederick", "selby-general");
const frederickKrogerWalk = walk("frederick", "kroger-acme-marietta");

// Ravenswood: Henrietta from its approved address; Virginia's street address is not
// published, so its times are the Ravenswood town centre's (the microsites map in
// distances.json), and the page says so.
const ravenswoodDestinations = ["constellium-ravenswood", "jackson-general", "i77-ravenswood", "ravenswood-high-school"];
const henriettaDrives = ravenswoodDestinations.map((id) => drive("henrietta", id));
const virginiaDrives = ravenswoodDestinations.map((id) => drive("virginia", id));
const henriettaConstellium = drive("henrietta", "constellium-ravenswood");
const virginiaConstellium = drive("virginia", "constellium-ravenswood");
const henriettaJackson = drive("henrietta", "jackson-general");
const virginiaJackson = drive("virginia", "jackson-general");
const henriettaI77 = drive("henrietta", "i77-ravenswood");
const henriettaSchool = drive("henrietta", "ravenswood-high-school");
const henriettaRiverfront = drive("henrietta", "riverfront-park-ravenswood");
const henriettaFoodfair = drive("henrietta", "foodfair-ravenswood");
const span = (a: MeasuredRoute, b: MeasuredRoute) => (a.minutes === b.minutes ? `${a.minutes}` : `${Math.min(a.minutes, b.minutes)} to ${Math.max(a.minutes, b.minutes)}`);

export const townLandings = {
  parkersburg: {
    key: "parkersburg",
    path: "parkersburg/index.html",
    town: "Parkersburg, West Virginia",
    shortTown: "Parkersburg",
    title: "Furnished Rentals in Parkersburg, WV | Mt Cottages",
    description: "Furnished homes for monthly stays in Parkersburg, WV, minutes from Camden Clark, downtown and I-77. Need a shorter stay? Ask about your dates.",
    eyebrow: "Parkersburg, West Virginia",
    h1: "Furnished rentals in Parkersburg, WV",
    lede: "Looking for a furnished apartment, a monthly rental or a short-term rental in Parkersburg, WV? Mt Cottages offers whole furnished homes instead: your own front door, a full kitchen and fiber-optic internet, a few minutes from WVU Medicine Camden Clark, downtown and I-77.",
    intro: "Three homes are live in Parkersburg today, from a one-bedroom for a single assignment to a three-bedroom for a household. Bring a suitcase; the furniture, kitchen and internet are already here. We confirm price, dates and the details below before you commit to anything.",
    hero: { src: broadLiving, alt: "Broad Cottage living room in Parkersburg with wood paneling, a sectional sofa, a coffee table and a wall-mounted TV", focal: "center 45%" },
    stayTown: "parkersburg",
    inquiryLabel: "Check dates in Parkersburg",
    homesHeading: "Three furnished homes in Parkersburg",
    homesIntro: "Each home has its own site with every photo, an illustrative floor plan, amenities and a map. Pick the one that fits your household, then ask about your dates.",
    homes: [
      { id: "broad", fit: "Best for one person or a couple who wants laundry in the home and a desk in the bedroom.", facts: ["1 bedroom, queen bed", "1 bath with tub", "Washer and dryer in the home"] },
      { id: "buck", fit: "Best for one person or a couple who wants a compact, easy home with a covered front porch.", facts: ["1 bedroom", "Full bath with tub and shower", "Covered front porch"] },
      { id: "oak", fit: "Best for a family or a small team who needs three bedrooms and a dining table.", facts: ["3 bedrooms", "Dining room and oak kitchen", "Covered porch"] },
    ],
    distance: {
      heading: "Minutes, not miles",
      intro: "Broad and Oak Cottages sit a few blocks apart on Broad Street in North Parkersburg. Here is how long the drive takes to the places most guests ask about.",
      mode: "drive",
      destinations: ["WVU Medicine Camden Clark", "Downtown (5th Street)", "I-77 on-ramp (WV 47)"],
      rows: [
        { homeId: "broad", times: broadDrives },
        { homeId: "oak", times: oakDrives },
        { homeId: "buck", times: [null, null, null], note: "Buck Cottage's street address is not published. We share it, and exact drive times, when you inquire." },
      ],
      source: routeSource([...broadDrives, ...oakDrives]),
    },
    included: [
      "Furnished throughout: beds, seating, tables and the everyday things a home needs",
      "A full kitchen in every home",
      "Fiber-optic internet",
      "A whole home to yourself, with your own entrance and kitchen",
      "A local team for questions and care during the stay",
    ],
    confirm: [
      "Monthly price and what utilities it covers",
      "Minimum stay and your exact dates",
      "Parking arrangement",
      "Pet policy",
      "How many guests each home sleeps",
    ],
    audiences: [
      { title: "Travel nurses and Camden Clark staff", body: `A quiet place to sleep after a night shift. Broad and Oak Cottages are ${broadCamden.minutes} to ${oakCamden.minutes} minutes from the hospital, with a full kitchen so a thirteen-week contract is not thirteen weeks of takeout.`, href: "/travel-nurses/", linkLabel: "Travel nurse housing and the stipend guide", more: { href: "/travel-nurses/camden-clark/", label: "Furnished homes near Camden Clark" } },
      { title: "Crews and project teams", body: `Oak Cottage gives a small team three bedrooms under one roof, with I-77 about ${oakI77.minutes} minutes away for sites up and down the valley.`, href: "/corporate-housing/", linkLabel: "Corporate and crew housing" },
      { title: "Relocating families", body: "Land in a furnished home while you learn the neighborhoods, sort out schools and look for something permanent.", href: "/family-stays.html", linkLabel: "Family stays" },
      { title: "Displaced by a fire or flood", body: "A furnished home near your own while repairs happen. Tell us your timeline and what your insurer needs, and we will check which home fits.", href: "/insurance-housing/", linkLabel: "Insurance housing" },
    ],
    faqs: [
      { q: "Do you rent by the month in Parkersburg?", a: "Yes. Our Parkersburg homes are set up for monthly stays, from a few months to longer. Tell us your dates and we will confirm the price and what it includes before you decide." },
      { q: "Are these furnished apartments?", a: "They are whole furnished homes rather than apartments. Each has its own entrance, a full kitchen, furnished bedrooms and living space, and fiber-optic internet." },
      { q: "Can I book a short-term rental for a few nights or weeks?", a: "Our homes are set up for longer stays, so the minimum stay is confirmed with you on inquiry. If you need a few weeks, ask anyway: we will tell you straight away whether a home can work." },
      { q: "How close are the homes to WVU Medicine Camden Clark?", a: `Broad Cottage is about ${broadCamden.minutes} minutes (${broadCamden.miles} miles) by car and Oak Cottage about ${oakCamden.minutes} minutes (${oakCamden.miles} miles), on measured routes in normal traffic. We share Buck Cottage's street and drive time when you inquire.` },
      { q: "What is included in the price?", a: "Every home is furnished, with a full kitchen and fiber-optic internet. Which utilities are covered, parking and the pet policy differ by home, so we confirm each one in writing before you commit." },
      { q: "Is sending an inquiry a commitment?", a: "No. An inquiry starts a conversation about current options. Any screening, agreement or payment is a separate step that comes later, with its own documents." },
    ],
    nearbyTowns: [
      { name: "Marietta, Ohio", href: "/marietta/index.html" },
      { name: "Ravenswood, West Virginia", href: "/ravenswood/index.html" },
    ],
  },
  marietta: {
    key: "marietta",
    path: "marietta/index.html",
    town: "Marietta, Ohio",
    shortTown: "Marietta",
    title: "Furnished Rentals in Marietta, Ohio | Mt Cottages",
    description: "A furnished three-bedroom home for monthly stays in Marietta, Ohio, minutes from Marietta Memorial Hospital, Marietta College and downtown.",
    eyebrow: "Marietta, Ohio",
    h1: "Furnished rentals in Marietta, Ohio",
    lede: `Looking for a furnished apartment, a monthly rental or a short-term rental in Marietta, Ohio? Frederick Cottage is a furnished three-bedroom house on the city's east side: about ${frederickMemorial.minutes} minutes from Marietta Memorial Hospital, ${frederickCollege.minutes} from Marietta College and ${frederickDowntown.minutes} from the riverfront downtown.`,
    intro: "It comes ready to live in, with a full kitchen, a washer and dryer, fast wired internet and a fenced backyard. Stays start at 30 days, and we confirm the current rate and your dates before you commit to anything.",
    hero: { src: frederickBackyard, alt: "Frederick Cottage backyard in Marietta, Ohio, with a lawn, a white picket fence, patio seating and autumn trees", focal: "50% 40%" },
    stayTown: "marietta",
    // One home in town, so the town CTAs ask about Frederick directly.
    stayHome: "frederick",
    inquiryLabel: "Check dates at Frederick Cottage",
    homesHeading: "Frederick Cottage, our Marietta home",
    homesIntro: "Frederick has its own site with every photo, the bedrooms room by room, a resident guide and directions. Start there, then ask about your dates.",
    homes: [
      { id: "frederick", fit: "Best for a travel nurse who wants room to spread out, a family between homes, or two or three colleagues sharing a house.", facts: ["3 bedrooms: king, double, queen", "1 full bath", "Washer and dryer", "1 Gbps wired internet and wifi", "Fenced backyard"] },
    ],
    distance: {
      heading: "Minutes from work, a short walk to groceries",
      intro: "Frederick Cottage is on a residential street on the east side of Marietta. Here is how long it takes to reach the places guests ask about, by car and on foot.",
      mode: "drive-walk",
      destinations: ["Marietta Memorial Hospital", "Marietta College", "Downtown (Putnam Street)", "Kroger and pharmacy (Acme Street)"],
      rows: [{ homeId: "frederick", times: frederickDrives }],
      walkRows: [{ homeId: "frederick", times: frederickWalks }],
      source: routeSource(frederickDrives, frederickWalks),
    },
    story: {
      eyebrow: "Why Marietta",
      heading: "Ohio's first city, on two rivers",
      paragraphs: [
        "Marietta was founded in 1788 where the Muskingum River meets the Ohio, as the first permanent American settlement in the Northwest Territory. That history is still on the street: brick sidewalks, old churches, river-town storefronts and Marietta College's campus a few blocks from Front Street.",
        `Downtown is made for walking. Park once and you can spend an evening on Front Street, along the levee and on the paved riverfront trail, then drive home in about ${frederickDowntown.minutes} minutes. Closer to the house, Kroger and its pharmacy are a ${frederickKrogerWalk.minutes}-minute walk, with a short wetland trail behind the store.`,
        "Marietta sits across the Ohio River from Williamstown, West Virginia, a short drive up I-77 from Parkersburg, so the whole Mid-Ohio Valley is within easy reach.",
      ],
    },
    included: [
      "Furnished throughout, with a bed in each of the three bedrooms",
      "A full kitchen with a gas range, oven and dishwasher",
      "Washer and dryer in the home",
      "1 Gbps wired internet and wifi",
      "A fenced backyard with patio seating",
      "A resident guide and a local team for questions during the stay",
    ],
    confirm: [
      "Which utilities the monthly rate covers",
      "Your exact dates and the current rate",
      "Parking spaces and street rules",
      "Pet policy",
      "Whether the bath has a tub or a shower only",
    ],
    audiences: [
      { title: "Travel nurses at Memorial Health System", body: `About ${frederickMemorial.minutes} minutes to Marietta Memorial Hospital and ${frederickSelby.minutes} to Selby General, with a full kitchen and a quiet bedroom for days after nights.`, href: "/travel-nurses/", linkLabel: "Travel nurse housing and the stipend guide", more: { href: "/travel-nurses/memorial-health-marietta/", label: "Housing near Marietta Memorial, for staff and residents" } },
      { title: "Faculty, researchers and visiting staff", body: `Marietta College is a ${frederickCollege.minutes}-minute drive. A semester or a research term is easier from a real home with a kitchen and fast wired internet.`, href: "/corporate-housing/", linkLabel: "Housing for work stays and new hires" },
      { title: "Families between homes", body: "Three bedrooms, a long dining table and a fenced yard give a household room to settle while you find a permanent place in the valley.", href: "/family-stays.html", linkLabel: "Family stays" },
      { title: "Displaced by a fire or flood", body: "A furnished house nearby while repairs happen. Tell us your timeline and what your insurer needs, and we will check whether Frederick fits.", href: "/insurance-housing/", linkLabel: "Insurance housing" },
    ],
    faqs: [
      { q: "Do you rent furnished homes by the month in Marietta, Ohio?", a: "Yes. Frederick Cottage is a furnished three-bedroom house in Marietta, Ohio, with a monthly guide of $2,575. Stays start at 30 days. We confirm the current rate, your dates and what the rate covers before you commit." },
      { q: "Is this Marietta, Ohio, or Marietta, Georgia?", a: "Marietta, Ohio: the river town in Washington County, across the Ohio River from Williamstown, West Virginia. All of our homes are in the Mid-Ohio Valley." },
      { q: "Can I rent for less than a month?", a: "Frederick's minimum stay is 30 days. Shorter stays are priced on inquiry, so tell us your dates and we will tell you straight away whether they can work." },
      { q: "How far is Frederick Cottage from the hospitals?", a: `About ${frederickMemorial.minutes} minutes (${frederickMemorial.miles} miles) by car to Marietta Memorial Hospital and about ${frederickSelby.minutes} minutes (${frederickSelby.miles} miles) to Selby General Hospital, on measured routes in normal traffic.` },
      { q: "What is included?", a: "The house is furnished, with a full kitchen, a washer and dryer, 1 Gbps wired internet and wifi, and a fenced backyard. Which utilities the rate covers, parking and the pet policy are confirmed with you in writing first." },
      { q: "Is sending an inquiry a commitment?", a: "No. An inquiry starts a conversation about current options. Any screening, agreement or payment is a separate step that comes later, with its own documents." },
    ],
    nearbyTowns: [
      { name: "Parkersburg, West Virginia", href: "/parkersburg/index.html" },
      { name: "Ravenswood, West Virginia", href: "/ravenswood/index.html" },
    ],
  },
  ravenswood: {
    key: "ravenswood",
    path: "ravenswood/index.html",
    town: "Ravenswood, West Virginia",
    shortTown: "Ravenswood",
    title: "Furnished Rentals in Ravenswood, WV | Mt Cottages",
    description: `Two furnished homes for monthly stays in Ravenswood, WV, on the Ohio River: ${span(henriettaConstellium, virginiaConstellium)} minutes from the Constellium plant and about ${span(henriettaJackson, virginiaJackson)} from Ripley.`,
    eyebrow: "Ravenswood, West Virginia",
    h1: "Furnished rentals in Ravenswood, WV",
    lede: `Looking for a furnished apartment, a monthly rental or a short-term rental in Ravenswood, WV? Henrietta and Virginia Cottages are whole furnished homes in this Ohio River town: about ${span(henriettaConstellium, virginiaConstellium)} minutes from the Constellium plant, ${span(henriettaJackson, virginiaJackson)} from Jackson General Hospital in Ripley and ${henriettaI77.minutes} from I-77.`,
    intro: "Both are two-bedroom houses with a full kitchen and room for a couple, a small family or two colleagues. We confirm the price, your dates and every detail marked below before you commit to anything.",
    hero: { src: henriettaYard, alt: "Henrietta Cottage's fenced lawn in Ravenswood, with mature trees seen from the porch", focal: "center 50%" },
    stayTown: "ravenswood",
    inquiryLabel: "Check dates in Ravenswood",
    homesHeading: "Two furnished homes in Ravenswood",
    homesIntro: "Each home has its own site with every photo, an illustrative floor plan, amenities and a map. Pick the one that fits your household, then ask about your dates.",
    homes: [
      { id: "henrietta", fit: "Best for a couple or a small family who wants two dining spaces, a working kitchen and a fenced lawn.", facts: ["2 bedrooms", "Kitchen with a gas range and dishwasher", "Fenced lawn with mature trees"] },
      { id: "virginia", fit: "Best for someone who likes an older house with character: a brick fireplace, a curved staircase and a sunny dining room.", facts: ["2 bedrooms", "Fiber-optic internet", "Utilities included"] },
    ],
    distance: {
      heading: "Close to the plant, the hospital road and I-77",
      intro: "Henrietta Cottage is a few blocks from downtown Ravenswood, measured from its street address. Virginia Cottage's street address is shared when you inquire, so its times are measured from the Ravenswood town centre.",
      mode: "drive",
      destinations: ["Constellium Ravenswood", "Jackson General, Ripley", "I-77, Exit 146", "Ravenswood High School"],
      rows: [
        { homeId: "henrietta", times: henriettaDrives },
        { homeId: "virginia", times: virginiaDrives, note: "From the Ravenswood town centre" },
      ],
      source: routeSource([...henriettaDrives, ...virginiaDrives]),
    },
    story: {
      eyebrow: "Why Ravenswood",
      heading: "A small river town with a short commute",
      paragraphs: [
        `Ravenswood sits on the Ohio River in Jackson County, West Virginia. Life here is small-town and close together: from Henrietta Cottage, Washington Riverfront Park and the Foodfair grocery are each about ${henriettaRiverfront.minutes === henriettaFoodfair.minutes ? `${henriettaRiverfront.minutes} minutes` : `${henriettaRiverfront.minutes} and ${henriettaFoodfair.minutes} minutes`} by car.`,
        `Ravenswood High School is about ${henriettaSchool.minutes} minutes from Henrietta Cottage, close enough that a Friday-night football game is an easy evening out, and a family moving here can keep the school run short.`,
        `For work, the Constellium plant is about ${henriettaConstellium.minutes} minutes south of town and I-77 about ${henriettaI77.minutes}, which puts Ripley, Parkersburg and Charleston within a regular drive.`,
      ],
    },
    included: [
      "A whole home to yourself, with your own entrance and kitchen",
      "A full kitchen in each home",
      "Two bedrooms in each home",
      "A local team for questions and care during the stay",
    ],
    confirm: [
      "Monthly price and what utilities it covers",
      "Minimum stay and your exact dates",
      "Bed sizes and how many guests each home sleeps",
      "Bathrooms, laundry and parking",
      "How Virginia Cottage is furnished for your dates",
      "Pet policy",
    ],
    audiences: [
      { title: "Travel nurses at Jackson General", body: `Jackson General Hospital is in Ripley, about ${span(henriettaJackson, virginiaJackson)} minutes south by car. A furnished house in Ravenswood gives a thirteen-week contract a quiet bedroom and a full kitchen.`, href: "/travel-nurses/", linkLabel: "Travel nurse housing and the stipend guide", more: { href: "/travel-nurses/jackson-general/", label: "Furnished homes near Jackson General" } },
      { title: "Plant crews and new hires", body: `The Constellium plant is about ${span(henriettaConstellium, virginiaConstellium)} minutes away, and two bedrooms let two colleagues share a house on a shutdown or a new posting.`, href: "/corporate-housing/", linkLabel: "Corporate and crew housing" },
      { title: "Relocating families", body: "Land in a furnished home while you learn the town, settle the children at school and look for something permanent.", href: "/family-stays.html", linkLabel: "Family stays" },
      { title: "Displaced by a fire or flood", body: "A furnished house nearby while repairs happen. Tell us your timeline and what your insurer needs, and we will check which home fits.", href: "/insurance-housing/", linkLabel: "Insurance housing" },
    ],
    faqs: [
      { q: "Do you rent furnished homes by the month in Ravenswood, WV?", a: "Yes. Henrietta and Virginia Cottages are set up for stays of a month or longer. Tell us your dates and we will confirm the price and what it includes before you decide." },
      { q: "Are these furnished apartments?", a: "They are whole furnished homes rather than apartments. Each has its own entrance, a full kitchen and two bedrooms." },
      { q: "Can I book a short-term rental for a few nights or weeks?", a: "Our homes are set up for longer stays, so the minimum stay is confirmed with you on inquiry. If you need a few weeks, ask anyway: we will tell you straight away whether a home can work." },
      { q: "How far are the homes from the Constellium plant?", a: `Henrietta Cottage is about ${henriettaConstellium.minutes} minutes (${henriettaConstellium.miles} miles) by car, on a measured route in normal traffic. Virginia Cottage's street address is shared on inquiry; from the Ravenswood town centre the drive is about ${virginiaConstellium.minutes} minutes.` },
      { q: "How far is Jackson General Hospital from Ravenswood?", a: `Jackson General Hospital is in Ripley, about ${henriettaJackson.minutes} minutes (${henriettaJackson.miles} miles) by car from Henrietta Cottage on a measured route. Allow longer at shift change and in bad weather.` },
      { q: "Is sending an inquiry a commitment?", a: "No. An inquiry starts a conversation about current options. Any screening, agreement or payment is a separate step that comes later, with its own documents." },
    ],
    nearbyTowns: [
      { name: "Parkersburg, West Virginia", href: "/parkersburg/index.html" },
      { name: "Marietta, Ohio", href: "/marietta/index.html" },
    ],
  },
} satisfies Record<string, TownLanding>;
