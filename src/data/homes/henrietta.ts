import type { HomeMicrosite, HomePhoto } from "./types";
import { publishedLuxuryFurnishedRates } from "../site";
import p04 from "../../../assets/images/cottages/ravenswood-03/photo-04.avif";
import p06 from "../../../assets/images/cottages/ravenswood-03/photo-06.avif";
import p13 from "../../../assets/images/cottages/ravenswood-03/photo-13.avif";
import p17 from "../../../assets/images/cottages/ravenswood-03/photo-17.avif";
import p31 from "../../../assets/images/cottages/ravenswood-03/photo-31.avif";
import p36 from "../../../assets/images/cottages/ravenswood-03/photo-36.avif";
import p40 from "../../../assets/images/cottages/ravenswood-03/photo-40.avif";
import p42 from "../../../assets/images/cottages/ravenswood-03/photo-42.avif";
import laundryWasher from "../../../assets/images/cottages/ravenswood-03/unique/available-img-428-c44a6dc5bc-648x470.avif";
import blueBath from "../../../assets/images/cottages/ravenswood-03/unique/ravenswood-henrietta-cottage-img-250-6435685889-648x470.avif";
import stripedRoomDoor from "../../../assets/images/cottages/ravenswood-03/unique/ravenswood-henrietta-cottage-img-290-88a4997131-648x470.avif";
import diningMantel from "../../../assets/images/cottages/ravenswood-03/unique/ravenswood-henrietta-cottage-img-299-09dbabf583-648x470.avif";
import kitchenWide from "../../../assets/images/cottages/ravenswood-03/unique/apply-background-303-8f0c3cac6a-1920x869.avif";
import conceptDining from "../../../assets/images/cottages/ravenswood-03/3d/henrietta-dining-45.jpg";
import conceptKitchen from "../../../assets/images/cottages/ravenswood-03/3d/henrietta-kitchen-top-down.jpg";

const photos = {
  dining: {
    src: p17,
    alt: "Dining room with light blue walls, an oval dark-wood table with burgundy upholstered chairs, a bookcase, a tall mirror and hardwood floor",
    caption: "The blue dining room seats the table and chairs shown here.",
  },
  diningMantel: {
    src: diningMantel,
    alt: "Dining room seen from the other end, showing the oval table, a white fireplace mantel with decorative pieces, a mirror and a doorway to a striped-wallpaper room",
    caption: "The same room from the mantel end.",
  },
  stripedRoom: {
    src: p06,
    alt: "Room with green and white striped wallpaper, a round wooden table with teal and wood chairs, a window with a curtain and a pendant light",
    caption: "A striped-wallpaper room with a round table.",
  },
  stripedRoomDoor: {
    src: stripedRoomDoor,
    alt: "Striped-wallpaper room with a round table, teal chairs and an open doorway leading toward the blue dining room and a bookcase",
    caption: "An open doorway links this room to the dining room.",
  },
  kitchen: {
    src: p31,
    alt: "Kitchen with oak cabinets, a white gas range with a floral kettle, a pine table with white spindle chairs, and a staircase with white railing at left",
    caption: "Oak cabinets, a gas range and an eat-in table, with the stairs beside.",
  },
  kitchenWide: {
    src: kitchenWide,
    alt: "Wide view of the kitchen with oak cabinets, a white refrigerator and dishwasher, a gray-green hutch with a plate rack, a pine table with white chairs and stairs at right",
    caption: "Refrigerator, dishwasher and a hutch with dish storage.",
  },
  piano: {
    src: p13,
    alt: "Corner next to the kitchen with an upright piano, vertical wood paneling, a patterned wallpaper border, flowers in vases and a white door with a window",
    caption: "An upright piano sits in the corner by the kitchen.",
  },
  bedroom: {
    src: p42,
    alt: "Bedroom with a bed in light gray bedding, a dark wood nightstand, two windows with patterned curtains, a built-in shelving unit and dark hardwood floor",
    caption: "A bedroom with a bed, nightstand and shelving.",
  },
  bedroomMirror: {
    src: p40,
    alt: "Bedroom from the foot of the bed, showing the bed with gray bedding, a lamp on a nightstand, a large mirror, a shelving unit and a window",
    caption: "The same bedroom from the opposite corner.",
  },
  bath: {
    src: p04,
    alt: "Bathroom with marbled gold wallpaper, a toilet, a tub-shower behind a floral curtain, a wooden peg rack and a built-in linen cabinet with folded towels",
    caption: "A bathroom with a tub-shower and built-in linen storage.",
  },
  blueBath: {
    src: blueBath,
    alt: "Small bathroom with blue wainscoting, a toilet under a sloped ceiling with built-in shelves, and a blue patterned shower curtain at left",
    caption: "A second bathroom with blue wainscoting and a sloped ceiling.",
  },
  laundry: {
    src: laundryWasher,
    alt: "Utility corner with a white top-loading washing machine beneath a window, a red painted wall with a straw hat, and a doorway to the blue bathroom",
    caption: "A washing machine sits by the window near the back bathroom.",
  },
  yard: {
    src: p36,
    alt: "Lawn with a flower-bed edge and trees, seen from a white porch railing, with a fence along the right side, a white church and a street in the distance",
    caption: "The lawn and fence as seen from the porch.",
  },
} satisfies Record<string, HomePhoto>;

export const henriettaHome: HomeMicrosite = {
  id: "henrietta",
  slug: "henrietta-cottage",
  name: "Henrietta Cottage",
  town: { name: "Ravenswood", state: "WV", slug: "ravenswood" },
  tagline: "A two-bedroom furnished home with a blue dining room and a lawn in a quiet river town.",
  summary:
    "Henrietta Cottage is a furnished two-bedroom home in Ravenswood. Inside, the photos show a blue dining room with an oval table, a striped-wallpaper room with a round table, an oak-cabinet kitchen with a gas range and an eat-in table, a furnished bedroom, and two bathrooms. Outside there is a lawn with a fence and trees. Details that are not yet confirmed are marked on this page.",
  address: {
    streetAddress: "200 Henrietta St",
    locality: "Ravenswood",
    region: "WV",
    postalCode: "26164",
    lat: 38.948959,
    lng: -81.757844,
  },
  bedrooms: 2,
  priceGuide: publishedLuxuryFurnishedRates["2 Bedrooms"],
  hero: photos.dining,
  highlights: [
    {
      title: "A dining room made for sharing meals",
      body: "A blue-walled room with an oval table, bookcase and mantel, plus a second striped-wallpaper room with a round table.",
      photo: photos.diningMantel,
    },
    {
      title: "A kitchen that works for daily cooking",
      body: "Oak cabinets, a gas range, a full-size refrigerator, a dishwasher and an eat-in table.",
      photo: photos.kitchenWide,
    },
    {
      title: "Lawn, fence and trees",
      body: "A fenced lawn with mature trees, seen from the porch.",
      photo: photos.yard,
    },
  ],
  facts: [
    { label: "Address", value: "200 Henrietta St, Ravenswood, WV 26164", status: "confirmed" },
    { label: "Bedrooms", value: "2", status: "listed" },
    { label: "Furnishing", value: "Furnished", status: "listed" },
    { label: "Bedrooms photographed", value: "One of the two bedrooms (two angles)", status: "photographed" },
    { label: "Bathrooms", value: "Two bathrooms appear in the photos; the official count is to be confirmed", status: "confirm" },
    { label: "Levels", value: "A staircase is visible beside the kitchen, so the home has more than one level; layout to be confirmed", status: "photographed" },
    { label: "Internet", value: "Fiber-optic internet is the Mt Cottages standard; confirm for this home", status: "confirm" },
    { label: "Laundry", value: "A washing machine is photographed; dryer to be confirmed", status: "confirm" },
    { label: "Parking", value: "Off-street parking", status: "confirm" },
    { label: "Utilities", value: "Which utilities are included", status: "confirm" },
    { label: "Pets", value: "Pet policy", status: "confirm" },
    { label: "Sleeping capacity", value: "Number of guests the home sleeps", status: "confirm" },
    { label: "Square footage", value: "Size of the home", status: "confirm" },
  ],
  rooms: [
    {
      slug: "dining",
      name: "Dining room",
      summary: "A blue-walled room with an oval table, burgundy chairs and a built-in mantel.",
      photos: [photos.dining, photos.diningMantel],
      notes: [
        { text: "Oval dark-wood table with upholstered chairs.", status: "photographed" },
        { text: "Bookcase, large mirror and a white fireplace mantel.", status: "photographed" },
        { text: "Hardwood floor.", status: "photographed" },
        { text: "Number of seats at the table.", status: "confirm" },
      ],
    },
    {
      slug: "breakfast-room",
      name: "Striped-wallpaper room",
      summary: "A bright room with green and white striped walls, a round table and teal chairs.",
      photos: [photos.stripedRoom, photos.stripedRoomDoor],
      notes: [
        { text: "Round wooden table with teal and wood chairs.", status: "photographed" },
        { text: "Open doorway to the dining room.", status: "photographed" },
        { text: "Whether this room is used as a breakfast room, sitting room or both.", status: "confirm" },
      ],
    },
    {
      slug: "kitchen",
      name: "Kitchen",
      summary: "An oak-cabinet kitchen with a gas range and an eat-in table.",
      photos: [photos.kitchen, photos.kitchenWide, photos.piano],
      notes: [
        { text: "Gas range, white refrigerator with ice dispenser and a dishwasher.", status: "photographed" },
        { text: "Pine table with white spindle chairs.", status: "photographed" },
        { text: "Hutch with plate rack, plus a stand mixer and blender on the counter.", status: "photographed" },
        { text: "A staircase rises from the kitchen area.", status: "photographed" },
        { text: "An upright piano is in the corner beside the kitchen.", status: "photographed" },
        { text: "Cookware, dishes and small appliances provided for guests.", status: "confirm" },
      ],
    },
    {
      slug: "bedroom",
      name: "Bedroom",
      summary: "A furnished bedroom with built-in shelving and plenty of light.",
      photos: [photos.bedroom, photos.bedroomMirror],
      notes: [
        { text: "Bed with gray bedding and a nightstand with a lamp.", status: "photographed" },
        { text: "Built-in shelving unit, large mirror and two windows.", status: "photographed" },
        { text: "Bed size.", status: "confirm" },
        { text: "The second bedroom has not been photographed yet.", status: "confirm" },
      ],
    },
    {
      slug: "bathrooms",
      name: "Bathrooms",
      summary: "Two distinct bathrooms appear in the photos.",
      photos: [photos.bath, photos.blueBath],
      notes: [
        { text: "One bathroom with a tub-shower, peg rack and built-in linen cabinet.", status: "photographed" },
        { text: "A second bathroom with blue wainscoting, a toilet and a shower curtain.", status: "photographed" },
        { text: "Whether the second bathroom is a full bath or a half bath.", status: "confirm" },
      ],
    },
    {
      slug: "laundry",
      name: "Laundry",
      summary: "A washing machine sits in a utility corner by a window.",
      photos: [photos.laundry],
      notes: [
        { text: "White top-loading washing machine.", status: "photographed" },
        { text: "Dryer.", status: "confirm" },
      ],
    },
    {
      slug: "outdoors",
      name: "Yard",
      summary: "A grassy lawn with mature trees and a fence, seen from the porch.",
      photos: [photos.yard],
      notes: [
        { text: "Lawn, fence and trees.", status: "photographed" },
        { text: "A white porch railing frames the view.", status: "photographed" },
        { text: "Whether the whole yard is private and fenced.", status: "confirm" },
        { text: "No photo of the front of the house is available yet.", status: "confirm" },
      ],
    },
  ],
  amenities: [
    {
      group: "Kitchen",
      items: [
        { name: "Full kitchen", status: "listed" },
        { name: "Gas range", status: "photographed" },
        { name: "Refrigerator with ice dispenser", status: "photographed" },
        { name: "Dishwasher", status: "photographed" },
        { name: "Eat-in table", status: "photographed" },
        { name: "Cookware and dishes", status: "confirm" },
      ],
    },
    {
      group: "Sleeping",
      items: [
        { name: "Two private bedrooms", status: "listed" },
        { name: "Furnished bedroom with shelving", status: "photographed" },
        { name: "Bed sizes", status: "confirm" },
      ],
    },
    {
      group: "Living & dining",
      items: [
        { name: "Dining room", status: "listed" },
        { name: "Second table room with striped wallpaper", status: "photographed" },
        { name: "Hardwood floors", status: "photographed" },
        { name: "Living room", status: "confirm" },
        { name: "Heating and air conditioning", status: "confirm" },
      ],
    },
    {
      group: "Laundry & utilities",
      items: [
        { name: "Washing machine", status: "photographed" },
        { name: "Dryer", status: "confirm" },
        { name: "Utilities included", status: "confirm" },
      ],
    },
    {
      group: "Outdoors",
      items: [
        { name: "Outdoor space", status: "listed" },
        { name: "Lawn with fence and trees", status: "photographed" },
        { name: "Off-street parking", status: "confirm" },
      ],
    },
    {
      group: "Connectivity",
      items: [
        { name: "Fiber-optic internet", status: "confirm" },
        { name: "Quiet setting", status: "listed" },
      ],
    },
    {
      group: "Support",
      items: [{ name: "Guest support", status: "listed" }],
    },
  ],
  plan: {
    note: "Illustrative concept only, not a measured plan. A staircase is visible in the kitchen photos, so the home has more than one level. Which level each room is on, and the size of the second bedroom, are assumptions to be confirmed.",
    floors: [
      {
        name: "Main level (concept)",
        rooms: [
          { id: "kitchen", label: "Kitchen", kind: "kitchen", x: 0, y: 0, w: 16, h: 14 },
          { id: "stairs-main", label: "Stairs", kind: "stairs", x: 16, y: 0, w: 4, h: 14 },
          { id: "striped", label: "Striped room", kind: "dining", x: 20, y: 0, w: 12, h: 14 },
          { id: "laundry", label: "Laundry", kind: "laundry", x: 0, y: 14, w: 8, h: 8 },
          { id: "bath-blue", label: "Bath", kind: "bath", x: 8, y: 14, w: 6, h: 8 },
          { id: "dining", label: "Dining room", kind: "dining", x: 14, y: 14, w: 18, h: 14 },
        ],
      },
      {
        name: "Upper level (concept)",
        rooms: [
          { id: "bed1", label: "Bedroom", kind: "bedroom", x: 0, y: 0, w: 16, h: 14 },
          { id: "stairs-up", label: "Stairs", kind: "stairs", x: 16, y: 0, w: 4, h: 14 },
          { id: "bed2", label: "Bedroom 2", kind: "bedroom", x: 20, y: 0, w: 12, h: 14 },
          { id: "bath-tub", label: "Bath", kind: "bath", x: 0, y: 14, w: 10, h: 8 },
        ],
      },
    ],
  },
  concepts: [
    {
      src: conceptDining,
      alt: "AI-generated concept: a 45-degree view from above of a light blue dining room with a white fireplace mantel, an oval dark-wood table with burgundy chairs, wooden bookcases, a tall standing mirror and a sash window",
      caption: "Concept only. An imagined take on the blue dining room, based on the photos. The décor, window and extra furniture are invented.",
    },
    {
      src: conceptKitchen,
      alt: "AI-generated concept: a cutaway view from above of a cottage kitchen with honey-oak cabinets, a white gas range with a kettle, a white refrigerator, a gray-green hutch with plates, a pine table with white spindle chairs and a staircase with white railings",
      caption: "Concept only. An imagined layout of the kitchen, based on the photos. The real room's shape, and where the stairs go, are not confirmed.",
    },
  ],
  nearby: [
    { name: "Jackson General Hospital", kind: "health", note: "The county's hospital, a WVU Medicine facility on Pinnell Street in Ripley.", mapsQuery: "Jackson General Hospital 122 Pinnell St Ripley WV" },
    { name: "Ravenswood Foodfair", kind: "grocery", note: "A grocery store on Washington Street in Ravenswood.", mapsQuery: "Foodfair 423 Washington St Ravenswood WV" },
    { name: "Walmart Supercenter", kind: "shopping", note: "A larger store for groceries and household needs on Academy Drive in Ripley.", mapsQuery: "Walmart Supercenter 200 Academy Dr Ripley WV" },
    { name: "Washington Riverfront Park", kind: "park", note: "Ravenswood's park on the Ohio River, where the city has been adding river access and a marina.", mapsQuery: "Riverfront Park Ravenswood WV" },
    { name: "Gino's Pizza & Spaghetti House", kind: "food", note: "A sit-down pizza and pasta restaurant on Washington Street.", mapsQuery: "Gino's Pizza Spaghetti House 404 Washington St Ravenswood WV" },
    { name: "Ravenswood Branch Library", kind: "civic", note: "The Ravenswood branch of the Jackson County public libraries on Virginia Street.", mapsQuery: "Jackson County Public Library Ravenswood Branch Ravenswood WV" },
    { name: "Ravenswood City Hall", kind: "civic", note: "The city's municipal offices, including the city clerk.", mapsQuery: "Ravenswood Municipal Building Ravenswood WV" },
    { name: "Ravenswood Middle School", kind: "school", note: "Public middle school for grades 6 to 8 on South Ritchie Avenue.", mapsQuery: "Ravenswood Middle School 514 S Ritchie Ave Ravenswood WV" },
    { name: "Ravenswood High School", kind: "school", note: "Public high school for grades 9 to 12 on Plaza Drive.", mapsQuery: "Ravenswood High School 100 Plaza Dr Ravenswood WV" },
  ],
  directionsFrom: [
    { label: "I-77 Ravenswood exit", origin: "I-77 Exit 146 Ravenswood WV" },
    { label: "Jackson General Hospital", origin: "Jackson General Hospital 122 Pinnell St Ripley WV 25271" },
    { label: "Downtown Parkersburg", origin: "Downtown Parkersburg WV" },
  ],
};
