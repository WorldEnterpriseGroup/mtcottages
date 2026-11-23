/**
 * Cost-of-living guide (#58): Parkersburg, Marietta, Ohio and Ravenswood
 * against the US average. Targets the "cost of living parkersburg wv" rows of
 * docs/marketing/keyword-universe.csv, for persona P4 (relocating families and
 * new hires) and P7 (long stays).
 *
 * Every figure comes from _data/area-stats.json, refreshed from its public
 * source files by scripts/area-stats.mjs: BEA Regional Price Parities (price
 * levels, US = 100) and HUD Fair Market Rents. The prose quotes those values
 * through template strings, so nothing is typed by hand. The one constant is
 * the US average itself, which is 100 by BEA's definition. Charts only: no
 * area photo.
 */
import { homes } from "../homes";
import { areaStats, formatDollars, parityArea, rentArea, rentSizes, type ParityArea, type ParityCategory } from "../areaStats";
import { publishedLuxuryFurnishedRates } from "../site";
import type { ChartSpec, GuideArticle } from "./types";

const TOWNS = ["parkersburg", "marietta", "ravenswood"] as const;
const guideHomes = homes.filter((home) => (TOWNS as readonly string[]).includes(home.town.slug));
if (guideHomes.length === 0) throw new Error("mid-ohio-valley-cost-of-living: no homes in the three towns");

const { priceParities, fairMarketRent } = areaStats;
const US_AVERAGE = 100; // A Regional Price Parity is a price level against the US average, which BEA sets to 100.

// Each town and the BEA area its prices are measured in.
const towns: { town: string; area: ParityArea; rentId: string }[] = [
  { town: "Parkersburg, WV", area: parityArea("parkersburg-vienna"), rentId: "parkersburg-vienna" },
  { town: "Marietta, Ohio", area: parityArea("ohio-nonmetro"), rentId: "washington-county-oh" },
  { town: "Ravenswood, WV", area: parityArea("west-virginia-nonmetro"), rentId: "jackson-county-wv" },
];
const [parkersburg, marietta, ravenswood] = towns;

const levelText = (value: number) => value.toFixed(1);
/** "13% below" or "4% above" the US average, rounded to a whole percent. */
const againstUs = (value: number) => {
  const gap = Math.round(value - US_AVERAGE);
  return gap === 0 ? "about the same as" : `${Math.abs(gap)}% ${gap < 0 ? "below" : "above"}`;
};
const dollarsPer100 = (value: number) => formatDollars(Math.round(value));

const parityMethod = `BEA's Regional Price Parities for ${priceParities.year}, released ${priceParities.released}, measure how prices in an area compare with the US average, which is 100: 87 means prices about 13% lower. Parkersburg is measured as the Parkersburg-Vienna metro area. Washington County, Ohio (Marietta) and Jackson County, WV (Ravenswood) are in no metro area, so their nearest BEA figure is the nonmetropolitan part of their state.`;

const overallChart: ChartSpec = {
  id: "price-level",
  title: `Overall prices against the US average, ${priceParities.year}`,
  subtitle: "Regional Price Parity for all items. US average = 100; lower is cheaper.",
  valueHeading: "Price level",
  groups: [{
    label: `All items, ${priceParities.year}`,
    bars: [
      ...towns.map(({ town, area }) => ({ label: town, value: area.index.all, valueText: levelText(area.index.all), note: area.label })),
      { label: "United States average", value: US_AVERAGE, valueText: levelText(US_AVERAGE), note: "The reference level, 100 by definition" },
    ],
  }],
  method: parityMethod,
  sourceLabel: priceParities.source.label,
  sourceUrl: priceParities.source.url,
};

const CATEGORIES: { id: Exclude<ParityCategory, "all">; label: string }[] = [
  { id: "housing", label: "Housing (rents)" },
  { id: "utilities", label: "Utilities" },
  { id: "goods", label: "Goods: groceries, fuel, clothing and more" },
  { id: "other", label: "Other services" },
];
const categoryChart: ChartSpec = {
  id: "price-level-by-category",
  title: "Where the savings are: prices by category",
  subtitle: "Regional Price Parity by category. US average = 100; lower is cheaper.",
  valueHeading: "Price level",
  groups: CATEGORIES.map((category) => ({
    label: category.label,
    bars: towns.map(({ town, area }) => ({ label: town, value: area.index[category.id], valueText: levelText(area.index[category.id]) })),
  })),
  method: `${parityMethod} Housing is rents. Goods covers everything bought as a thing, groceries and fuel included; BEA does not publish groceries or transport as separate figures.`,
  sourceLabel: priceParities.source.label,
  sourceUrl: priceParities.source.url,
};

const rentChart: ChartSpec = {
  id: "fair-market-rent-three-towns",
  title: `What an unfurnished rental costs, FY${fairMarketRent.fiscalYear}`,
  subtitle: "HUD Fair Market Rent per month, rent plus utilities, by bedroom count.",
  valueHeading: "Per month",
  groups: towns.map(({ rentId }) => {
    const area = rentArea(rentId);
    return { label: area.label, bars: area.rents.map((rent, size) => ({ label: rentSizes[size], value: rent, valueText: formatDollars(rent) })) };
  }),
  method: `HUD sets a Fair Market Rent for each area every year: the gross rent (rent plus tenant-paid utilities) of a standard-quality, unfurnished rental, at the 40th percentile of recent movers' rents. These are the FY${fairMarketRent.fiscalYear} figures for the Parkersburg-Vienna metro, Washington County, Ohio and Jackson County, WV. Actual listings vary by street and condition.`,
  sourceLabel: fairMarketRent.source.label,
  sourceUrl: fairMarketRent.source.url,
};

const twoBedroom = (rentId: string) => formatDollars(rentArea(rentId).rents[2]);
const cheapestHousing = [...towns].sort((a, b) => a.area.index.housing - b.area.index.housing)[0];

export const costOfLiving: GuideArticle = {
  slug: "mid-ohio-valley-cost-of-living",
  seoTitle: "Mid-Ohio Valley Cost of Living, in Charts",
  description: "Cost of living in Parkersburg, WV, Marietta, Ohio and Ravenswood, WV: prices, rent and utilities against the US average, from BEA and HUD data.",
  h1: "Cost of living in Parkersburg, Marietta, Ohio and Ravenswood",
  lede: "How far does a paycheck go in the Mid-Ohio Valley? Here are prices in our three towns against the US average, category by category, and what a rental costs, all from official sources. Then a furnished home to live in while you find your own.",
  published: "2026-11-23",
  updated: "2026-11-23",
  towns: [...TOWNS],
  topics: ["moving"],
  audiences: ["relocation", "long-term"],
  homeIds: guideHomes.map((home) => home.id),
  sections: [
    {
      id: "short-answer",
      heading: "The short answer",
      blocks: [
        {
          kind: "list",
          items: [
            ...towns.map(({ town, area }) => `${town}: prices overall are ${againstUs(area.index.all)} the US average (price level ${levelText(area.index.all)}, ${priceParities.year}).`),
            `Housing is where the difference is: rents are ${againstUs(Math.max(...towns.map(({ area }) => area.index.housing)))} to ${againstUs(cheapestHousing.area.index.housing)} the US average, lowest in ${cheapestHousing.town}.`,
            `HUD's Fair Market Rent for an unfurnished two-bedroom is ${twoBedroom(parkersburg.rentId)} a month in the Parkersburg-Vienna metro, ${twoBedroom(marietta.rentId)} in Washington County, Ohio and ${twoBedroom(ravenswood.rentId)} in Jackson County, WV, utilities included (FY${fairMarketRent.fiscalYear}).`,
          ],
        },
      ],
    },
    {
      id: "overall-prices",
      heading: "Overall prices",
      blocks: [
        { kind: "p", text: `The Bureau of Economic Analysis compares prices in every area with the US average. In ${priceParities.year}, ${dollarsPer100(parkersburg.area.index.all)} bought in Parkersburg what $100 bought in an average American town; in Marietta, Ohio it was about ${dollarsPer100(marietta.area.index.all)} and in Ravenswood about ${dollarsPer100(ravenswood.area.index.all)}.` },
        { kind: "chart", chart: overallChart },
      ],
    },
    {
      id: "by-category",
      heading: "Housing, utilities, groceries and the rest",
      blocks: [
        { kind: "p", text: `Nearly all of the difference is housing. Rents in Parkersburg are at ${levelText(parkersburg.area.index.housing)} on BEA's scale, in nonmetro Ohio ${levelText(marietta.area.index.housing)} and in nonmetro West Virginia ${levelText(ravenswood.area.index.housing)}. Utilities are a little under the US average (${levelText(parkersburg.area.index.utilities)} in Parkersburg), and goods, which include groceries and fuel, are close to it (${levelText(parkersburg.area.index.goods)}). Services such as healthcare, insurance and eating out cost about what they cost anywhere (${levelText(parkersburg.area.index.other)}).` },
        { kind: "chart", chart: categoryChart },
        { kind: "p", text: "BEA does not publish groceries or transport on their own. Most people here drive; our commute guide measures the drive from every Mt Cottages home to the largest employers." },
      ],
    },
    {
      id: "rent",
      heading: "What a rental costs",
      blocks: [
        { kind: "p", text: `HUD's Fair Market Rent is the most consistent public yardstick for rent, and it includes utilities. A two-bedroom is ${twoBedroom(parkersburg.rentId)} a month in the Parkersburg-Vienna metro, ${twoBedroom(marietta.rentId)} in Washington County, Ohio and ${twoBedroom(ravenswood.rentId)} in Jackson County, WV.` },
        { kind: "chart", chart: rentChart },
        { kind: "p", text: `A furnished month costs more than a lease: our published guide is ${publishedLuxuryFurnishedRates["1 Bedroom"]} for a one-bedroom and ${publishedLuxuryFurnishedRates["3 Bedrooms"]} for a three-bedroom. For a long stay an unfurnished lease is cheaper. A furnished home is for the months before you sign one: there is no furniture to buy or move, no utilities to set up, and no year-long lease in a town you are still getting to know.` },
      ],
    },
    {
      id: "next-step",
      heading: "Next step",
      blocks: [
        { kind: "cta", heading: "Live here for a month before you commit.", text: "Send your start date and the town you are looking at, and we will tell you which home fits and whether it is free." },
      ],
    },
  ],
  sources: [
    { label: priceParities.source.label, url: priceParities.source.url },
    { label: fairMarketRent.source.label, url: fairMarketRent.source.url },
  ],
};
