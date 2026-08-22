import type { ImageMetadata } from "astro";

export type MicrositeImage = {
  id?: string;
  src: ImageMetadata;
  alt: string;
  caption?: string;
  category?: string;
  categoryLabel?: string;
  focal?: string;
  credit?: string;
};

export type MicrositeAction = {
  label: string;
  href: string;
  external?: boolean;
};

export type PropertyNavItem = {
  label: string;
  href: string;
  current?: boolean;
};

export type SummaryFact = {
  label: string;
  value: string;
  detail?: string;
};

export type VerificationStatus = "verified" | "reported" | "confirm" | "unavailable";

export type VerificationBadge = {
  label: string;
  detail?: string;
  status?: VerificationStatus;
  statusLabel?: string;
};

export type AmenityItem = {
  label: string;
  detail?: string;
  icon?: string;
};

export type InventoryStatus = "included" | "confirm" | "unavailable";

export type InventoryItem = {
  label: string;
  detail?: string;
  status?: InventoryStatus;
  statusLabel?: string;
};

export type InventoryGroup = {
  title: string;
  items: InventoryItem[];
};

export type NearbyPlace = {
  id?: string;
  name: string;
  type: string;
  distance?: string;
  detail?: string;
  href?: string;
  external?: boolean;
  image?: MicrositeImage;
};

export type RoomCardData = {
  id?: string;
  name: string;
  href?: string;
  description?: string;
  image?: MicrositeImage;
  facts?: SummaryFact[];
  features?: string[];
};
