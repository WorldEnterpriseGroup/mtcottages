import type { ImageMetadata } from "astro";

import mariettaExterior from "../../assets/images/cottages/marietta-01/frederick-exterior-safe.avif";
import mariettaKitchen from "../../assets/images/cottages/marietta-01/gallery-01.avif";
import mariettaLiving from "../../assets/images/cottages/marietta-01/photo-39.avif";
import mariettaBedroom from "../../assets/images/cottages/marietta-01/photo-36.avif";
import mariettaSecondBedroom from "../../assets/images/cottages/marietta-01/photo-25.avif";
import mariettaDining from "../../assets/images/cottages/marietta-01/photo-27.avif";

import broadLiving from "../../assets/images/cottages/parkersburg-01/photo-44.avif";
import broadLivingAlt from "../../assets/images/cottages/parkersburg-01/photo-06.avif";
import broadBedroom from "../../assets/images/cottages/parkersburg-01/photo-01.avif";
import broadBedroomAlt from "../../assets/images/cottages/parkersburg-01/photo-49.avif";
import broadBathroom from "../../assets/images/cottages/parkersburg-01/photo-20.avif";
import broadVanity from "../../assets/images/cottages/parkersburg-01/photo-12.avif";

import buckExterior from "../../assets/images/cottages/parkersburg-02/homepage-hero-buck.avif";
import buckExteriorAlt from "../../assets/images/cottages/parkersburg-02/photo-09.avif";
import buckLiving from "../../assets/images/cottages/parkersburg-02/photo-49.avif";
import buckLivingAlt from "../../assets/images/cottages/parkersburg-02/photo-50.avif";
import buckBedroom from "../../assets/images/cottages/parkersburg-02/photo-38.avif";
import buckBathroom from "../../assets/images/cottages/parkersburg-02/photo-41.avif";

import yellowExterior from "../../assets/images/cottages/parkersburg-03/photo-145.avif";
import yellowExteriorAlt from "../../assets/images/cottages/parkersburg-03/photo-07.avif";
import yellowKitchen from "../../assets/images/cottages/parkersburg-03/photo-448.avif";
import yellowBathroom from "../../assets/images/cottages/parkersburg-03/photo-468.avif";

import oakDining from "../../assets/images/cottages/parkersburg-04/homepage-hero-oak-dining.avif";
import oakKitchen from "../../assets/images/cottages/parkersburg-04/photo-08.avif";
import oakBedroom from "../../assets/images/cottages/parkersburg-04/photo-07.avif";
import oakBedroomAlt from "../../assets/images/cottages/parkersburg-04/photo-17.avif";
import oakBathroom from "../../assets/images/cottages/parkersburg-04/photo-40.avif";
import oakPorch from "../../assets/images/cottages/parkersburg-04/photo-05.avif";

import whiteExterior from "../../assets/images/cottages/ravenswood-01/photo-01.avif";
import whiteExteriorAlt from "../../assets/images/cottages/ravenswood-01/photo-03.avif";
import whiteFireplace from "../../assets/images/cottages/ravenswood-01/photo-374.avif";
import whiteLiving from "../../assets/images/cottages/ravenswood-01/photo-165.avif";
import whiteBedroom from "../../assets/images/cottages/ravenswood-01/photo-297.avif";
import whiteBedroomAlt from "../../assets/images/cottages/ravenswood-01/photo-125.avif";
import whiteBathroom from "../../assets/images/cottages/ravenswood-01/photo-108.avif";

import virginiaLiving from "../../assets/images/cottages/ravenswood-02/photo-117.avif";
import virginiaKitchen from "../../assets/images/cottages/ravenswood-02/photo-54.avif";
import virginiaHall from "../../assets/images/cottages/ravenswood-02/photo-53.avif";
import virginiaBedroom from "../../assets/images/cottages/ravenswood-02/photo-55.avif";
import virginiaBath from "../../assets/images/cottages/ravenswood-02/photo-77.avif";

import henriettaDining from "../../assets/images/cottages/ravenswood-03/photo-17.avif";
import henriettaLiving from "../../assets/images/cottages/ravenswood-03/photo-06.avif";
import henriettaKitchen from "../../assets/images/cottages/ravenswood-03/photo-31.avif";
import henriettaBedroom from "../../assets/images/cottages/ravenswood-03/photo-42.avif";
import henriettaBath from "../../assets/images/cottages/ravenswood-03/photo-40.avif";
import henriettaYard from "../../assets/images/cottages/ravenswood-03/photo-36.avif";

export type Photo = {
  src: ImageMetadata;
  alt: string;
  caption?: string;
  focal?: string;
};

export type Cottage = {
  id: string;
  name: string;
  town: string;
  locationPath: string;
  path: string;
  bedrooms: string;
  price: string;
  shortTerm: string;
  summary: string;
  hero: Photo;
  gallery: Photo[];
  amenities: string[];
  coverage: string[];
};

const photo = (src: ImageMetadata, alt: string, caption?: string, focal?: string): Photo => ({
  src,
  alt,
  caption,
  focal,
});

export const cottages: Cottage[] = [
  {
    id: "frederick",
    name: "Frederick Cottage",
    town: "Marietta, OH",
    locationPath: "marietta/index.html",
    path: "marietta/frederick-cottage.html",
    bedrooms: "3 Bedrooms",
    price: "$1,395/month",
    shortTerm: "Inquire for short-term pricing",
    summary: "A spacious three-bedroom furnished home with a working kitchen, room to gather, and a calm outdoor setting.",
    hero: photo(mariettaExterior, "Frederick Cottage exterior with shutters, trees, lawn, and covered entry", "A clear front-of-house view for orientation.", "center 40%"),
    gallery: [
      photo(mariettaKitchen, "Frederick Cottage kitchen with oak cabinets and full-size appliances", "The kitchen is set up for everyday meals."),
      photo(mariettaLiving, "Frederick Cottage sitting room with blue walls, seating, and natural light", "A comfortable room for settling in."),
      photo(mariettaBedroom, "Frederick Cottage primary bedroom with a large bed and windows", "The primary bedroom has room to unpack and rest."),
      photo(mariettaSecondBedroom, "Frederick Cottage second bedroom with a bed and vintage vanity", "A second bedroom with its own character."),
      photo(mariettaDining, "Frederick Cottage dining and entry area with table and staircase", "The dining area connects the home’s daily spaces."),
    ],
    amenities: ["Furnished rooms", "Full kitchen", "Washer and dryer", "Living and dining space", "Private bedrooms", "Guest support"],
    coverage: ["Exterior / arrival", "Kitchen", "Living room", "Primary bedroom", "Additional bedroom", "Dining / entry"],
  },
  {
    id: "broad",
    name: "Broad Cottage",
    town: "Parkersburg, WV",
    locationPath: "parkersburg/index.html",
    path: "parkersburg/broad-cottage.html",
    bedrooms: "2 Bedrooms",
    price: "Inquire for availability",
    shortTerm: "Flexible furnished-stay options",
    summary: "A warm, wood-paneled two-bedroom furnished home with a generous living room and practical spaces for a longer stay.",
    hero: photo(broadLiving, "Broad Cottage wood-paneled living room with sectional seating and television", "The best available public image currently shows the home’s main living space."),
    gallery: [
      photo(broadLivingAlt, "Broad Cottage living room with television and wood-paneled walls"),
      photo(broadBedroom, "Broad Cottage bedroom with red and black bedding"),
      photo(broadBedroomAlt, "Broad Cottage bedroom with an ensuite doorway"),
      photo(broadBathroom, "Broad Cottage bathroom with tub and mirror"),
      photo(broadVanity, "Broad Cottage bathroom vanity and mirror"),
    ],
    amenities: ["Furnished rooms", "Full kitchen", "Living room", "Private bedrooms", "Laundry access", "Guest support"],
    coverage: ["Living room", "Bedrooms", "Bathroom", "Vanity / storage"],
  },
  {
    id: "buck",
    name: "Buck Cottage",
    town: "Parkersburg, WV",
    locationPath: "parkersburg/index.html",
    path: "parkersburg/buck-apartment-1.html",
    bedrooms: "1 Bedroom",
    price: "$895/month",
    shortTerm: "Inquire for short-term pricing",
    summary: "A comfortable one-bedroom furnished home in Parkersburg’s north side, with an easy scale for one person or a couple.",
    hero: photo(buckExterior, "Buck Cottage front exterior with porch, centered entry, and mature trees", "A direct exterior view makes the home easy to recognize.", "center 55%"),
    gallery: [
      photo(buckExteriorAlt, "Buck Cottage exterior and surrounding street trees"),
      photo(buckLiving, "Buck Cottage living room with couch and windows"),
      photo(buckLivingAlt, "Buck Cottage living room alternate view"),
      photo(buckBedroom, "Buck Cottage bedroom with bed, desk, and windows"),
      photo(buckBathroom, "Buck Cottage bathroom with shower, sink, and toilet"),
    ],
    amenities: ["Furnished one-bedroom layout", "Full kitchen", "Living room", "Laundry access", "Parking options", "Guest support"],
    coverage: ["Exterior / arrival", "Living room", "Bedroom", "Bathroom"],
  },
  {
    id: "yellow",
    name: "Yellow Cottage",
    town: "Parkersburg, WV",
    locationPath: "parkersburg/index.html",
    path: "parkersburg/yellow-cottage.html",
    bedrooms: "2 Bedrooms",
    price: "Inquire for availability",
    shortTerm: "Flexible furnished-stay options",
    summary: "A distinctive two-bedroom home with a porch, bright exterior, full kitchen, and room to settle into a longer assignment.",
    hero: photo(yellowExterior, "Yellow Cottage exterior with porch, pale siding, windows, and blue sky", "A bright front-of-house view anchors the property story.", "center 45%"),
    gallery: [
      photo(yellowExteriorAlt, "Yellow Cottage exterior with porch and mature tree"),
      photo(yellowKitchen, "Yellow Cottage kitchen with tile backsplash, cabinets, and sink"),
      photo(yellowBathroom, "Yellow Cottage bathroom with light fixture and shower"),
    ],
    amenities: ["Furnished rooms", "Full kitchen", "Covered porch", "Private bedrooms", "Laundry access", "Guest support"],
    coverage: ["Exterior / porch", "Kitchen", "Bathroom"],
  },
  {
    id: "oak",
    name: "Oak Cottage",
    town: "Parkersburg, WV",
    locationPath: "parkersburg/index.html",
    path: "parkersburg/oak-cottage.html",
    bedrooms: "3 Bedrooms",
    price: "Inquire for availability",
    shortTerm: "Flexible furnished-stay options",
    summary: "A bright three-bedroom home with a dining room, full kitchen, several bedrooms, and a covered outdoor perch.",
    hero: photo(oakDining, "Oak Cottage bright dining room with blue table, white chairs, and window", "The strongest current public image is an inviting interior rather than a clean exterior."),
    gallery: [
      photo(oakKitchen, "Oak Cottage kitchen with oak cabinets and full-size appliances"),
      photo(oakBedroom, "Oak Cottage guest bedroom with upholstered headboard"),
      photo(oakBedroomAlt, "Oak Cottage bedroom with dresser, mirror, and artwork"),
      photo(oakBathroom, "Oak Cottage full bathroom with wood vanity"),
      photo(oakPorch, "Oak Cottage covered porch with outdoor seating and tree view"),
    ],
    amenities: ["Furnished rooms", "Full kitchen", "Dining room", "Private bedrooms", "Covered porch", "Guest support"],
    coverage: ["Dining room", "Kitchen", "Bedrooms", "Bathroom", "Porch"],
  },
  {
    id: "white",
    name: "White Cottage",
    town: "Ravenswood, WV",
    locationPath: "ravenswood/index.html",
    path: "ravenswood/white-cottage.html",
    bedrooms: "1 Bedroom",
    price: "Inquire for availability",
    shortTerm: "Flexible furnished-stay options",
    summary: "A one-bedroom furnished home with classic details, a welcoming room layout, and a quieter Ravenswood setting.",
    hero: photo(whiteExterior, "White Cottage exterior with white siding, windows, and surrounding greenery", "A clean exterior view replaces the former maintenance-adjacent image."),
    gallery: [
      photo(whiteExteriorAlt, "White Cottage backyard and side exterior with trees and lawn"),
      photo(whiteFireplace, "White Cottage living room fireplace and built-in shelving"),
      photo(whiteLiving, "White Cottage living room reading corner with green chair"),
      photo(whiteBedroom, "White Cottage bedroom with four-poster bed and dresser"),
      photo(whiteBedroomAlt, "White Cottage additional bedroom with bed and window"),
      photo(whiteBathroom, "White Cottage bathroom vanity and mirror"),
    ],
    amenities: ["Furnished one-bedroom layout", "Full kitchen", "Classic living details", "Storage", "Laundry access", "Guest support"],
    coverage: ["Exterior", "Living room", "Bedrooms", "Bathroom"],
  },
  {
    id: "virginia",
    name: "Virginia Cottage",
    town: "Ravenswood, WV",
    locationPath: "ravenswood/index.html",
    path: "ravenswood/virginia-cottage.html",
    bedrooms: "2 Bedrooms",
    price: "Inquire for availability",
    shortTerm: "Flexible furnished-stay options",
    summary: "A two-bedroom furnished home with a distinctive fireplace, bright rooms, and a flexible footprint for an extended stay.",
    hero: photo(virginiaLiving, "Virginia Cottage living room with white fireplace and built-in shelving", "The strongest usable public image is a clear living-room view; a clean front exterior is still a photo need."),
    gallery: [
      photo(virginiaKitchen, "Virginia Cottage kitchen with white cabinets and red countertop"),
      photo(virginiaHall, "Virginia Cottage hallway with wood floor and white trim"),
      photo(virginiaBedroom, "Virginia Cottage bedroom with bed and window"),
      photo(virginiaBath, "Virginia Cottage bathroom with tub, toilet, sink, and mirror"),
    ],
    amenities: ["Furnished rooms", "Full kitchen", "Fireplace feature", "Private bedrooms", "Laundry access", "Guest support"],
    coverage: ["Living room", "Kitchen", "Hallway", "Bedroom", "Bathroom"],
  },
  {
    id: "henrietta",
    name: "Henrietta Cottage",
    town: "Ravenswood, WV",
    locationPath: "ravenswood/index.html",
    path: "ravenswood/henrietta-cottage.html",
    bedrooms: "2 Bedrooms",
    price: "Inquire for availability",
    shortTerm: "Flexible furnished-stay options",
    summary: "A two-bedroom furnished home with a welcoming dining room, practical kitchen, and a lived-in sense of place.",
    hero: photo(henriettaDining, "Henrietta Cottage dining room with blue walls, fireplace, table, and chairs", "A strong interior hero while a cleaner front-of-house photo is sourced."),
    gallery: [
      photo(henriettaLiving, "Henrietta Cottage living room and dining area with wood floors"),
      photo(henriettaKitchen, "Henrietta Cottage kitchen with oak cabinets and full-size appliances"),
      photo(henriettaBedroom, "Henrietta Cottage bedroom with bed and natural light"),
      photo(henriettaBath, "Henrietta Cottage bathroom with shower and storage"),
      photo(henriettaYard, "Henrietta Cottage yard with fence, lawn, and trees"),
    ],
    amenities: ["Furnished rooms", "Full kitchen", "Dining room", "Private bedrooms", "Outdoor space", "Guest support"],
    coverage: ["Dining / living", "Kitchen", "Bedroom", "Bathroom", "Outdoor space"],
  },
];

export const cottageByPath = new Map(cottages.map((cottage) => [cottage.path, cottage]));

export type Guide = {
  path: string;
  title: string;
  eyebrow: string;
  description: string;
  intro: string;
  sections: { title: string; body: string; bullets?: string[] }[];
  photo?: Photo;
  cta?: string;
};

const guidePhotos: Record<string, Photo> = {
  living: photo(mariettaLiving, "A furnished living room with natural light and comfortable seating"),
  family: photo(oakDining, "A bright dining room with room for a household to gather"),
  health: photo(broadLiving, "A furnished living room ready for a longer stay"),
  work: photo(buckExterior, "A furnished cottage exterior surrounded by mature trees"),
  insurance: photo(henriettaLiving, "A furnished living and dining space for a transitional stay"),
  services: photo(oakKitchen, "A furnished kitchen with full-size appliances and storage"),
};

export const guides: Record<string, Guide> = {
  living: {
    path: "living.html",
    title: "A furnished home for the season you are in",
    eyebrow: "Furnished living",
    description: "Assignments, moves, repairs, and family transitions all bring different practical needs.",
    intro: "Choose the path that fits your stay, then tell us your dates, preferred community, household, and what would make a place work.",
    photo: guidePhotos.living,
    sections: [
      { title: "Start with the shape of the stay", body: "A month, a season, and a year-long transition ask different things of a home. We help narrow the choices around timing, household, and daily life." },
      { title: "A real home changes the rhythm", body: "A kitchen, separate bedrooms, laundry, and a place to sit can make an extended stay feel more workable than a sequence of hotel rooms." },
      { title: "Choose a useful next step", body: "Browse homes, compare communities, or start a conversation about the details that matter to your stay." },
    ],
    cta: "Find your place",
  },
  family: {
    path: "family-stays.html",
    title: "Furnished family stays in the Mid-Ohio Valley",
    eyebrow: "Room for real life",
    description: "Some family trips are too long, too complicated, or too important for a single hotel room.",
    intro: "A furnished cottage gives households room to prepare meals, do laundry, rest, and keep a little normal rhythm while plans change.",
    photo: guidePhotos.family,
    sections: [
      { title: "Visiting relatives and welcoming a new arrival", body: "Separate rooms and a kitchen give a family more flexibility when a visit stretches beyond a weekend." },
      { title: "Between homes or managing a move", body: "A furnished place can act as a practical bridge while a household works through closing dates, repairs, or a relocation." },
      { title: "Plan for the actual household", body: "Tell us who is coming, how long you may stay, and what the home needs to make the arrangement fit.", bullets: ["Bedrooms and sleeping arrangements", "Kitchen and laundry needs", "Pets and accessibility questions", "A realistic timing window"] },
    ],
    cta: "Plan a family stay",
  },
  health: {
    path: "health-professionals.html",
    title: "Furnished housing built around healthcare schedules",
    eyebrow: "Rest between shifts",
    description: "A clinical assignment is not a vacation: you need a dependable place to sleep, cook, reset, and reach work.",
    intro: "Mt Cottages has hosted traveling healthcare professionals for more than 10 years. We understand that schedules can change and that the practical details matter.",
    photo: guidePhotos.health,
    sections: [
      { title: "Stay near the life around the assignment", body: "Compare Parkersburg, Marietta, Ravenswood, and nearby communities by the routes, services, and everyday errands that shape a working week." },
      { title: "Bring the schedule home", body: "Separate bedrooms, a working kitchen, laundry, and a quiet place to recover can make a long assignment more sustainable." },
      { title: "Share the variables early", body: "Dates, facility, household, pets, and budget help us identify the homes worth considering." },
    ],
    cta: "Start a healthcare housing inquiry",
  },
  work: {
    path: "work-relocation.html",
    title: "Furnished housing for work assignments and relocation",
    eyebrow: "Arrive ready",
    description: "A new role or regional project already comes with a full to-do list.",
    intro: "Mt Cottages offers furnished homes across Mid-Ohio Valley communities so you can focus on the work and the transition around it.",
    photo: guidePhotos.work,
    sections: [
      { title: "A practical base while work is changing", body: "A furnished home gives a new hire, project team, or relocating household a place to land while the longer-term decision takes shape." },
      { title: "Projects, contracts, and field work", body: "Share the worksite, likely timing, household, and preferred community so we can compare the practical fit." },
      { title: "For employers and coordinators", body: "We can discuss partner-led housing, timing, furnishing needs, and the information needed to make a placement workable." },
    ],
    cta: "Plan a work stay",
  },
  insurance: {
    path: "insurance-housing.html",
    title: "Temporary furnished housing after a covered loss",
    eyebrow: "A home during repairs",
    description: "When fire, water, storm, or another damaging event makes home temporarily unlivable, the next question is often simple: where can daily life continue?",
    intro: "Mt Cottages helps households and authorized claim contacts think through a furnished bridge with room for meals, sleep, belongings, and the details of ordinary life.",
    photo: guidePhotos.insurance,
    sections: [
      { title: "Start with the household, not just the claim", body: "The right home depends on occupants, pets, accessibility, school or work routes, and the expected repair window." },
      { title: "Coordinate with the authorized claim contact", body: "We can provide availability and home information for the people authorized to arrange temporary housing. A site inquiry is not a coverage decision." },
      { title: "Make the bridge feel livable", body: "A kitchen, laundry, bedrooms, and living space help a temporary arrangement support a household while the next home is repaired." },
    ],
    cta: "Discuss temporary housing",
  },
};

export const locationData: Record<string, Guide & { town: string; cottages?: Cottage[] }> = {
  marietta: {
    path: "marietta/index.html",
    town: "Marietta, Ohio",
    title: "A river city with practical everyday reach",
    eyebrow: "Marietta home base",
    description: "Marietta sits where the Muskingum meets the Ohio River, pairing a historic downtown with the daily services needed for an extended stay.",
    intro: "It can suit healthcare, work, family, and transition stays that benefit from a recognizable town center and regional connections.",
    photo: photo(mariettaExterior, "Frederick Cottage exterior in a leafy Marietta setting"),
    cottages: cottages.filter((cottage) => cottage.id === "frederick"),
    sections: [
      { title: "Healthcare", body: "A Marietta stay can work for guests balancing a local assignment with everyday access to services and errands." },
      { title: "Work and commuting", body: "The town’s riverfront setting and regional roads make it a useful base for work across the Mid-Ohio Valley." },
      { title: "A slower after-work rhythm", body: "Historic streets, river views, and a compact center give a longer stay room for more than the commute." },
    ],
    cta: "See Frederick Cottage",
  },
  parkersburg: {
    path: "parkersburg/index.html",
    town: "Parkersburg, West Virginia",
    title: "More daily services, four public cottage choices",
    eyebrow: "Parkersburg home base",
    description: "Parkersburg is a practical hub for guests who want broad access to Wood County employers, healthcare, groceries, retail, restaurants, and community life.",
    intro: "Compare a furnished place by bedroom count, neighborhood feel, price, and the kind of daily rhythm you want during the stay.",
    photo: photo(buckExterior, "Buck Cottage exterior in Parkersburg with mature trees"),
    cottages: cottages.filter((cottage) => ["broad", "buck", "yellow", "oak"].includes(cottage.id)),
    sections: [
      { title: "Healthcare", body: "Parkersburg offers the region’s broadest concentration of hospitals, clinics, and related services." },
      { title: "Work and routes", body: "The city can be a useful base for assignments across Wood County and the surrounding river communities." },
      { title: "Choose by daily life", body: "The best home is the one that fits your schedule, household, budget, and desired scale—not simply the one with the most rooms." },
    ],
    cta: "Compare Parkersburg cottages",
  },
  ravenswood: {
    path: "ravenswood/index.html",
    town: "Ravenswood, West Virginia",
    title: "Small-town pace beside the Ohio River",
    eyebrow: "Ravenswood home base",
    description: "Ravenswood offers a quieter alternative to the region’s larger commercial centers, with local services, schools, parks, and river access.",
    intro: "Plan the practical side of a longer stay, then compare the public cottage choices by scale and what each photo story makes visible.",
    photo: photo(henriettaYard, "Henrietta Cottage yard with trees and a fenced outdoor space"),
    cottages: cottages.filter((cottage) => ["white", "virginia", "henrietta"].includes(cottage.id)),
    sections: [
      { title: "Work and routes", body: "Ravenswood can suit guests who prefer a smaller town while keeping regional work and errands within reach." },
      { title: "Everyday services", body: "Plan groceries, healthcare, transportation, and time outside before choosing the home and length of stay." },
      { title: "A quieter landing place", body: "A furnished home gives the stay a more personal center than a room chosen only for proximity." },
    ],
    cta: "Compare Ravenswood cottages",
  },
  racine: {
    path: "racine/index.html",
    town: "Racine, Ohio",
    title: "Village life with regional road connections",
    eyebrow: "Meigs County base",
    description: "Racine is an Ohio River village in Meigs County with a practical relationship to regional roads, services, and outdoor space.",
    intro: "A longer stay here requires deliberate planning around transportation, errands, care, and the work or family reason bringing you to the area.",
    sections: [
      { title: "Plan transportation first", body: "Village-scale living rewards guests who map their daily routes, vehicle needs, and service access before arrival." },
      { title: "A stay with a clear purpose", body: "Racine can make sense for family, work, and transition stays when the location supports the actual schedule." },
      { title: "Ask for current options", body: "Availability and property coverage change. Tell us the timing and community need so we can confirm what is possible." },
    ],
    cta: "Ask about Racine availability",
  },
  grantsville: {
    path: "grantsville/index.html",
    town: "Grantsville, West Virginia",
    title: "Rural convenience requires deliberate planning",
    eyebrow: "Calhoun County base",
    description: "Grantsville is a service center for surrounding rural communities, where a comfortable extended stay depends on planning routes, care, errands, and timing.",
    intro: "Tell us what brings you to the area and how flexible your location and dates are. We will confirm current public options rather than promise an unavailable home.",
    sections: [
      { title: "Healthcare and care routes", body: "Plan the distance to care and the transportation pattern before choosing a rural base." },
      { title: "Work and commuting", body: "A furnished arrangement can work when the home and the work route are considered together." },
      { title: "Availability changes", body: "We keep this guide useful by separating location planning from current home availability. Start a conversation for the latest answer." },
    ],
    cta: "Ask about Grantsville planning",
  },
};

export const navGroups = [
  { label: "Cottages", href: "cottages.html", items: [["Find your place", "cottages.html"], ["Available now", "available.html"], ["Cozy places", "cozy-places.html"], ["Room to settle in", "room-to-settle.html"]] },
  { label: "Locations", href: "locations.html", items: [["Marietta", "marietta/index.html"], ["Parkersburg", "parkersburg/index.html"], ["Ravenswood", "ravenswood/index.html"], ["Racine", "racine/index.html"], ["Grantsville", "grantsville/index.html"]] },
  { label: "Living", href: "living.html", items: [["Health professionals", "health-professionals.html"], ["Work & relocation", "work-relocation.html"], ["Insurance housing", "insurance-housing.html"], ["Family stays", "family-stays.html"]] },
  { label: "Services", href: "services.html", items: [["Fully furnished homes", "fully-furnished-homes.html"], ["Home amenities", "home-amenities.html"], ["Guest services", "guest-services.html"], ["Property care", "property-care.html"]] },
  { label: "Residents", href: "residents.html", items: [["Resident portal", "resident-portal.html"], ["Pay rent", "pay-rent.html"], ["Maintenance", "maintenance.html"], ["Emergency maintenance", "emergency-maintenance.html"]] },
];

export const routePaths = [
  "about.html", "available.html", "contact.html", "cottages.html", "cozy-places.html", "emergency-maintenance.html", "family-stays.html", "faq.html", "fully-furnished-homes.html", "guest-services.html", "health-professionals.html", "home-amenities.html", "housekeeping.html", "insurance-housing.html", "living.html", "locations.html", "maintenance.html", "meal-preparation.html", "partnerships.html", "pay-rent.html", "property-care.html", "resident-portal.html", "residents.html", "room-to-settle.html", "services.html", "work-relocation.html",
  "marietta/frederick-cottage.html", "parkersburg/broad-cottage.html", "parkersburg/buck-apartment-1.html", "parkersburg/oak-cottage.html", "parkersburg/yellow-cottage.html", "ravenswood/henrietta-cottage.html", "ravenswood/virginia-cottage.html", "ravenswood/white-cottage.html",
];
