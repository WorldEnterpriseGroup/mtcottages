const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { readFileSync } = require("node:fs");
const path = require("node:path");

// The Mid-Ohio Valley cost-of-living guide (#58). Every figure on the page must
// be the one in _data/area-stats.json: BEA Regional Price Parities and HUD Fair
// Market Rents, each with its source linked. The call to action is for relocation.
const GUIDE = "/guides/mid-ohio-valley-cost-of-living/";
const stats = JSON.parse(readFileSync(path.join(__dirname, "../../_data/area-stats.json"), "utf8"));
const parity = (id) => stats.priceParities.areas.find((candidate) => candidate.id === id).index;
const rents = (id) => stats.fairMarketRent.areas.find((candidate) => candidate.id === id).rents;
const dollars = (value) => `$${value.toLocaleString("en-US")}`;
const level = (value) => value.toFixed(1);

test("the cost-of-living guide quotes BEA and HUD figures from its data file", async ({ page }) => {
  await page.goto(GUIDE);
  await expect(page).toHaveTitle("Mid-Ohio Valley Cost of Living, in Charts | Mt Cottages");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cost of living in Parkersburg, Marietta, Ohio and Ravenswood");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://mtcottages.com${GUIDE}`);

  const short = page.locator("#short-answer");
  await expect(short).toContainText(`price level ${level(parity("parkersburg-vienna").all)}, ${stats.priceParities.year}`);
  await expect(short).toContainText(`${dollars(rents("jackson-county-wv")[2])} in Jackson County, WV`);

  const overall = page.locator('[data-guide-chart="price-level"]');
  await expect(overall.locator('[data-chart-bar="Parkersburg, WV"] .gc-value')).toHaveText(level(parity("parkersburg-vienna").all));
  await expect(overall.locator('[data-chart-bar="Marietta, Ohio"] .gc-value')).toHaveText(level(parity("ohio-nonmetro").all));
  await expect(overall.locator('[data-chart-bar="Ravenswood, WV"] .gc-value')).toHaveText(level(parity("west-virginia-nonmetro").all));
  await expect(overall.locator('[data-chart-bar="United States average"] .gc-value')).toHaveText("100.0");

  const categories = page.locator('[data-guide-chart="price-level-by-category"]');
  const housing = categories.locator("svg g[data-chart-group]").filter({ hasText: "Housing (rents)" });
  await expect(housing.locator('[data-chart-bar="Ravenswood, WV"] .gc-value')).toHaveText(level(parity("west-virginia-nonmetro").housing));
  await expect(categories.locator("svg [data-chart-bar]")).toHaveCount(4 * 3);

  const rent = page.locator('[data-guide-chart="fair-market-rent-three-towns"]');
  await rent.getByText("Show the figures as a table").click();
  for (const id of ["parkersburg-vienna", "washington-county-oh", "jackson-county-wv"]) {
    await expect(rent.locator(".gc-table")).toContainText(dollars(rents(id)[3]));
  }

  for (const source of [stats.priceParities.source.url, stats.fairMarketRent.source.url]) {
    await expect(page.locator(`.garticle a[href="${source}"]`).first()).toBeAttached();
  }
  const cta = page.locator("[data-guide-cta]");
  await expect(cta).toContainText("Live here for a month before you commit.");
  await expect(cta.getByRole("link", { name: /Check dates/ })).toHaveAttribute("href", /audience=relocation/);
  await expect(page.locator(".garticle img")).toHaveCount(0);
});

test("the cost-of-living guide is linked from the guides index, the homes in its towns and the sitemap", async ({ page, request }) => {
  await page.goto("/guides/");
  await expect(page.locator(`[data-guide-list] a[href="${GUIDE}"]`)).toBeVisible();
  for (const home of ["/parkersburg/broad-cottage/", "/marietta/frederick/"]) {
    await page.goto(home);
    await expect(page.locator(`[data-related] a[href="${GUIDE}"]`)).toBeVisible();
  }
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain(`https://mtcottages.com${GUIDE}`);
});

test("the cost-of-living guide has no WCAG A/AA violations", async ({ page }) => {
  await page.goto(GUIDE);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
});
