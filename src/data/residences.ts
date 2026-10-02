import type { ImageMetadata } from "astro";

export type ResidencePhoto = {
  src: ImageMetadata;
  alt: string;
  caption?: string;
  focal?: string;
};

export type ResidenceNavItem = {
  label: string;
  href: string;
  description: string;
};

export type ResidenceSection = {
  title: string;
  body: string;
  bullets?: string[];
};

export type Residence = {
  id: string;
  name: string;
  town: string;
  tagline: string;
  summary: string;
  price: string;
  bedrooms: string;
  basePath: string;
  listingPath: string;
  hero: ResidencePhoto;
  nav: ResidenceNavItem[];
  facts: { label: string; value: string }[];
  missing: string[];
};

export const residenceHref = (residence: Residence, slug: string) =>
  slug === "index" ? `/${residence.basePath}/index.html` : `/${residence.basePath}/${slug}.html`;
