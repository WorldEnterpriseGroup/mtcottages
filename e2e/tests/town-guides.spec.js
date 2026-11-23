const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { readFileSync } = require("node:fs");
const path = require("node:path");

// The Vienna and Williamstown, WV town guides (#55). Every figure must be the
// one in its data file: population and Fair Market Rents from
// _data/area-stats.json (Census Bureau and HUD), drive times from
// _data/distances.json. Neither town has a home of ours, so each guide offers
// the nearest homes and says so.
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

const GUIDES = [
  {
    href: "/guides/vienna-wv/",
    title: "Renting in Vienna, WV: Costs, Drives, Homes | Mt Cottages",
    h1: "Renting in Vienna, West Virginia",
    town: "vienna",
    chart: "vienna-drives",
    nearest: { origin: "broad", name: "Broad Cottage" },
    homes: ["/parkersburg/broad-cottage/", "/parkersburg/oak-cottage/"],
    notOffered: "/marietta/frederick/",
  },
  {
    href: "/guides/williamstown-wv/",
    title: "Renting near Williamstown, WV: Costs, Drives | Mt Cottages",
    h1: "Renting near Williamstown, West Virginia",
    town: "williamstown",
    chart: "williamstown-drives",
    nearest: { origin: "frederick", name: "Frederick Cottage" },
    homes: ["/marietta/frederick/", "/parkersburg/broad-cottage/"],
    notOffered: "/ravenswood/henrietta-cottage/",
  },
];

for (const guide of GUIDES) {
  test(`${guide.href} quotes its figures from the data files`, async ({ page }) => {
    await page.goto(guide.href);
    await expect(page).toHaveTitle(guide.title);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.h1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://mtcottages.com${guide.href}`);

    const short = page.locator("#short-answer");
    await expect(short).toContainText(`${count(place(guide.town).estimate)} people live in the city of`);
    await expect(short).toContainText(dollars(rents("parkersburg-vienna")[2]));
    const nearest = row(guide.nearest.origin, `${guide.town}-centre`);
    await expect(short).toContainText(`${guide.nearest.name}`);
    await expect(short).toContainText(`about ${nearest.minutes} minutes`);

    const drives = page.locator(`[data-guide-chart="${guide.chart}"]`);
    await expect(drives.locator(`[data-chart-bar="${guide.nearest.name}"] .gc-value`)).toHaveText(`${nearest.minutes} min`);

    for (const source of [stats.population.source.url, stats.fairMarketRent.source.url]) {
      await expect(page.locator(`.garticle a[href="${source}"]`).first()).toBeAttached();
    }
    const cta = page.locator("[data-guide-cta]");
    await expect(cta.getByRole("link", { name: /Check dates/ })).toHaveAttribute("href", /audience=relocation/);
    for (const home of guide.homes) await expect(cta.locator(`a[href="${home}"]`)).toBeAttached();
    await expect(cta.locator(`a[href="${guide.notOffered}"]`)).toHaveCount(0);
    // Charts only: no area photo.
    await expect(page.locator(".garticle-figure")).toHaveCount(0);
  });

  test(`${guide.href} is linked from the guides index, its homes and the sitemap`, async ({ page, request }) => {
    await page.goto("/guides/");
    await expect(page.locator(`[data-guide-list] a[href="${guide.href}"]`)).toBeVisible();
    for (const home of guide.homes) {
      await page.goto(home);
      await expect(page.locator(`[data-related] a[href="${guide.href}"]`)).toBeVisible();
    }
    const sitemap = await request.get("/sitemap.xml");
    expect(await sitemap.text()).toContain(`https://mtcottages.com${guide.href}`);
  });

  test(`${guide.href} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(guide.href);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
  });
}
