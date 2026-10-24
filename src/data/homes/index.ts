import type { ImageMetadata } from "astro";
import { frederick } from "../residences/frederick";
import { henriettaHome } from "./henrietta";
import { oakHome } from "./oak";
import { broadHome } from "./broad";
import type { HomeMicrosite } from "./types";

/** The three data-driven microsites. Frederick keeps its hand-authored pages. */
export const homes: HomeMicrosite[] = [henriettaHome, oakHome, broadHome];

export type FamilyMember = {
  id: string;
  name: string;
  town: string;
  href: string;
  hero: { src: ImageMetadata; alt: string; focal?: string };
  bedrooms: number;
};

/** Every home in the Mt Cottages microsite family, for the switcher. */
export const family: FamilyMember[] = [
  {
    id: frederick.id,
    name: frederick.name,
    town: frederick.town,
    href: `/${frederick.basePath}/index.html`,
    hero: frederick.hero,
    bedrooms: Number.parseInt(frederick.bedrooms, 10),
  },
  ...homes.map((home) => ({
    id: home.id,
    name: home.name,
    town: `${home.town.name}, ${home.town.state}`,
    href: `/${home.town.slug}/${home.slug}/`,
    hero: home.hero,
    bedrooms: home.bedrooms,
  })),
];
