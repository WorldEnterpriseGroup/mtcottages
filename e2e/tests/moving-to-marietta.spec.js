const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { readFileSync } = require("node:fs");
const path = require("node:path");

// The "Moving to Marietta, Ohio" guide (#49). Every figure on the page must be
// the one in its data file: population and Fair Market Rents from
// _data/area-stats.json (Census Bureau and HUD), drive and walk times from
// _data/distances.json. The call to action is for relocation.
const GUIDE = "/guides/moving-to-marietta-ohio/";
const read = (file) => JSON.parse(readFileSync(path.join(__dirname, "../../_data", file), "utf8"));
const stats = read("area-stats.json");
const distances = read("distances.json");
const count = (value) => value.toLocaleString("en-US");
const dollars = (value) => `$${value.toLocaleString("en-US")}`;
const place = (id) => stats.population.places.find((candidate) => candidate.id === id);
const rents = (id) => stats.fairMarketRent.areas.find((candidate) => candidate.id === id).rents;
const route = (list, destination) => {
  const found = distances[list].find((candidate) => candidate.origin === "frederick" && candidate.destination === destination);
  if (!found) throw new Error(`no ${list} row frederick -> ${destination}`);
  return found;
};

test("the Marietta guide quotes the official figures from its data files", async ({ page }) => {
  await page.goto(GUIDE);
  await expect(page).toHaveTitle("Moving to Marietta, Ohio: Rent and Commutes | Mt Cottages");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Moving to Marietta, Ohio");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://mtcottages.com${GUIDE}`);

  const short = page.locator("#short-answer");
  await expect(short).toContainText(`${count(place("marietta").estimate)} people live in the city of Marietta`);
  await expect(short).toContainText(`${count(place("washington-county-oh").estimate)} in Washington County, Ohio`);
  await expect(short).toContainText(`${dollars(rents("washington-county-oh")[2])} a month`);

  const population = page.locator('[data-guide-chart="marietta-population"]');
  await expect(population.locator('[data-chart-bar="Marietta (city)"] .gc-value')).toHaveText(count(place("marietta").estimate));

  const rent = page.locator('[data-guide-chart="marietta-fair-market-rent"]');
  await rent.getByText("Show the figures as a table").click();
  await expect(rent.locator(".gc-table")).toContainText(dollars(rents("washington-county-oh")[3]));
  await expect(rent.locator(".gc-table")).toContainText(dollars(rents("parkersburg-vienna")[3]));

  const drives = page.locator('[data-guide-chart="frederick-drives"]');
  await expect(drives.locator('[data-chart-bar="Marietta Memorial Hospital"] .gc-value')).toHaveText(`${route("rows", "marietta-memorial").minutes} min`);
  await expect(drives.locator("svg [data-chart-bar]")).toHaveCount(10);
  const walks = page.locator('[data-guide-chart="frederick-walks"]');
  await expect(walks.locator('[data-chart-bar="Marietta College"] .gc-value')).toHaveText(`${route("walks", "marietta-college").minutes} min`);

  // Schools and healthcare link to their official sites; every data source is linked.
  for (const source of [stats.population.source.url, stats.fairMarketRent.source.url, "https://www.mariettacityschools.k12.oh.us/", "https://www.mhsystem.org/"]) {
    await expect(page.locator(`.garticle a[href="${source}"]`).first()).toBeAttached();
  }
  const cta = page.locator("[data-guide-cta]");
  await expect(cta).toContainText("Stay in Marietta, Ohio while you find your own home.");
  await expect(cta.getByRole("link", { name: /Check dates/ })).toHaveAttribute("href", /audience=relocation/);
  // Charts only: no area photo. (The homes the guide offers show their own portfolio photos.)
  await expect(page.locator(".garticle-figure")).toHaveCount(0);
});

test("the Marietta guide is linked from the guides index, Frederick Cottage and the sitemap", async ({ page, request }) => {
  await page.goto("/guides/");
  await expect(page.locator(`[data-guide-list] a[href="${GUIDE}"]`)).toBeVisible();
  await page.goto("/marietta/frederick/");
  await expect(page.locator(`[data-related] a[href="${GUIDE}"]`)).toBeVisible();
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain(`https://mtcottages.com${GUIDE}`);
});

test("the Marietta guide has no WCAG A/AA violations", async ({ page }) => {
  await page.goto(GUIDE);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
});
