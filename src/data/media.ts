import type { ImageMetadata } from "astro";

import mariettaExterior from "../assets/media/marietta-01/exterior.avif";
import mariettaKitchen from "../assets/media/marietta-01/gallery-01.avif";
import mariettaBedroom from "../assets/media/marietta-01/photo-25.avif";
import mariettaDining from "../assets/media/marietta-01/photo-27.avif";
import mariettaPrimary from "../assets/media/marietta-01/photo-36.avif";
import mariettaLiving from "../assets/media/marietta-01/photo-39.avif";
import broadHero from "../assets/media/parkersburg-01/photo-44.avif";
import broadLiving from "../assets/media/parkersburg-01/photo-06.avif";
import broadLoft from "../assets/media/parkersburg-01/photo-01.avif";
import broadBedroom from "../assets/media/parkersburg-01/photo-49.avif";
import broadBath from "../assets/media/parkersburg-01/photo-20.avif";
import broadVanity from "../assets/media/parkersburg-01/photo-12.avif";
import buckHero from "../assets/media/parkersburg-02/photo-09.avif";
import buckExterior from "../assets/media/parkersburg-02/photo-23.avif";
import buckLiving from "../assets/media/parkersburg-02/photo-49.avif";
import buckLivingAlt from "../assets/media/parkersburg-02/photo-50.avif";
import buckBedroom from "../assets/media/parkersburg-02/photo-38.avif";
import buckBath from "../assets/media/parkersburg-02/photo-41.avif";
import yellowHero from "../assets/media/parkersburg-03/photo-145.avif";
import yellowExterior from "../assets/media/parkersburg-03/photo-07.avif";
import yellowKitchen from "../assets/media/parkersburg-03/photo-448.avif";
import yellowBath from "../assets/media/parkersburg-03/photo-468.avif";
import oakHero from "../assets/media/parkersburg-04/photo-23.avif";
import oakKitchen from "../assets/media/parkersburg-04/photo-08.avif";
import oakDining from "../assets/media/parkersburg-04/photo-35.avif";
import oakBedroom from "../assets/media/parkersburg-04/photo-07.avif";
import oakBedroomAlt from "../assets/media/parkersburg-04/photo-11.avif";
import oakPorch from "../assets/media/parkersburg-04/photo-05.avif";
import oakBath from "../assets/media/parkersburg-04/photo-40.avif";
import whiteHero from "../assets/media/ravenswood-01/photo-01.avif";
import whitePorch from "../assets/media/ravenswood-01/photo-03.avif";
import whiteBedroom from "../assets/media/ravenswood-01/photo-108.avif";
import whiteLiving from "../assets/media/ravenswood-01/photo-125.avif";
import whiteKitchen from "../assets/media/ravenswood-01/photo-165.avif";
import whiteBath from "../assets/media/ravenswood-01/photo-263.avif";
import virginiaHero from "../assets/media/ravenswood-02/photo-117.avif";
import virginiaLiving from "../assets/media/ravenswood-02/photo-54.avif";
import virginiaBedroom from "../assets/media/ravenswood-02/photo-53.avif";
import virginiaKitchen from "../assets/media/ravenswood-02/photo-55.avif";
import virginiaDining from "../assets/media/ravenswood-02/photo-77.avif";
import virginiaBath from "../assets/media/ravenswood-02/photo-116.avif";
import henriettaHero from "../assets/media/ravenswood-03/photo-17.avif";
import henriettaDining from "../assets/media/ravenswood-03/photo-06.avif";
import henriettaLiving from "../assets/media/ravenswood-03/photo-31.avif";
import henriettaBedroom from "../assets/media/ravenswood-03/photo-42.avif";
import henriettaKitchen from "../assets/media/ravenswood-03/photo-40.avif";
import henriettaBath from "../assets/media/ravenswood-03/photo-36.avif";

export type MediaItem = {
  src: ImageMetadata;
  alt: string;
  room: string;
  featured?: boolean;
};

const item = (src: ImageMetadata, alt: string, room: string, featured = false): MediaItem => ({
  src,
  alt,
  room,
  featured,
});

export const media: Record<string, MediaItem[]> = {
  "marietta-01": [
    item(mariettaExterior, "Frederick Cottage exterior", "Exterior", true),
    item(mariettaKitchen, "Frederick Cottage kitchen", "Kitchen"),
    item(mariettaLiving, "Frederick Cottage sitting room", "Living room"),
    item(mariettaPrimary, "Frederick Cottage primary bedroom", "Bedroom"),
    item(mariettaBedroom, "Frederick Cottage second bedroom", "Bedroom"),
    item(mariettaDining, "Frederick Cottage dining and entry area", "Dining"),
  ],
  "parkersburg-01": [
    item(broadHero, "Broad Cottage living room", "Living room", true),
    item(broadLiving, "Broad Cottage living room, alternate view", "Living room"),
    item(broadLoft, "Broad Cottage loft bedroom", "Bedroom"),
    item(broadBedroom, "Broad Cottage bedroom", "Bedroom"),
    item(broadBath, "Broad Cottage tiled bathroom", "Bathroom"),
    item(broadVanity, "Broad Cottage bathroom vanity", "Bathroom"),
  ],
  "parkersburg-02": [
    item(buckHero, "Buck Cottage exterior in autumn", "Exterior", true),
    item(buckExterior, "Buck Cottage front exterior", "Exterior"),
    item(buckLiving, "Buck Cottage living room", "Living room"),
    item(buckLivingAlt, "Buck Cottage living room, alternate view", "Living room"),
    item(buckBedroom, "Buck Cottage bedroom", "Bedroom"),
    item(buckBath, "Buck Cottage bathroom", "Bathroom"),
  ],
  "parkersburg-03": [
    item(yellowHero, "Yellow Cottage facade", "Exterior", true),
    item(yellowExterior, "Yellow Cottage exterior", "Exterior"),
    item(yellowKitchen, "Yellow Cottage kitchen", "Kitchen"),
    item(yellowBath, "Yellow Cottage bathroom", "Bathroom"),
  ],
  "parkersburg-04": [
    item(oakHero, "Oak Cottage dining room", "Dining", true),
    item(oakKitchen, "Oak Cottage kitchen", "Kitchen"),
    item(oakDining, "Oak Cottage dining room, alternate view", "Dining"),
    item(oakBedroom, "Oak Cottage bedroom", "Bedroom"),
    item(oakBedroomAlt, "Oak Cottage third bedroom", "Bedroom"),
    item(oakPorch, "Oak Cottage covered porch", "Exterior"),
    item(oakBath, "Oak Cottage bathroom", "Bathroom"),
  ],
  "ravenswood-01": [
    item(whiteHero, "White Cottage facade", "Exterior", true),
    item(whitePorch, "White Cottage porch", "Exterior"),
    item(whiteBedroom, "White Cottage bedroom", "Bedroom"),
    item(whiteLiving, "White Cottage living room", "Living room"),
    item(whiteKitchen, "White Cottage kitchen", "Kitchen"),
    item(whiteBath, "White Cottage bathroom", "Bathroom"),
  ],
  "ravenswood-02": [
    item(virginiaHero, "Virginia Cottage interior", "Living room", true),
    item(virginiaLiving, "Virginia Cottage living room", "Living room"),
    item(virginiaBedroom, "Virginia Cottage bedroom", "Bedroom"),
    item(virginiaKitchen, "Virginia Cottage kitchen", "Kitchen"),
    item(virginiaDining, "Virginia Cottage dining room", "Dining"),
    item(virginiaBath, "Virginia Cottage bathroom", "Bathroom"),
  ],
  "ravenswood-03": [
    item(henriettaHero, "Henrietta Cottage dining room", "Dining", true),
    item(henriettaDining, "Henrietta Cottage dining room, alternate view", "Dining"),
    item(henriettaLiving, "Henrietta Cottage living room", "Living room"),
    item(henriettaBedroom, "Henrietta Cottage bedroom", "Bedroom"),
    item(henriettaKitchen, "Henrietta Cottage kitchen", "Kitchen"),
    item(henriettaBath, "Henrietta Cottage bathroom", "Bathroom"),
  ],
};

export function getMedia(id: string): MediaItem[] {
  return media[id] ?? [];
}
