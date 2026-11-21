import type { HomeMicrosite } from "./types";
import { residentGuide } from "./guide";
import { parkersburgDirectionsFrom, parkersburgNearby } from "./towns";
import hero from "../../../assets/images/cottages/parkersburg-04/homepage-hero-oak-dining.avif";
import p05 from "../../../assets/images/cottages/parkersburg-04/photo-05.avif";
import p07 from "../../../assets/images/cottages/parkersburg-04/photo-07.avif";
import p08 from "../../../assets/images/cottages/parkersburg-04/photo-08.avif";
import bedAWindow from "../../../assets/images/cottages/parkersburg-04/bedroom-one-wide.avif";
import p17 from "../../../assets/images/cottages/parkersburg-04/photo-17.avif";
import p23 from "../../../assets/images/cottages/parkersburg-04/photo-23.avif";
import p40 from "../../../assets/images/cottages/parkersburg-04/photo-40.avif";
import p01 from "../../../assets/images/cottages/parkersburg-04/photo-01.avif";
import porch2 from "../../../assets/images/cottages/parkersburg-04/unique/parkersburg-oak-cottage-img-299-ce73422848-648x470.avif";
import steps from "../../../assets/images/cottages/parkersburg-04/unique/parkersburg-index-img-23-83f99682b9-648x470.avif";
import kitSink from "../../../assets/images/cottages/parkersburg-04/unique/parkersburg-oak-cottage-img-259-f2e63a212c-648x470.avif";
import kitDoor from "../../../assets/images/cottages/parkersburg-04/unique/parkersburg-oak-cottage-img-290-fc5858e6b0-648x470.avif";
import kitLong from "../../../assets/images/cottages/parkersburg-04/unique/room-to-settle-img-357-d046eaa395-648x470.avif";
import kitSinkWide from "../../../assets/images/cottages/parkersburg-04/oak-kitchen-sink.avif";
import kitCabinets from "../../../assets/images/cottages/parkersburg-04/oak-kitchen-cabinets.avif";
import kitAppliances from "../../../assets/images/cottages/parkersburg-04/oak-kitchen-appliances.avif";

import dining2 from "../../../assets/images/cottages/parkersburg-04/unique/ravenswood-index-img-25-a33052273b-648x470.avif";
import bedB2 from "../../../assets/images/cottages/parkersburg-04/unique/parkersburg-oak-cottage-img-310-73035b484b-648x470.avif";
import bedC2 from "../../../assets/images/cottages/parkersburg-04/unique/property-care-img-75-1c8506a5a4-648x470.avif";
import bedCMedia from "../../../assets/images/cottages/parkersburg-04/bedroom-three-tv-cabinet.avif";
import conceptDining from "../../../assets/images/cottages/parkersburg-04/3d/oak-dining-kitchen-45.jpg";
import conceptBedroom from "../../../assets/images/cottages/parkersburg-04/3d/oak-bedroom-top-down.jpg";
const ph = (src: HomeMicrosite["hero"]["src"], alt: string, caption: string, focal?: string) => ({ src, alt, caption, ...(focal ? { focal } : {}) });

const photos = {
  hero: ph(hero, "Dining room with an oval navy table, white spindle-back chairs, a woven basket, and a bright window with patterned curtains", "The dining room at Oak Cottage.", "50% 55%"),
  dining: ph(p23, "Dining room with an oval navy table, white spindle-back chairs with blue seat cushions, light wood-look floor, and a window with patterned curtains", "A table for shared meals, by a bright window."),
  diningAngle: ph(dining2, "Dining room seen from the corner, with the oval navy table, a ceiling light, framed prints, and a window with patterned curtains", "The same room from the corner, with its ceiling light and framed prints."),
  kitchen: ph(p08, "Kitchen with honey-oak cabinets, a cream electric range with coil burners, a cream refrigerator, a red microwave, and tile flooring", "Oak cabinets, a range, and a full-size refrigerator."),
  kitchenLong: ph(kitLong, "Kitchen with an L-shaped run of oak cabinets, laminate counters, a toaster oven, a red microwave, and a refrigerator beside a small window", "The counter run, with microwave and toaster oven."),
  kitchenSink: ph(kitSink, "Kitchen double sink under a window, with tile counters, a coffee maker, a dish rack, and oak cabinets", "Sink under the window, with a coffee maker on the counter."),
  kitchenDoor: ph(kitDoor, "Kitchen looking toward a doorway that opens onto the dining room, with the range, refrigerator, microwave, and oak cabinets", "The kitchen opens straight onto the dining room."),
  kitchenSinkWide: ph(kitSinkWide, "Kitchen double sink in stainless steel beneath a window with a wood sill, set in a beige tile counter and backsplash, with a paper-towel holder on the wall, a crock of cooking utensils, a bottle of dish soap and a black wire dish rack, and oak cabinets at the right", "The double sink, under the window."),
  kitchenCabinets: ph(kitCabinets, "Three open oak upper cabinets showing black pots and pans, skillets, white mugs, drinking glasses, stacked white bowls and plates and folded striped towels, with a red microwave below and a framed print above", "Cabinets stocked with pots, pans, dishes and glasses."),
  kitchenAppliances: ph(kitAppliances, "Kitchen counter in beige tile with oak cabinets above and below, holding a blender, a case of bottled water, a Black+Decker toaster oven, a red coffee maker and a red microwave, beside a striped curtain and a door", "Toaster oven, coffee maker and microwave along the counter."),

  bedA: ph(p07, "Bedroom with a gray upholstered headboard, black-and-white patterned bedding, a lamp on a wooden nightstand, three framed abstract prints, and a large plant", "Gray upholstered headboard and layered bedding."),
  bedAWindow: ph(bedAWindow, "Bedroom with a gray upholstered headboard, white bedding and a black patterned pillow, folded towels at the foot of the bed, a wood dresser with a checkered-shade lamp and a tall plant, three framed abstract prints above the bed, and a window with patterned curtains", "The wide view of bedroom one: dresser, plant, and three framed prints."),
  bedB: ph(p17, "Bedroom with a bed in gray-and-white striped bedding, a cream dresser with mirror, a wooden nightstand, a birch-tree painting, and an open door to the next room", "Striped bedding, cream dresser, and a birch-tree painting."),
  bedBTv: ph(bedB2, "Bedroom with striped bedding on a bed, a wall-mounted TV, a round wall clock, a window with white curtains, and dark carpet", "A wall-mounted TV and a window with white curtains."),
  bedC: ph(p01, "Bedroom with a bed in white bedding, a wall-mounted TV above a low media bench, a white door, white curtains, and a framed landscape print", "White bedding, a wall-mounted TV, and a framed landscape print."),
  bedCAc: ph(bedC2, "Bedroom with a bed in white bedding with a medallion pattern, a wooden chest nightstand, table lamps, a round wall clock, a wall air-conditioning unit, and a mirror", "Medallion bedding, table lamps, and a wall air-conditioning unit."),
  bedCMedia: ph(bedCMedia, "Bedroom three with a flat-screen TV mounted on the wall above a dark wooden cabinet, a digital piano keyboard resting on the cabinet, a black leather office chair, and a window with white curtains behind a white roller shade", "The wall-mounted TV, piano keyboard and office chair.", "50% 38%"),
  bath: ph(p40, "Bathroom with a tub and shower behind a navy-and-white striped curtain, a wood-cabinet vanity with a small sink, a toilet, a framed mirror, and wall shelves with plants", "Tub-and-shower, wood vanity, and plant shelves."),

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
  address: { kind: "street", streetAddress: "2712 Broad St", locality: "Parkersburg", region: "WV", postalCode: "26101", lat: 39.279273, lng: -81.530239 },
  bedrooms: 3,
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
    { label: "Sleeps", value: "Number of guests", status: "confirm" },
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
      faqs: [
        { q: "Are there steps up to the house?", a: "Yes. Wooden steps and a stepping-stone path run up the sloped yard from the street. Ask us about the step count and any step-free entrance.", status: "photographed" },
        { q: "Is there somewhere to sit outside?", a: "Yes. The covered porch has two chairs and a side table.", status: "photographed" },
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
      faqs: [
        { q: "Is there a proper dining table?", a: "Yes. An oval table with white spindle-back chairs stands by a double window, next to the kitchen. Ask us how many chairs it seats.", status: "photographed" },
      ],
    },
    {
      slug: "kitchen",
      name: "Kitchen",
      summary: "Honey-oak cabinets, a full run of counters, and everyday appliances, open to the dining room.",
      photos: [photos.kitchen, photos.kitchenDoor, photos.kitchenLong, photos.kitchenSink, photos.kitchenAppliances, photos.kitchenSinkWide, photos.kitchenCabinets],
      notes: [
        { text: "Full kitchen.", status: "listed" },
        { text: "Electric range with coil burners, full-size refrigerator, microwave, and toaster oven.", status: "photographed" },
        { text: "Double sink under a window, and a coffee maker on the counter.", status: "photographed" },
        { text: "Cookware, dishes, glasses and mugs are stocked in the cabinets.", status: "photographed" },
        { text: "Dishwasher, and whether more small appliances are supplied.", status: "confirm" },
      ],
      faqs: [
        { q: "Is this a full kitchen?", a: "Yes. The listing names a full kitchen, and the photos show an electric range with an oven, a full-size refrigerator, a microwave and a toaster oven.", status: "photographed" },
        { q: "Is there coffee in the morning?", a: "A coffee maker sits on the counter.", status: "photographed" },
        { q: "Is there a dishwasher?", a: "One is not clear in the photos. Ask us, along with cookware and dishes.", status: "confirm" },
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
      faqs: [
        { q: "Can three adults each have their own room?", a: "Yes. The home is listed with three bedrooms, and each one photographed has a made bed, a nightstand and a lamp. Ask us about bed sizes.", status: "listed" },
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
      faqs: [
        { q: "Is there a TV in this bedroom?", a: "Yes. A TV is mounted on the wall, with a cream dresser and mirror below the window.", status: "photographed" },
      ],
    },
    {
      slug: "bedroom-three",
      name: "Bedroom three",
      summary: "A bed in white bedding, a wall TV, and a wall air-conditioning unit.",
      photos: [photos.bedC, photos.bedCAc, photos.bedCMedia],
      notes: [
        { text: "Wall-mounted TV on a low media bench, and a framed landscape print.", status: "photographed" },
        { text: "Wall air-conditioning unit, round wall clock, and table lamps.", status: "photographed" },
        { text: "A digital piano keyboard rests on the dark wooden cabinet below the wall-mounted TV.", status: "photographed" },
        { text: "The photos dress the bed differently; confirm they show the same room and which bedroom has the air conditioner.", status: "confirm" },
        { text: "Bed size.", status: "confirm" },
      ],
      faqs: [
        { q: "Is there air conditioning?", a: "A wall air-conditioning unit is photographed in a bedroom. Ask us which rooms are cooled and how the home is heated.", status: "photographed" },
      ],
    },
    {
      slug: "bathroom",
      name: "Bathroom",
      summary: "A bright white bathroom with a tub and shower, a wood vanity, and a window.",
      photos: [photos.bath],
      notes: [
        { text: "Tub with shower and striped curtain, wood vanity with small sink, toilet, and mirror.", status: "photographed" },
        { text: "Frosted window over the shower.", status: "photographed" },
        { text: "Whether there is more than one bathroom.", status: "confirm" },
      ],
      faqs: [
        { q: "Is it a tub or a shower?", a: "A tub with a shower over it, behind a striped curtain.", status: "photographed" },
        { q: "How many bathrooms are there?", a: "One full bathroom is photographed. Ask us whether there is a second before booking for three.", status: "confirm" },
        { q: "What if something drips or clogs?", a: "Send the home, the room, the problem, the timing and a helpful photo through the maintenance path. For fire, major flooding or immediate danger, call 911 first, then resident support.", status: "confirmed" },
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
        { name: "Cookware, dishes and glassware", status: "photographed" },
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
        { name: "Utilities included", status: "listed" },
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
  concepts: [
    {
      src: conceptDining,
      alt: "AI-generated concept: a 45-degree view of a bright dining room with an oval navy table and white chairs by a curtained window, open to a kitchen with honey-oak cabinets and white appliances",
      caption: "Concept only. An imagined take on the dining room opening onto the kitchen, based on the photos. The beamed ceiling, windows and décor are invented.",
    },
    {
      src: conceptBedroom,
      alt: "AI-generated concept: a cutaway view from above of a bedroom with a gray upholstered headboard, white bedding, a wooden dresser, two nightstands with lamps, a patterned rug and a curtained window",
      caption: "Concept only. An imagined layout of bedroom one, based on the photos. Room size and furniture placement are not confirmed.",
    },
  ],
  nearby: parkersburgNearby,
  directionsFrom: parkersburgDirectionsFrom,
  guide: residentGuide({
    id: "oak",
    internet: { text: "Internet: fiber-optic, per the listing.", status: "listed" },
    laundry: { text: "Laundry: a washer and dryer, to confirm on inquiry.", status: "confirm" },
  }),
};
