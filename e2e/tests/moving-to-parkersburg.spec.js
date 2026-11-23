const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { readFileSync } = require("node:fs");
const path = require("node:path");

// The "Moving to Parkersburg, WV" guide (#48). Every figure on the page must be
// the one in its data file: population and Fair Market Rents from
// _data/area-stats.json (Census Bureau and HUD), employers from the same file,
// drive times from _data/distances.json. The call to action is for relocation.
const GUIDE = "/guides/moving-to-parkersburg-wv/";
const read = (file) => JSON.parse(readFileSync(path.join(__dirname, "../../_data", file), "utf8"));
const stats = read("area-stats.json");
const distances = read("distances.json");
const count = (value) => value.toLocaleString("en-US");
const dollars = (value) => `$${value.toLocaleString("en-US")}`;
const place = (id) => stats.population.places.find((candidate) => candidate.id === id);
const rents = (id) => stats.fairMarketRent.areas.find((candidate) => candidate.id === id).rents;
const row = (origin, destination) => {
  const found = distances.rows.find((candidate) => candidate.origin === origin && candidate.destination === destination);
  if (!found) throw new Error(`no distances row ${origin} -> ${destination}`);
  return found;
};

test("the Parkersburg guide quotes the official figures from its data file", async ({ page }) => {
  await page.goto(GUIDE);
  await expect(page).toHaveTitle("Moving to Parkersburg, WV: Jobs, Rent, Commute | Mt Cottages");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Moving to Parkersburg, West Virginia");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://mtcottages.com${GUIDE}`);

  const short = page.locator("#short-answer");
  await expect(short).toContainText(`${count(place("parkersburg").estimate)} people live in the city of Parkersburg`);
  await expect(short).toContainText(`${count(place("wood-county").estimate)} in Wood County`);
  await expect(short).toContainText(`${dollars(rents("parkersburg-vienna")[2])} a month`);

  const population = page.locator('[data-guide-chart="population"]');
  await expect(population.locator('[data-chart-bar="Parkersburg (city)"] .gc-value')).toHaveText(count(place("parkersburg").estimate));

  const employers = page.locator('[data-guide-chart="employers"]');
  const top = stats.employers.list[0];
  await expect(employers.locator(`[data-chart-bar="${top.name}"] .gc-value`)).toHaveText(count(top.employees));
  await expect(employers.locator("svg [data-chart-bar]")).toHaveCount(stats.employers.list.length);

  const rent = page.locator('[data-guide-chart="fair-market-rent"]');
  await rent.getByText("Show the figures as a table").click();
  await expect(rent.locator(".gc-table")).toContainText(dollars(rents("parkersburg-vienna")[3]));
  await expect(rent.locator(".gc-table")).toContainText(dollars(rents("washington-county-oh")[3]));

  const drives = page.locator('[data-guide-chart="parkersburg-drives"]');
  const camden = drives.locator("svg g[data-chart-group]").filter({ hasText: "Camden Clark" });
  await expect(camden.locator('[data-chart-bar="Broad Cottage"] .gc-value')).toHaveText(`${row("broad", "camden-clark").minutes} min`);

  // Every source is linked, and the call to action is for relocating guests.
  for (const source of [stats.population.source.url, stats.fairMarketRent.source.url, stats.employers.source.url]) {
    await expect(page.locator(`.garticle a[href="${source}"]`).first()).toBeAttached();
  }
  const cta = page.locator("[data-guide-cta]");
  await expect(cta).toContainText("Stay in a furnished home while you find yours.");
  await expect(cta.getByRole("link", { name: /Check dates/ })).toHaveAttribute("href", /audience=relocation/);
  await expect(cta.getByRole("link", { name: "Broad Cottage, Parkersburg, WV" })).toHaveAttribute("href", "/parkersburg/broad-cottage/");
  // Charts only: no area photo. (The homes the guide offers show their own portfolio photos.)
  await expect(page.locator(".garticle-figure")).toHaveCount(0);
});

test("the Parkersburg guide is linked from the guides index, the Parkersburg homes and the sitemap", async ({ page, request }) => {
  await page.goto("/guides/");
  await expect(page.locator(`[data-guide-list] a[href="${GUIDE}"]`)).toBeVisible();
  for (const home of ["/parkersburg/broad-cottage/", "/parkersburg/oak-cottage/"]) {
    await page.goto(home);
    await expect(page.locator(`[data-related] a[href="${GUIDE}"]`)).toBeVisible();
  }
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain(`https://mtcottages.com${GUIDE}`);
});

test("the Parkersburg guide has no WCAG A/AA violations", async ({ page }) => {
  await page.goto(GUIDE);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
});
