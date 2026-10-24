import type { HomeMicrosite } from "./types";
import hero from "../../../assets/images/cottages/parkersburg-04/homepage-hero-oak-dining.avif";
import p05 from "../../../assets/images/cottages/parkersburg-04/photo-05.avif";
import p07 from "../../../assets/images/cottages/parkersburg-04/photo-07.avif";
import p08 from "../../../assets/images/cottages/parkersburg-04/photo-08.avif";
import p11 from "../../../assets/images/cottages/parkersburg-04/photo-11.avif";
import p17 from "../../../assets/images/cottages/parkersburg-04/photo-17.avif";
import p23 from "../../../assets/images/cottages/parkersburg-04/photo-23.avif";
import p40 from "../../../assets/images/cottages/parkersburg-04/photo-40.avif";
import p01 from "../../../assets/images/cottages/parkersburg-04/photo-01.avif";
import porch2 from "../../../assets/images/cottages/parkersburg-04/unique/parkersburg-oak-cottage-img-299-ce73422848-648x470.avif";
import steps from "../../../assets/images/cottages/parkersburg-04/unique/parkersburg-index-img-23-83f99682b9-648x470.avif";
import kitSink from "../../../assets/images/cottages/parkersburg-04/unique/parkersburg-oak-cottage-img-259-f2e63a212c-648x470.avif";
import kitDoor from "../../../assets/images/cottages/parkersburg-04/unique/parkersburg-oak-cottage-img-290-fc5858e6b0-648x470.avif";
import kitLong from "../../../assets/images/cottages/parkersburg-04/unique/room-to-settle-img-357-d046eaa395-648x470.avif";
import dining2 from "../../../assets/images/cottages/parkersburg-04/unique/ravenswood-index-img-25-a33052273b-648x470.avif";
import bath2 from "../../../assets/images/cottages/parkersburg-04/unique/available-img-386-9597944b4a-648x470.avif";
import bedB2 from "../../../assets/images/cottages/parkersburg-04/unique/parkersburg-oak-cottage-img-310-73035b484b-648x470.avif";
import bedC2 from "../../../assets/images/cottages/parkersburg-04/unique/property-care-img-75-1c8506a5a4-648x470.avif";
const ph = (src: HomeMicrosite["hero"]["src"], alt: string, caption: string, focal?: string) => ({ src, alt, caption, ...(focal ? { focal } : {}) });

const photos = {
  hero: ph(hero, "Dining room with an oval navy table, white spindle-back chairs, a woven basket, and a bright window with patterned curtains", "The dining room at Oak Cottage.", "50% 55%"),
  dining: ph(p23, "Dining room with an oval navy table, white spindle-back chairs with blue seat cushions, light wood-look floor, and a window with patterned curtains", "A table for shared meals, by a bright window."),
  diningAngle: ph(dining2, "Dining room seen from the corner, with the oval navy table, a ceiling light, framed prints, and a window with patterned curtains", "The same room from the corner, with its ceiling light and framed prints."),
  kitchen: ph(p08, "Kitchen with honey-oak cabinets, a cream electric range with coil burners, a cream refrigerator, a red microwave, and tile flooring", "Oak cabinets, a range, and a full-size refrigerator."),
  kitchenLong: ph(kitLong, "Kitchen with an L-shaped run of oak cabinets, laminate counters, a toaster oven, a red microwave, and a refrigerator beside a small window", "The counter run, with microwave and toaster oven."),
  kitchenSink: ph(kitSink, "Kitchen double sink under a window, with tile counters, a coffee maker, a dish rack, and oak cabinets", "Sink under the window, with a coffee maker on the counter."),
  kitchenDoor: ph(kitDoor, "Kitchen looking toward a doorway that opens onto the dining room, with the range, refrigerator, microwave, and oak cabinets", "The kitchen opens straight onto the dining room."),
  bedA: ph(p07, "Bedroom with a gray upholstered headboard, black-and-white patterned bedding, a lamp on a wooden nightstand, three framed abstract prints, and a large plant", "Gray upholstered headboard and layered bedding."),
  bedAWindow: ph(p11, "Bedroom with a bed dressed in black-and-white bedding with folded towels, a glowing amber lamp, and a window with patterned curtains", "Folded towels and a warm bedside lamp."),
  bedB: ph(p17, "Bedroom with a bed in gray-and-white striped bedding, a cream dresser with mirror, a wooden nightstand, a birch-tree painting, and an open door to the next room", "Striped bedding, cream dresser, and a birch-tree painting."),
  bedBTv: ph(bedB2, "Bedroom with striped bedding on a bed, a wall-mounted TV, a round wall clock, a window with white curtains, and dark carpet", "A wall-mounted TV and a window with white curtains."),
  bedC: ph(p01, "Bedroom with a bed in white bedding, a wall-mounted TV above a low media bench, a white door, white curtains, and a framed landscape print", "White bedding, a wall-mounted TV, and a framed landscape print."),
  bedCAc: ph(bedC2, "Bedroom with a bed in white bedding with a medallion pattern, a wooden chest nightstand, table lamps, a round wall clock, a wall air-conditioning unit, and a mirror", "Medallion bedding, table lamps, and a wall air-conditioning unit."),
  bath: ph(p40, "Bathroom with a tub and shower behind a navy-and-white striped curtain, a wood-cabinet vanity with a small sink, a toilet, a framed mirror, and wall shelves with plants", "Tub-and-shower, wood vanity, and plant shelves."),
  bathWindow: ph(bath2, "Bathroom shower area with a navy-and-white striped curtain, a small frosted window, and wall shelves holding plants", "The shower, with a window for daylight."),
  porch: ph(p05, "Covered porch with a patterned gray outdoor rug, two blue-cushioned patio chairs, a white railing, and bare trees beyond", "A covered porch with room to sit outside.", "50% 50%"),
  porchSide: ph(porch2, "Covered porch with a patterned rug, two chairs and a small round side table, gray siding, and tree branches beyond the railing", "Two chairs and a side table on the porch."),
  steps: ph(steps, "Wooden steps and a stepping-stone path leading down a sloped yard to the street, with small houses across the road and a large tree trunk beside the rail", "Steps lead down the slope from the house to the street."),
};

export const oakHome: HomeMicrosite = {
  id: "oak",
  slug: "oak-cottage",
  name: "Oak Cottage",
  town: { name: "Parkersburg", state: "WV", slug: "parkersburg" },
  tagline: "A three-bedroom furnished home with a covered porch, an oak kitchen, and a sunny dining room.",
  summary:
    "Oak Cottage is a furnished three-bedroom home in Parkersburg. The photos show an oak-cabinet kitchen that opens onto a bright dining room, bedrooms dressed with layered bedding and wall-mounted TVs, a full bathroom with a tub and shower, and a covered porch with chairs for sitting outside. It is set up for stays of a month or longer.",
  address: { streetAddress: "2712 Broad St", locality: "Parkersburg", region: "WV", postalCode: "26101", lat: 39.279273, lng: -81.530239 },
  bedrooms: 3,
  priceGuide: "$2,575/month",
  hero: photos.hero,
  highlights: [
    { title: "Kitchen that opens to the dining room", body: "Oak cabinets and everyday appliances sit right beside a dining table with seating for shared meals.", photo: photos.kitchenDoor },
    { title: "Three furnished bedrooms", body: "Each bedroom in the photos has a made bed, a nightstand and lamp, and a window, so you can settle in without hauling furniture.", photo: photos.bedA },
    { title: "A covered porch of your own", body: "Two chairs and a side table under the porch roof make a quiet spot for coffee or an evening call.", photo: photos.porch },
  ],
  facts: [
    { label: "Address", value: "2712 Broad St, Parkersburg, WV 26101", status: "confirmed" },
    { label: "Bedrooms", value: "3", status: "listed" },
    { label: "Bathrooms", value: "One full bathroom with tub and shower is photographed; total count to be confirmed", status: "confirm" },
    { label: "Furnishing", value: "Furnished rooms", status: "listed" },
    { label: "Internet", value: "Fiber-optic internet", status: "listed" },
    { label: "Setting", value: "Quiet setting", status: "listed" },
    { label: "Floors", value: "Number of floors to be confirmed; no staircase is shown inside", status: "confirm" },
    { label: "Entrance", value: "Wooden steps lead down the slope from the house to the street", status: "photographed" },
    { label: "Laundry", value: "Washer and dryer", status: "confirm" },
    { label: "Parking", value: "Off-street parking", status: "confirm" },
    { label: "Utilities", value: "What is included in the monthly rate", status: "confirm" },
    { label: "Sleeps", value: "Number of guests", status: "confirm" },
    { label: "Pets", value: "Pet policy", status: "confirm" },
  ],
  rooms: [
    {
      slug: "porch",
      name: "Porch & entrance",
      summary: "A covered porch with outdoor seating, and steps down to the street.",
      photos: [photos.porch, photos.porchSide, photos.steps],
      notes: [
        { text: "Covered porch with a patterned outdoor rug and two chairs.", status: "photographed" },
        { text: "Porch is listed as a feature of the home.", status: "listed" },
        { text: "Wooden steps and a stepping-stone path run down a sloped yard to the street. No clean front-of-house photo is published yet.", status: "photographed" },
        { text: "Step count and any step-free entrance, for guests who need one.", status: "confirm" },
      ],
    },
    {
      slug: "dining",
      name: "Dining room",
      summary: "A bright room with an oval navy table, white chairs, and a window with patterned curtains.",
      photos: [photos.dining, photos.diningAngle],
      notes: [
        { text: "Oval table with white spindle-back chairs and blue cushions.", status: "photographed" },
        { text: "Light wood-look flooring and a double window.", status: "photographed" },
        { text: "Dining room is part of the home's listing.", status: "listed" },
        { text: "Number of chairs and any table leaf.", status: "confirm" },
      ],
    },
    {
      slug: "kitchen",
      name: "Kitchen",
      summary: "Honey-oak cabinets, a full run of counters, and everyday appliances, open to the dining room.",
      photos: [photos.kitchen, photos.kitchenDoor, photos.kitchenLong, photos.kitchenSink],
      notes: [
        { text: "Full kitchen.", status: "listed" },
        { text: "Electric range with coil burners, full-size refrigerator, microwave, and toaster oven.", status: "photographed" },
        { text: "Double sink under a window, and a coffee maker on the counter.", status: "photographed" },
        { text: "Dishwasher, cookware, dishes, and small appliances supplied.", status: "confirm" },
      ],
    },
    {
      slug: "bedroom-one",
      name: "Bedroom one",
      summary: "A bed with a gray upholstered headboard, a dresser, and a window with patterned curtains.",
      photos: [photos.bedA, photos.bedAWindow],
      notes: [
        { text: "Made bed with folded towels, nightstand with lamp, dresser, and framed prints.", status: "photographed" },
        { text: "Bed size.", status: "confirm" },
      ],
    },
    {
      slug: "bedroom-two",
      name: "Bedroom two",
      summary: "Striped bedding, a cream dresser with mirror, a wall TV, and a door to the next room.",
      photos: [photos.bedB, photos.bedBTv],
      notes: [
        { text: "Made bed, nightstand, cream dresser with mirror, wall-mounted TV, and wall clock.", status: "photographed" },
        { text: "Dark carpet in this room; wood-look flooring shows in the next room.", status: "photographed" },
        { text: "Bed size.", status: "confirm" },
      ],
    },
    {
      slug: "bedroom-three",
      name: "Bedroom three",
      summary: "A bed in white bedding, a wall TV, and a wall air-conditioning unit.",
      photos: [photos.bedC, photos.bedCAc],
      notes: [
        { text: "Wall-mounted TV on a low media bench, and a framed landscape print.", status: "photographed" },
        { text: "Wall air-conditioning unit, round wall clock, and table lamps.", status: "photographed" },
        { text: "The two photos dress the bed differently; confirm they show the same room and which bedroom has the air conditioner.", status: "confirm" },
        { text: "Bed size.", status: "confirm" },
      ],
    },
    {
      slug: "bathroom",
      name: "Bathroom",
      summary: "A bright white bathroom with a tub and shower, a wood vanity, and a window.",
      photos: [photos.bath, photos.bathWindow],
      notes: [
        { text: "Tub with shower and striped curtain, wood vanity with small sink, toilet, and mirror.", status: "photographed" },
        { text: "Frosted window over the shower.", status: "photographed" },
        { text: "Whether there is more than one bathroom.", status: "confirm" },
      ],
    },
  ],
  amenities: [
    {
      group: "Kitchen",
      items: [
        { name: "Full kitchen", status: "listed" },
        { name: "Electric range and refrigerator", status: "photographed" },
        { name: "Microwave and toaster oven", status: "photographed" },
        { name: "Coffee maker", status: "photographed" },
        { name: "Dishwasher", status: "confirm" },
        { name: "Cookware and dishes", status: "confirm" },
      ],
    },
    {
      group: "Sleeping",
      items: [
        { name: "Private bedrooms", status: "listed" },
        { name: "Made beds with nightstands and lamps", status: "photographed" },
        { name: "Wall-mounted TVs in bedrooms", status: "photographed" },
        { name: "Wall air-conditioning unit", status: "photographed" },
        { name: "Towels and linens provided", status: "confirm" },
      ],
    },
    {
      group: "Living",
      items: [
        { name: "Furnished rooms", status: "listed" },
        { name: "Dining room", status: "listed" },
        { name: "Dining table with chairs", status: "photographed" },
        { name: "Living room or sitting area", status: "confirm" },
      ],
    },
    {
      group: "Laundry & utilities",
      items: [
        { name: "Washer and dryer", status: "confirm" },
        { name: "Utilities included", status: "confirm" },
      ],
    },
    {
      group: "Outdoors",
      items: [
        { name: "Covered porch", status: "listed" },
        { name: "Porch chairs and side table", status: "photographed" },
        { name: "Off-street parking", status: "confirm" },
      ],
    },
    {
      group: "Connectivity",
      items: [{ name: "Fiber-optic internet", status: "listed" }],
    },
    {
      group: "Support",
      items: [
        { name: "Guest support", status: "listed" },
        { name: "Quiet setting", status: "listed" },
      ],
    },
  ],
  plan: {
    floors: [
      {
        name: "Illustrative layout",
        rooms: [
          { id: "porch", label: "Covered porch", kind: "porch", x: 0, y: 0, w: 24, h: 8 },
          { id: "bed3", label: "Bedroom three", kind: "bedroom", x: 0, y: 8, w: 12, h: 12 },
          { id: "hall", label: "Hall", kind: "hall", x: 12, y: 8, w: 4, h: 12 },
          { id: "bed1", label: "Bedroom one", kind: "bedroom", x: 16, y: 8, w: 12, h: 12 },
          { id: "bed2", label: "Bedroom two", kind: "bedroom", x: 0, y: 20, w: 12, h: 12 },
          { id: "bath", label: "Bathroom", kind: "bath", x: 12, y: 20, w: 8, h: 10 },
          { id: "kitchen", label: "Kitchen", kind: "kitchen", x: 20, y: 20, w: 10, h: 12 },
          { id: "dining", label: "Dining room", kind: "dining", x: 30, y: 20, w: 10, h: 12 },
        ],
      },
    ],
    note: "Illustrative concept only, not a measured plan. It uses the rooms shown in the photos, and the arrangement, sizes, and number of floors are guesses until confirmed. Only the kitchen opening onto the dining room is taken from a photo. A living room, laundry, and any upstairs space are not shown.",
  },
  concepts: [],
  nearby: [
    { name: "WVU Medicine Camden Clark Medical Center", kind: "health", note: "The area's main hospital campus, on Garfield Avenue in Parkersburg.", mapsQuery: "WVU Medicine Camden Clark Medical Center 800 Garfield Ave Parkersburg WV" },
    { name: "Kroger on 7th Street", kind: "grocery", note: "A full-service grocery store on the east side of Parkersburg near City Park.", mapsQuery: "Kroger 2007 7th St Parkersburg WV" },
    { name: "Parkersburg City Park", kind: "park", note: "The city's largest park, with picnic shelters, playgrounds, tennis and pickleball courts, and walking paths.", mapsQuery: "Parkersburg City Park 1920 Parks Ave Parkersburg WV" },
    { name: "Point Park", kind: "park", note: "A riverfront park where the Little Kanawha meets the Ohio River, and the start of the Little Kanawha Connector Trail.", mapsQuery: "Point Park Parkersburg WV" },
    { name: "Smoot Theatre", kind: "civic", note: "A restored 1926 downtown theater that hosts live shows.", mapsQuery: "Smoot Theatre 213 5th St Parkersburg WV" },
    { name: "Parkersburg High School", kind: "school", note: "The public high school for the city, in a 1917 Tudor-style building.", mapsQuery: "Parkersburg High School 2101 Dudley Ave Parkersburg WV" },
    { name: "Easy Rider (Mid-Ohio Valley Transit Authority)", kind: "transit", note: "The local public bus system serving Parkersburg and Vienna.", mapsQuery: "Mid-Ohio Valley Transit Authority 520 Juliana St Parkersburg WV" },
  ],
  directionsFrom: [
    { label: "WVU Medicine Camden Clark Medical Center", origin: "WVU Medicine Camden Clark Medical Center, 800 Garfield Ave, Parkersburg, WV 26101" },
    { label: "Mid-Ohio Valley Regional Airport", origin: "Mid-Ohio Valley Regional Airport, Williamstown, WV" },
    { label: "Downtown Parkersburg (Point Park)", origin: "Point Park, Parkersburg, WV" },
  ],
};
