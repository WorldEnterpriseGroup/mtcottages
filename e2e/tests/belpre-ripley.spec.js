const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { readFileSync } = require("node:fs");
const path = require("node:path");

// The Belpre, Ohio and Ripley, WV town guides (#56). Drive times must be the
// ones in _data/distances.json and the rent the one in _data/area-stats.json
// (HUD). Neither town has a home of ours, so each guide offers the nearest
// homes and says so.
const read = (file) => JSON.parse(readFileSync(path.join(__dirname, "../../_data", file), "utf8"));
const stats = read("area-stats.json");
const distances = read("distances.json");
const dollars = (value) => `$${value.toLocaleString("en-US")}`;
const rents = (id) => stats.fairMarketRent.areas.find((candidate) => candidate.id === id).rents;
const row = (origin, destination) => {
  const found = distances.rows.find((candidate) => candidate.origin === origin && candidate.destination === destination);
  if (!found) throw new Error(`no distances row ${origin} -> ${destination}`);
  return found;
};

const GUIDES = [
  {
    href: "/guides/belpre-ohio/",
    title: "Belpre, Ohio: Things to Do, Rentals, Drives | Mt Cottages",
    h1: "Belpre, Ohio: things to do, rentals and our nearest homes",
    rentArea: "washington-county-oh",
    chart: "belpre-drives",
    destination: "belpre-centre",
    nearest: { origin: "broad", name: "Broad Cottage" },
    townCentre: { origin: "parkersburg-centre", name: "Buck Cottage (from the Parkersburg centre)" },
    places: ["Mid-Ohio Railroad Museum", "Belpre Branch Library"],
    homes: ["/parkersburg/broad-cottage/", "/parkersburg/oak-cottage/"],
    notOffered: "/ravenswood/henrietta-cottage/",
  },
  {
    href: "/guides/ripley-wv/",
    title: "Ripley, WV: Jackson General, Rentals, Drives | Mt Cottages",
    h1: "Ripley, West Virginia: the hospital, rentals and our nearest homes",
    rentArea: "jackson-county-wv",
    chart: "ripley-drives",
    destination: "ripley-centre",
    nearest: { origin: "henrietta", name: "Henrietta Cottage" },
    townCentre: { origin: "ravenswood-centre", name: "Virginia Cottage (from the Ravenswood centre)" },
    places: ["Jackson General Hospital", "Jackson County Courthouse"],
    homes: ["/ravenswood/henrietta-cottage/", "/ravenswood/virginia-cottage/"],
    notOffered: "/parkersburg/broad-cottage/",
  },
];

for (const guide of GUIDES) {
  test(`${guide.href} quotes its drives and rent from the data files`, async ({ page }) => {
    await page.goto(guide.href);
    await expect(page).toHaveTitle(guide.title);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.h1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://mtcottages.com${guide.href}`);

    const nearest = row(guide.nearest.origin, guide.destination);
    const short = page.locator("#short-answer");
    await expect(short).toContainText(`${guide.nearest.name}, our nearest home with a published address, is about ${nearest.minutes} minutes`);
    await expect(short).toContainText(dollars(rents(guide.rentArea)[2]));

    const drives = page.locator(`[data-guide-chart="${guide.chart}"] svg g[data-chart-group]`).first();
    await expect(drives.locator(`[data-chart-bar="${guide.nearest.name}"] .gc-value`)).toHaveText(`${nearest.minutes} min`);
    await expect(drives.locator(`[data-chart-bar="${guide.townCentre.name}"] .gc-value`)).toHaveText(`${row(guide.townCentre.origin, guide.destination).minutes} min`);

    for (const name of guide.places) await expect(page.locator(`[data-place="${name}"] a`)).toHaveAttribute("href", /^https:\/\/www\.openstreetmap\.org\//);
    await expect(page.locator(`.garticle a[href="${stats.fairMarketRent.source.url}"]`).first()).toBeAttached();

    const cta = page.locator("[data-guide-cta]");
    await expect(cta.getByRole("link", { name: /Check dates/ })).toHaveAttribute("href", /audience=/);
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
