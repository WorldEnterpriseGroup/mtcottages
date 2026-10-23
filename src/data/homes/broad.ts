import type { HomeMicrosite } from "./types";

import p44 from "../../../assets/images/cottages/parkersburg-01/photo-44.avif";
import p06 from "../../../assets/images/cottages/parkersburg-01/photo-06.avif";
import p45 from "../../../assets/images/cottages/parkersburg-01/photo-45.avif";
import p20 from "../../../assets/images/cottages/parkersburg-01/photo-20.avif";
import p42 from "../../../assets/images/cottages/parkersburg-01/photo-42.avif";
import p12 from "../../../assets/images/cottages/parkersburg-01/photo-12.avif";
import livingSectional from "../../../assets/images/cottages/parkersburg-01/unique/available-img-344-d3da51dfd0-648x470.avif";
import livingCorner from "../../../assets/images/cottages/parkersburg-01/unique/locations-img-44-6a33635b66-648x470.avif";
import livingMirror from "../../../assets/images/cottages/parkersburg-01/unique/parkersburg-broad-cottage-img-290-709b0ab4e5-648x470.avif";
import bedroomBathDoor from "../../../assets/images/cottages/parkersburg-01/unique/parkersburg-broad-cottage-img-279-2becab5554-648x470.avif";
import bedroomDesk from "../../../assets/images/cottages/parkersburg-01/unique/meal-preparation-img-61-f9a9602b3d-648x470.avif";
import conceptTopDown from "../../../assets/images/cottages/parkersburg-01/3d/broad-concept-top-down.png";
import concept45 from "../../../assets/images/cottages/parkersburg-01/3d/broad-concept-45-degree.png";

const photos = {
  living: {
    src: p44,
    alt: "Wood-paneled living room with a wall-mounted television, glass-top coffee table with red flowers, and patterned carpet",
    caption: "The living room: knotty wood paneling, a wall-mounted TV, and a generous sitting area.",
    focal: "center 45%",
  },
  livingWindow: {
    src: p06,
    alt: "Living room corner with a wall-mounted television, a dark wall shelf, a coffee table with red flowers, and a sunlit window and door on the right",
    caption: "Another angle of the living room, with daylight from the window.",
    focal: "center 50%",
  },
  livingSectional: {
    src: livingSectional,
    alt: "Patterned sectional sofa under a round wall clock and framed art, with a wooden coffee table, a wall air-conditioning unit, and a wooden sideboard",
    caption: "The sectional, coffee table and sideboard, with a wall air-conditioning unit beside the art.",
  },
  livingCorner: {
    src: livingCorner,
    alt: "Close view of the patterned sectional sofa with a navy cushion, a lit table lamp, a wall clock, and a window with vertical blinds",
    caption: "A closer look at the sectional and the lamp-lit corner.",
  },
  livingMirror: {
    src: livingMirror,
    alt: "Long view across the living room showing the sectional, coffee table, wooden sideboard under a large mirror, wall-mounted television, and a dark wooden door",
    caption: "Looking across the living room toward the sideboard, mirror and TV wall.",
  },
  bedroom: {
    src: p45,
    alt: "Bedroom with a queen bed in a red patterned quilt, folded towels on the bed, an office chair at a desk by the window, and a small white unit on the carpet",
    caption: "The bedroom: queen bed with a carved wood frame, and a desk chair by the window.",
    focal: "center 55%",
  },
  bedroomBathDoor: {
    src: bedroomBathDoor,
    alt: "Bedroom seen from the foot of the queen bed, with a desk and chair at the window and an open door leading to the bathroom beyond",
    caption: "The open doorway from the bedroom to the bathroom.",
  },
  bedroomDesk: {
    src: bedroomDesk,
    alt: "Bedroom with a wall mirror, wall-mounted television, queen bed, a wooden desk with a lavender plant, and a maroon office chair",
    caption: "The desk and chair, with the mirror and TV across from the bed.",
  },
  bathroom: {
    src: p20,
    alt: "Bathroom with a large cream tub inside a pink tile surround, a toilet, a wooden vanity with a mirror, and a white baseboard heater",
    caption: "The bathroom: a full-size tub with pink tile surround, toilet and wood vanity.",
    focal: "center 55%",
  },
  shower: {
    src: p42,
    alt: "Bathroom and laundry corner with a lit vanity mirror, a sink and wooden vanity, a washer and dryer, upper cabinets, and a white shower curtain",
    caption: "The vanity, the washer and dryer, and a curtained shower area.",
  },
  laundry: {
    src: p12,
    alt: "Wood vanity with a lit mirror and sink, upper cabinets, and a white washer and dryer standing side by side next to it",
    caption: "Washer and dryer stand right beside the vanity.",
  },
} as const;

export const broadHome: HomeMicrosite = {
  id: "broad",
  slug: "broad-cottage",
  name: "Broad Cottage",
  town: { name: "Parkersburg", state: "WV", slug: "parkersburg" },
  tagline: "A warm, wood-paneled one-bedroom, furnished and ready to settle into.",
  summary:
    "Broad Cottage is a furnished one-bedroom, one-bath home in Parkersburg. The photos show a living room with knotty wood paneling, a sectional sofa and a wall-mounted TV, a bedroom with a queen bed and a desk by the window, and a bathroom with a full tub, a curtained shower area and a washer and dryer beside the vanity. A full kitchen and fiber-optic internet are part of the listing. We have not photographed the kitchen or the outside yet, so those details are marked for confirmation.",
  address: {
    streetAddress: "3113 Broad St",
    locality: "Parkersburg",
    region: "WV",
    postalCode: "26104",
    lat: 39.281665,
    lng: -81.528869,
  },
  bedrooms: 1,
  bathrooms: 1,
  priceGuide: "$1,895/month",
  hero: photos.living,
  highlights: [
    {
      title: "A living room with character",
      body: "Warm wood paneling, a big sectional and a wall-mounted TV make the main room feel settled in from day one.",
      photo: photos.livingSectional,
    },
    {
      title: "A bedroom with a desk",
      body: "A queen bed, a mirror and a desk with a chair sit in one room, so you can sleep and work without moving furniture.",
      photo: photos.bedroomDesk,
    },
    {
      title: "Laundry in the home",
      body: "A washer and dryer stand beside the bathroom vanity, so there is no trip to a laundromat.",
      photo: photos.laundry,
    },
  ],
  facts: [
    { label: "Address", value: "3113 Broad St, Parkersburg, WV 26104", status: "confirmed" },
    { label: "Bedrooms", value: "1, with a queen bed", status: "listed" },
    { label: "Bathrooms", value: "1 full bathroom with tub", status: "listed" },
    { label: "Furnished", value: "Furnished throughout", status: "listed" },
    { label: "Kitchen", value: "Full kitchen (not yet photographed)", status: "listed" },
    { label: "Laundry", value: "Washer and dryer in the home", status: "photographed" },
    { label: "Internet", value: "Fiber-optic internet (speed to be confirmed)", status: "listed" },
    { label: "Layout", value: "Single level, per the listing", status: "listed" },
    { label: "Floors", value: "Carpet in the living room and bedroom; hard-surface floor in the bathroom", status: "photographed" },
    { label: "TV", value: "Wall-mounted TVs in the living room and bedroom", status: "photographed" },
    { label: "Parking", value: "Confirm on inquiry", status: "confirm" },
    { label: "Sleeps", value: "Confirm on inquiry", status: "confirm" },
    { label: "Square footage", value: "Confirm on inquiry", status: "confirm" },
    { label: "Pets", value: "Confirm on inquiry", status: "confirm" },
    { label: "Utilities", value: "Confirm on inquiry", status: "confirm" },
    { label: "Availability", value: "Confirm on inquiry", status: "confirm" },
  ],
  rooms: [
    {
      slug: "living-room",
      name: "Living room",
      summary: "The best-documented room in the home: wood-paneled walls, a sectional, a coffee table and a wall-mounted TV.",
      photos: [photos.living, photos.livingWindow, photos.livingSectional, photos.livingCorner, photos.livingMirror],
      notes: [
        { text: "Knotty wood paneling on the walls and white paneled ceiling", status: "photographed" },
        { text: "Large patterned sectional sofa and a wooden glass-top coffee table", status: "photographed" },
        { text: "Wall-mounted TV; TV type and streaming setup to confirm", status: "photographed" },
        { text: "Wooden sideboard with a large mirror above it", status: "photographed" },
        { text: "Wall-mounted air-conditioning unit; heating type to confirm", status: "photographed" },
        { text: "Carpeted floor", status: "photographed" },
        { text: "Room size", status: "confirm" },
      ],
    },
    {
      slug: "kitchen",
      name: "Kitchen",
      summary: "A full kitchen is part of the listing. We do not have photos of it yet.",
      photos: [],
      notes: [
        { text: "Full kitchen", status: "listed" },
        { text: "Appliances (refrigerator, stove, oven, microwave)", status: "confirm" },
        { text: "Cookware, dishes and utensils", status: "confirm" },
        { text: "Dining table or seating", status: "confirm" },
      ],
    },
    {
      slug: "bedroom",
      name: "Bedroom",
      summary: "One bedroom with a queen bed, a desk and chair by the window, and a doorway straight into the bathroom.",
      photos: [photos.bedroom, photos.bedroomBathDoor, photos.bedroomDesk],
      notes: [
        { text: "Queen bed with a carved wood frame", status: "photographed" },
        { text: "Desk with an office chair beside the window", status: "photographed" },
        { text: "Wall-mounted TV and a large wall mirror", status: "photographed" },
        { text: "Doorway from the bedroom into the bathroom", status: "photographed" },
        { text: "Sloped ceiling; carpeted floor", status: "photographed" },
        { text: "Closet or dresser storage", status: "confirm" },
        { text: "Linens and towels supplied (towels are shown on the bed)", status: "confirm" },
      ],
    },
    {
      slug: "bathroom",
      name: "Bathroom",
      summary: "A full bathroom with a deep tub, a curtained shower area and a wood vanity under a lit mirror.",
      photos: [photos.bathroom, photos.shower],
      notes: [
        { text: "Full-size tub in a pink tile surround", status: "photographed" },
        { text: "Separate curtained shower area", status: "photographed" },
        { text: "Wood vanity with sink and lit mirror", status: "photographed" },
        { text: "Baseboard heater", status: "photographed" },
        { text: "Step-free or grab-bar access", status: "confirm" },
      ],
    },
    {
      slug: "laundry",
      name: "Laundry",
      summary: "A washer and dryer stand side by side next to the bathroom vanity.",
      photos: [photos.laundry],
      notes: [
        { text: "Washer and dryer side by side", status: "photographed" },
        { text: "Detergent, iron or drying rack supplied", status: "confirm" },
      ],
    },
  ],
  amenities: [
    {
      group: "Rest and work",
      items: [
        { name: "Furnished throughout", status: "listed" },
        { name: "Queen bed", status: "photographed" },
        { name: "Desk and office chair", status: "photographed" },
        { name: "Wall-mounted TV in living room and bedroom", status: "photographed" },
        { name: "Fiber-optic internet", status: "listed" },
      ],
    },
    {
      group: "Kitchen and laundry",
      items: [
        { name: "Full kitchen", status: "listed" },
        { name: "Washer and dryer", status: "photographed" },
        { name: "Cookware and dishes", status: "confirm" },
      ],
    },
    {
      group: "Comfort",
      items: [
        { name: "Wall-mounted air-conditioning unit in living room", status: "photographed" },
        { name: "Baseboard heater in bathroom", status: "photographed" },
        { name: "Whole-home heating and cooling", status: "confirm" },
      ],
    },
    {
      group: "Arrival",
      items: [
        { name: "Parking", status: "confirm" },
        { name: "Porch or outdoor space", status: "confirm" },
        { name: "Step-free entry", status: "confirm" },
      ],
    },
  ],
  plan: {
    floors: [
      {
        name: "Main level (concept)",
        rooms: [
          { id: "bedroom", label: "Bedroom", kind: "bedroom", x: 0, y: 0, w: 14, h: 13 },
          { id: "bath", label: "Bathroom", kind: "bath", x: 14, y: 0, w: 9, h: 13 },
          { id: "laundry", label: "Laundry", kind: "laundry", x: 23, y: 0, w: 5, h: 13 },
          { id: "kitchen", label: "Kitchen", kind: "kitchen", x: 28, y: 0, w: 12, h: 13 },
          { id: "living", label: "Living room", kind: "living", x: 0, y: 13, w: 28, h: 13 },
          { id: "dining", label: "Dining area", kind: "dining", x: 28, y: 13, w: 12, h: 13 },
        ],
      },
    ],
    note: "An illustrative concept layout, not a measured plan. Room sizes and positions are approximate. It follows the photos: the bedroom opens into the bathroom, and the laundry sits beside the vanity. The kitchen and dining positions are guesses until the home is measured.",
  },
  concepts: [
    {
      src: conceptTopDown,
      alt: "AI-generated concept: a cutaway view from above of a green-roofed cottage with a porch, showing a kitchen, living and dining area and two bedrooms, surrounded by trees and a gravel drive",
      caption:
        "Concept only. This is a generic cottage, not Broad Cottage: it shows two bedrooms, while Broad Cottage has one.",
    },
    {
      src: concept45,
      alt: "AI-generated concept: a cream cottage with green shutters and a green shingle roof, a covered front porch with seating, a stone path, and a gravel drive among trees",
      caption:
        "Concept only. An imagined cottage exterior, not a photo of 3113 Broad St. We have no exterior photos yet.",
    },
  ],
  nearby: [
    {
      name: "WVU Medicine Camden Clark Medical Center",
      kind: "health",
      note: "The area's main hospital campus, on Garfield Avenue in Parkersburg.",
      mapsQuery: "WVU Medicine Camden Clark Medical Center, 800 Garfield Ave, Parkersburg, WV 26101",
    },
    {
      name: "Walmart Supercenter",
      kind: "grocery",
      note: "A large store with a grocery department on Pike Street.",
      mapsQuery: "Walmart Supercenter, 2900 Pike St, Parkersburg, WV 26101",
    },
    {
      name: "City Park",
      kind: "park",
      note: "The city's largest park, listed by the City of Parkersburg.",
      mapsQuery: "City Park, 1920 Parks Ave, Parkersburg, WV 26101",
    },
    {
      name: "Point Park",
      kind: "park",
      note: "A riverfront park downtown where the Little Kanawha meets the Ohio, and the start of the Little Kanawha Connector Trail.",
      mapsQuery: "Point Park, Parkersburg, WV 26101",
    },
    {
      name: "Parkersburg Brewing Company",
      kind: "food",
      note: "A brewpub with a full menu in a renovated historic building downtown.",
      mapsQuery: "Parkersburg Brewing Company, 707 Market St, Parkersburg, WV 26101",
    },
    {
      name: "Parkersburg High School",
      kind: "school",
      note: "A public high school for grades 9 to 12, in a building from 1917.",
      mapsQuery: "Parkersburg High School, 2101 Dudley Ave, Parkersburg, WV 26101",
    },
    {
      name: "Easy Rider transit center",
      kind: "transit",
      note: "The hub for Easy Rider, the Mid-Ohio Valley Transit Authority bus service.",
      mapsQuery: "Mid-Ohio Valley Transit Authority Easy Rider, 520 Juliana St, Parkersburg, WV 26101",
    },
    {
      name: "Parkersburg and Wood County Public Library",
      kind: "civic",
      note: "The main library, on Emerson Avenue in the 26104 ZIP code.",
      mapsQuery: "Parkersburg and Wood County Public Library, 3100 Emerson Ave, Parkersburg, WV 26104",
    },
    {
      name: "Parkersburg Art Center",
      kind: "civic",
      note: "A downtown art center with changing exhibits, chartered in 1938.",
      mapsQuery: "Parkersburg Art Center, 725 Market St, Parkersburg, WV 26101",
    },
  ],
  directionsFrom: [
    {
      label: "WVU Medicine Camden Clark Medical Center",
      origin: "WVU Medicine Camden Clark Medical Center, 800 Garfield Ave, Parkersburg, WV 26101",
    },
    {
      label: "Mid-Ohio Valley Regional Airport",
      origin: "Mid-Ohio Valley Regional Airport, 543 Airport Rd, Williamstown, WV 26187",
    },
    {
      label: "Easy Rider transit center",
      origin: "520 Juliana St, Parkersburg, WV 26101",
    },
  ],
};
