import type { Residence } from "../residences";
import mariettaExterior from "../../../assets/images/cottages/marietta-01/frederick-backyard-cover.jpg";
import mariettaFrontDrive from "../../../assets/images/cottages/marietta-01/frederick-ext-1.jpeg";
import mariettaFrontLawn from "../../../assets/images/cottages/marietta-01/frederick-ext-2.jpeg";
import mariettaFrontSnow from "../../../assets/images/cottages/marietta-01/frederick-ext-3.jpeg";
import mariettaKitchen from "../../../assets/images/cottages/marietta-01/gallery-01.jpg";
import mariettaKitchenFull from "../../../assets/images/cottages/marietta-01/frederick-kitchen-1.avif";
import mariettaKitchenSink from "../../../assets/images/cottages/marietta-01/frederick-kitchen-2.avif";
import mariettaKitchenRange from "../../../assets/images/cottages/marietta-01/frederick-kitchen-3.avif";
import mariettaLiving from "../../../assets/images/cottages/marietta-01/frederick-living-1.jpeg";
import mariettaBedroom from "../../../assets/images/cottages/marietta-01/frederick-bed1-1.avif";
import mariettaBedroomAlt from "../../../assets/images/cottages/marietta-01/photo-36.jpg";
import mariettaSecondBedroom from "../../../assets/images/cottages/marietta-01/frederick-bed2-1.jpeg";
import mariettaSecondBedroomAlt from "../../../assets/images/cottages/marietta-01/photo-25.jpg";
import mariettaDining from "../../../assets/images/cottages/marietta-01/frederick-dining-1.avif";
import mariettaDiningSet from "../../../assets/images/cottages/marietta-01/frederick-dining-2.avif";
import mariettaDiningEntry from "../../../assets/images/cottages/marietta-01/frederick-dining-3.avif";
import mariettaDiningClassic from "../../../assets/images/cottages/marietta-01/photo-27.jpg";
import mariettaBath from "../../../assets/images/cottages/marietta-01/frederick-bath-1.jpg";
import mariettaBathVanity from "../../../assets/images/cottages/marietta-01/frederick-bath-2.jpg";
import mariettaBedThree from "../../../assets/images/cottages/marietta-01/frederick-bed3-1.jpeg";
import mariettaBedThreeWide from "../../../assets/images/cottages/marietta-01/frederick-bed3-2.jpeg";
import mariettaBedThreeTv from "../../../assets/images/cottages/marietta-01/frederick-bed3-3.avif";
import mariettaWildlifeWoods from "../../../assets/images/cottages/marietta-01/frederick-wildlife-1.avif";
import mariettaWildlifeLeaves from "../../../assets/images/cottages/marietta-01/frederick-wildlife-2.avif";
import mariettaBuckeyeFields from "../../../assets/images/cottages/marietta-01/frederick-buckeye-park-1.png";
import mariettaBuckeyeShelter from "../../../assets/images/cottages/marietta-01/frederick-buckeye-park-2.png";
import mariettaBuckeyePlayground from "../../../assets/images/cottages/marietta-01/frederick-buckeye-park-3.png";
import mariettaNearbyShopping from "../../../assets/images/cottages/marietta-01/frederick-nearby-shopping.png";
import mariettaNearbySelby from "../../../assets/images/cottages/marietta-01/frederick-nearby-selby.png";
import mariettaNearbyKroger from "../../../assets/images/cottages/marietta-01/frederick-nearby-kroger.png";
import mariettaNearbyTrail from "../../../assets/images/cottages/marietta-01/frederick-nearby-trail.jpeg";
import mariettaNearbyTrail2 from "../../../assets/images/cottages/marietta-01/frederick-nearby-trail-2.jpeg";
import mariettaNearbyFood from "../../../assets/images/cottages/marietta-01/frederick-nearby-food.webp";
import mariettaNearbyFood2 from "../../../assets/images/cottages/marietta-01/frederick-nearby-food-2.jpeg";
import mariettaNearbyFood3 from "../../../assets/images/cottages/marietta-01/frederick-nearby-food-3.jpg";
import mariettaNearbyFood4 from "../../../assets/images/cottages/marietta-01/frederick-nearby-food-4.jpg";

export const frederickPhotos = {
  exterior: {
    src: mariettaExterior,
    alt: "Frederick Cottage backyard with lawn, white picket fence, patio seating, and autumn trees",
    caption: "The backyard offers lawn, fencing, and sitting space.",
    focal: "50% 40%",
  },
  exteriorFrontDrive: {
    src: mariettaFrontDrive,
    alt: "Frederick Cottage front exterior with driveway, lawn, and green shutters",
    caption: "Front arrival with driveway, lawn, and shaded trees.",
  },
  exteriorFrontLawn: {
    src: mariettaFrontLawn,
    alt: "Frederick Cottage front porch with white picket fence and summer lawn",
    caption: "Front porch and picket fence in summer.",
  },
  exteriorFrontSnow: {
    src: mariettaFrontSnow,
    alt: "Frederick Cottage front exterior in snow with covered porch",
    caption: "The front in winter with its covered porch.",
  },
  kitchen: {
    src: mariettaKitchen,
    alt: "Frederick Cottage kitchen with oak cabinets and full-size appliances",
    caption: "The kitchen is set up for everyday meals.",
  },
  kitchenSink: {
    src: mariettaKitchenSink,
    alt: "Frederick Cottage kitchen sink with oak cabinets, glass-paneled door, and gas range",
    caption: "Sink wall with oak cabinets, pantry door, and range.",
  },
  kitchenFull: {
    src: mariettaKitchenFull,
    alt: "Frederick Cottage full kitchen with gas range, dishwasher, sink, and oak cabinets",
    caption: "Full kitchen with range, dishwasher, and windows.",
  },
  kitchenRange: {
    src: mariettaKitchenRange,
    alt: "Frederick Cottage gas range with counter run and full-size refrigerator",
    caption: "Range, counter workspace, and full-size refrigerator.",
  },
  living: {
    src: mariettaLiving,
    alt: "Frederick Cottage main room with long wooden table, blue walls, door, and windows",
    caption: "The main gathering room with table space and daylight.",
  },
  primaryBedroom: {
    src: mariettaBedroom,
    alt: "Frederick Cottage primary bedroom with king bed, blue walls, ceiling fan, and large TV",
    caption: "The primary bedroom with king bed, TV, and daylight from three windows.",
  },
  primaryBedroomAlt: {
    src: mariettaBedroomAlt,
    alt: "Frederick Cottage primary bedroom with a large bed and windows",
    caption: "An additional view of the primary bedroom with room to unpack and rest.",
  },
  secondBedroom: {
    src: mariettaSecondBedroom,
    alt: "Frederick Cottage second bedroom with bed, wall-mounted TV, wood floor, and window",
    caption: "The second bedroom with wall-mounted TV and wood floors.",
  },
  secondBedroomAlt: {
    src: mariettaSecondBedroomAlt,
    alt: "Frederick Cottage second bedroom with a bed and vintage vanity",
    caption: "A second view of the second bedroom with its own character.",
  },
  dining: {
    src: mariettaDining,
    alt: "Frederick Cottage dining nook with wooden table, spindle chairs, window, and lamp",
    caption: "The dining nook with table, chairs, and window light.",
  },
  diningSet: {
    src: mariettaDiningSet,
    alt: "Frederick Cottage dining room with set table, bench seating, ceiling fan, and window",
    caption: "The dining table set for a shared meal.",
  },
  diningEntry: {
    src: mariettaDiningEntry,
    alt: "Frederick Cottage dining area opening to staircase, entry, and kitchen glimpse",
    caption: "Dining opening to the stairs, entry, and kitchen.",
  },
  diningClassic: {
    src: mariettaDiningClassic,
    alt: "Frederick Cottage dining and entry area with table and staircase",
    caption: "The dining area connects the home's daily spaces.",
  },
  bathroom: {
    src: mariettaBath,
    alt: "Frederick Cottage bathroom with shower, toilet, wall cabinet, and tile floor",
    caption: "A bright bath with shower, storage, and a window.",
  },
  bathroomVanity: {
    src: mariettaBathVanity,
    alt: "Frederick Cottage bathroom vanity with sink, mirrored cabinet, and light bar",
    caption: "The vanity with sink, mirrored storage, and lighting.",
  },
  thirdBedroom: {
    src: mariettaBedThree,
    alt: "Frederick Cottage third bedroom with queen bed, lamps, and textured walls",
    caption: "The third bedroom with a queen bed and warm light.",
  },
  thirdBedroomWide: {
    src: mariettaBedThreeWide,
    alt: "Frederick Cottage third bedroom with queen bed, shelving, desk, and windows",
    caption: "The third bedroom's storage wall, desk corner, and windows.",
  },
  thirdBedroomTv: {
    src: mariettaBedThreeTv,
    alt: "Frederick Cottage third bedroom with queen bed, television, and glass-paneled door",
    caption: "The third bedroom's TV corner and garden-door outlook.",
  },
  wildlifeWoods: {
    src: mariettaWildlifeWoods,
    alt: "Dense trees with early fall color seen from Frederick Cottage",
    caption: "Tree canopy with early fall color.",
  },
  wildlifeLeaves: {
    src: mariettaWildlifeLeaves,
    alt: "Fall leaves covering the ground under large maples near Frederick Cottage",
    caption: "Fall leaves under nearby maples.",
  },
  buckeyeFields: {
    src: mariettaBuckeyeFields,
    alt: "Buckeye Park sports fields at dusk with floodlights and lawn",
    caption: "Buckeye Park sports fields at dusk.",
  },
  buckeyeShelter: {
    src: mariettaBuckeyeShelter,
    alt: "Buckeye Park picnic shelter with tables overlooking the pond",
    caption: "Buckeye Park picnic shelter by the pond.",
  },
  buckeyePlayground: {
    src: mariettaBuckeyePlayground,
    alt: "Buckeye Park playground with climbing structure, benches, and lawn",
    caption: "Buckeye Park playground and lawn.",
  },
  nearbyShopping: {
    src: mariettaNearbyShopping,
    alt: "Walmart grocery pickup entrance with blue facade and parked cars",
    caption: "Walmart grocery pickup entrance for daily shopping.",
  },
  nearbyHospital: {
    src: mariettaNearbySelby,
    alt: "Selby General Hospital reception lobby with front desk and seating",
    caption: "Selby General Hospital reception and front desk.",
  },
  nearbyEssentials: {
    src: mariettaNearbyKroger,
    alt: "Kroger storefront with pharmacy entrance under a clear sky",
    caption: "Kroger storefront with pharmacy entrance.",
  },
  nearbyTrail: {
    src: mariettaNearbyTrail,
    alt: "Wooded trail with tall trees and a natural path near Marietta",
    caption: "Wooded trail near the cottage.",
  },
  nearbyTrail2: {
    src: mariettaNearbyTrail2,
    alt: "Second wooded trail view near Marietta",
    caption: "Another trail view near the cottage.",
  },
  nearbyFood: {
    src: mariettaNearbyFood,
    alt: "Local restaurant spread with shared plates near Frederick Cottage",
    caption: "Local restaurant spread near the cottage.",
  },
  nearbyFood2: {
    src: mariettaNearbyFood2,
    alt: "Levee House Bistro plate near Frederick Cottage",
    caption: "Levee House Bistro plate near the cottage.",
  },
  nearbyFood3: {
    src: mariettaNearbyFood3,
    alt: "Third local restaurant dish near Frederick Cottage",
    caption: "A third local plate near the cottage.",
  },
  nearbyFood4: {
    src: mariettaNearbyFood4,
    alt: "Fourth local restaurant dish near Frederick Cottage",
    caption: "Another local plate near the cottage.",
  },
};

export const frederick: Residence = {
  id: "frederick",
  name: "Frederick Cottage",
  town: "Marietta, OH",
  tagline: "A three-bedroom Research Residence with room to sleep, cook, gather, and work.",
  summary:
    "Frederick Cottage is Mt Cottages' Marietta home base: three bedrooms (king, double, and queen sleeping six), a working kitchen, living and dining space, 1 Gbps internet, and a fenced backyard. This microsite walks each space room by room so a new resident can picture daily life before asking follow-up questions.",
  price: "$1,395/month",
  bedrooms: "3 Bedrooms",
  basePath: "marietta/frederick",
  listingPath: "marietta/index.html",
  hero: frederickPhotos.exterior,
  facts: [
    { label: "Space", value: "3 Bedrooms" },
    { label: "Beds", value: "King · Double · Queen" },
    { label: "Sleeps", value: "6 guests" },
    { label: "Baths", value: "1 full bath" },
    { label: "Home", value: "Furnished" },
    { label: "Monthly guide", value: "$1,395/month" },
    { label: "Stay shape", value: "30 days or longer" },
    { label: "Town", value: "Marietta, OH" },
    { label: "Neighborhood", value: "Residential street, lawn and trees" },
  ],
  nav: [
    { label: "Home", href: "/marietta/frederick/index.html", description: "Story, highlights, and room previews." },
    { label: "Bedrooms", href: "/marietta/frederick/rooms.html", description: "Each bedroom as its own destination." },
    { label: "Kitchen", href: "/marietta/frederick/kitchen.html", description: "Cooking, storage, and daily meals." },
    { label: "Bathroom", href: "/marietta/frederick/bathrooms.html", description: "Baths, routines, and what to confirm." },
    { label: "Living & work", href: "/marietta/frederick/living.html", description: "Sitting room, dining, entry, and work corners." },
    { label: "Outdoors", href: "/marietta/frederick/outdoors.html", description: "Backyard lawn, picket fence, patio seating, and trees." },
    { label: "Gallery", href: "/marietta/frederick/gallery.html", description: "Photography organized by space." },
    { label: "Amenities", href: "/marietta/frederick/amenities.html", description: "Everything provided, in one checklist." },
    { label: "Nearby", href: "/marietta/frederick/area.html", description: "Trails, food, shopping, hospitals, parks, wildlife and seasons, events, transit, essentials — searchable." },
    { label: "Utilities", href: "/marietta/frederick/utilities.html", description: "Utilities, trash, systems, and maintenance." },
    { label: "Arrival & map", href: "/marietta/frederick/arrival.html", description: "How to arrive without guesswork." },
    { label: "Handbook", href: "/marietta/frederick/handbook.html", description: "Resident handbook and policies." },
  ],
  missing: [
    "Bathroom layout: one full bath serves the home.",
    "Utility and trash specifics: provider names, pickup days, thermostat, laundry, and parking details live inside Utilities.",
    "Cottage-to-POI mileage: the cottage address is listed on Arrival & map — Nearby gives verified names, areas, and map links; confirm drive time in your maps app.",
  ],
};
