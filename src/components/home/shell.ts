import type { Residence } from "../../data/residences";
import type { HomeMicrosite } from "../../data/homes/types";
import { homeBase, homeHref, inquiryUrl } from "../../data/homes/links";
import { residenceHref } from "../../data/residences";

export type HomeNavItem = { label: string; href: string; description: string };

/** What the shared shell (nav, hero, switcher, inquiry panel) needs to know about any home. */
export type HomeShell = {
  id: string;
  name: string;
  townName: string;
  townHref: string;
  baseHref: string;
  brandSub: string;
  nav: HomeNavItem[];
  inquiryUrl: string;
};

export const residenceShell = (residence: Residence): HomeShell => ({
  id: residence.id,
  name: residence.name,
  townName: residence.town.split(",")[0].trim(),
  townHref: "/marietta/index.html",
  baseHref: residenceHref(residence, "index"),
  brandSub: `${residence.town} · Research Residence`,
  nav: residence.nav,
  inquiryUrl: inquiryUrl(residence.id),
});

export const homeShell = (home: HomeMicrosite): HomeShell => ({
  id: home.id,
  name: home.name,
  townName: home.town.name,
  townHref: `/${home.town.slug}/index.html`,
  baseHref: homeBase(home),
  brandSub: `${home.town.name}, ${home.town.state} · Furnished home`,
  nav: [
    { label: "Overview", href: homeHref(home), description: "Facts, highlights and rooms at a glance." },
    { label: "Tour", href: homeHref(home, "tour"), description: "Room-by-room photo story." },
    { label: "Plan & 3D", href: homeHref(home, "plan"), description: "Concept floor plan and 3D model." },
    { label: "Amenities", href: homeHref(home, "amenities"), description: "What is listed, photographed or still to confirm." },
    { label: "Location", href: homeHref(home, "location"), description: "Address, directions and nearby places." },
  ],
  inquiryUrl: inquiryUrl(home.id),
});
