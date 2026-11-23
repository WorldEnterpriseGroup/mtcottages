// Jackson General Hospital landing (#45): /travel-nurses/jackson-general/, the Ripley child of the
// travel-nurse hub (#29). Checks the search targeting, that every minute printed is the measured one
// from _data/distances.json (Virginia Cottage from the Ravenswood town centre, labelled so), that the
// page says the hospital is in Ripley, the prefilled inquiry (never submitted), related-page links in
// both directions, the FAQPage schema and accessibility.
const fs = require("node:fs");
const path = require("node:path");
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const PAGE = "/travel-nurses/jackson-general/";
const ORIGIN = "https://mtcottages.com";
const STAY = "https://stay.mtcottages.com/";

const distances = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "_data", "distances.json"), "utf8"));
const measured = (origin, destination) => {
  const row = distances.rows.find((entry) => entry.origin === origin && entry.destination === destination);
  if (!row) throw new Error(`_data/distances.json has no ${origin} to ${destination} row`);
  return row;
};
const HOMES = [
  { id: "henrietta", origin: distances.microsites.henrietta, href: "/ravenswood/henrietta-cottage/", from: "Henrietta Cottage, from its street address" },
  { id: "virginia", origin: distances.microsites.virginia, href: "/ravenswood/virginia-cottage/", from: "Virginia Cottage, from the Ravenswood town centre" },
];
const nearest = [...HOMES].sort((a, b) => measured(a.origin, "jackson-general").minutes - measured(b.origin, "jackson-general").minutes || a.id.localeCompare(b.id))[0];

test.describe("Jackson General landing /travel-nurses/jackson-general/", () => {
  test("targets Jackson General and Ripley searches and is in the sitemap", async ({ page, request }) => {
    const response = await page.goto(PAGE);
    expect(response.ok()).toBeTruthy();
    const title = await page.title();
    expect(title.length, `title "${title}" is longer than 60 characters`).toBeLessThanOrEqual(60);
    expect(title).toMatch(/Jackson General/);
    expect(title).toMatch(/Ripley/);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description.length).toBeGreaterThan(70);
    expect(description.length).toBeLessThanOrEqual(160);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Jackson General Hospital in Ripley, WV");
    await expect(page.locator('[data-testid="jg-lede"]')).toContainText("Ravenswood");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect([`${ORIGIN}${PAGE}`, `${ORIGIN}${PAGE}index.html`]).toContain(canonical);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap, "the page is in the sitemap under its canonical").toContain(`<loc>${canonical}</loc>`);
  });

  test("prints the measured drive from each Ravenswood home and says the hospital is in Ripley", async ({ page }) => {
    await page.goto(PAGE);
    for (const home of HOMES) {
      const row = measured(home.origin, "jackson-general");
      const card = page.locator(`#drives [data-home="${home.id}"]`);
      await expect(card.locator('[data-testid="drive-minutes"]')).toHaveText(`${row.minutes} min`);
      await expect(card).toContainText(home.from);
      await expect(card).toContainText(`${row.miles.toFixed(1)} mi`);
    }
    await expect(page.locator("#drives")).toContainText("The hospital is in Ripley, not Ravenswood");
    for (const place of ["foodfair-ravenswood", "riverfront-park-ravenswood", "i77-ravenswood"]) {
      for (const home of HOMES) {
        await expect(page.locator(`[data-testid="area-table"] tr[data-place="${place}"] td[data-home="${home.id}"] strong`)).toHaveText(`${measured(home.origin, place).minutes} min`);
      }
    }
    await expect(page.locator('[data-testid="disclaimer"]')).toContainText("not affiliated with");
  });

  test("the inquiry pre-selects the nearest home and the healthcare audience", async ({ page }) => {
    await page.goto(PAGE);
    const href = await page.locator('[data-cta="hero"] a.button').first().getAttribute("href");
    const url = new URL(href);
    expect(`${url.origin}/`).toBe(STAY);
    expect(url.searchParams.get("property")).toBe(nearest.id);
    expect(url.searchParams.get("audience")).toBe("healthcare");
    for (const home of HOMES) await expect(page.locator(`#homes [data-cta="home-${home.id}"]`)).toHaveAttribute("href", new RegExp(`property=${home.id}`));
  });

  test("is linked from the travel-nurse hub and both Ravenswood homes, and links back", async ({ page }) => {
    await page.goto("/travel-nurses/");
    await expect(page.locator('#hospitals [data-hospital="jackson-general"] a[data-hospital-guide]')).toHaveAttribute("href", PAGE);
    for (const home of HOMES) {
      await page.goto(home.href);
      await expect(page.locator(`[data-related] a[href="${PAGE}"]`)).toBeVisible();
    }
    await page.goto(PAGE);
    for (const home of HOMES) await expect(page.locator(`#drives a[href="${home.href}"]`)).toBeAttached();
    await expect(page.locator('a[href="/travel-nurses/"]').first()).toBeAttached();
  });

  test("publishes FAQPage structured data matching the visible questions", async ({ page }) => {
    await page.goto(PAGE);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const nodes = blocks.flatMap((block) => { const parsed = JSON.parse(block); return Array.isArray(parsed) ? parsed : [parsed]; });
    const faq = nodes.find((node) => node["@type"] === "FAQPage");
    expect(faq, "the page publishes a FAQPage").toBeTruthy();
    const visible = await page.locator("#faq summary").allTextContents();
    expect(faq.mainEntity.map((entry) => entry.name)).toEqual(visible.map((text) => text.trim()));
    expect(visible[0]).toMatch(/Ravenswood/);
  });

  test("has no WCAG A/AA violations", async ({ page }) => {
    await page.goto(PAGE);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
  });
});
