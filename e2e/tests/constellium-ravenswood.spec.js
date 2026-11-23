// Constellium Ravenswood crew landing (#43): /corporate-housing/constellium-ravenswood/, a plant child of
// the corporate and crew hub (#34), built from src/data/plantLandings.ts like Washington Works (#44).
// Checks the search targeting, that every minute printed is the measured one from _data/distances.json
// (Virginia Cottage from the Ravenswood town centre, labelled so), the crew
// capacity table, the neutral no-affiliation wording, the crew inquiry (never submitted), links both
// ways, the FAQPage schema and accessibility.
const fs = require("node:fs");
const path = require("node:path");
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const PAGE = "/corporate-housing/constellium-ravenswood/";
const HUB = "/corporate-housing/";
const ORIGIN = "https://mtcottages.com";
const PLANT = "constellium-ravenswood";

const distances = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "_data", "distances.json"), "utf8"));
const measured = (origin, destination) => {
  const row = distances.rows.find((entry) => entry.origin === origin && entry.destination === destination);
  if (!row) throw new Error(`_data/distances.json has no ${origin} to ${destination} row`);
  return row;
};
const HOMES = [
  { id: "henrietta", href: "/ravenswood/henrietta-cottage/", from: "Henrietta Cottage, from its street address" },
  { id: "virginia", href: "/ravenswood/virginia-cottage/", from: "Virginia Cottage, from the Ravenswood town centre" },
].map((home) => ({ ...home, row: measured(distances.microsites[home.id], PLANT) }));

test.describe("Constellium Ravenswood landing /corporate-housing/constellium-ravenswood/", () => {
  test("targets Constellium Ravenswood searches and is in the sitemap", async ({ page, request }) => {
    expect((await page.goto(PAGE)).ok()).toBeTruthy();
    const title = await page.title();
    expect(title.length, `title "${title}" is longer than 60 characters`).toBeLessThanOrEqual(60);
    expect(title).toMatch(/Constellium Ravenswood/);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description.length).toBeGreaterThan(70);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toMatch(/Constellium Ravenswood/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Constellium Ravenswood");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect([`${ORIGIN}${PAGE}`, `${ORIGIN}${PAGE}index.html`]).toContain(canonical);
    expect(await (await request.get("/sitemap.xml")).text()).toContain(`<loc>${canonical}</loc>`);
  });

  test("prints the measured drive from each home, nearest first", async ({ page }) => {
    await page.goto(PAGE);
    const order = await page.locator("#drives .tn-hospital").evaluateAll((cards) => cards.map((card) => card.getAttribute("data-home")));
    expect(order).toEqual([...HOMES].sort((a, b) => a.row.minutes - b.row.minutes || a.id.localeCompare(b.id)).map((home) => home.id));
    for (const home of HOMES) {
      const card = page.locator(`#drives li.tn-hospital[data-home="${home.id}"]`);
      await expect(card.locator('[data-testid="drive-minutes"]')).toHaveText(`${home.row.minutes} min`);
      await expect(card).toContainText(home.from);
      await expect(card).toContainText(`${home.row.miles.toFixed(1)} mi`);
    }
    for (const home of HOMES) {
      const i77 = measured(distances.microsites[home.id], "i77-ravenswood");
      await expect(page.locator(`[data-testid="area-table"] tr[data-place="i77-ravenswood"] td[data-home="${home.id}"] strong`)).toHaveText(`${i77.minutes} min`);
    }
    // Downtown Ravenswood is Virginia Cottage's measuring point, so it is not a row.
    await expect(page.locator('[data-testid="area-table"] tr[data-place="downtown-ravenswood"]')).toHaveCount(0);
  });

  test("shows the hub's crew capacity for each home and stays neutral", async ({ page }) => {
    await page.goto(HUB);
    const hubCells = {};
    for (const home of HOMES) hubCells[home.id] = await page.locator(`[data-testid="capacity-table"] tr[data-home="${home.id}"] td[data-cell="bedrooms"]`).textContent();
    await page.goto(PAGE);
    for (const home of HOMES) {
      await expect(page.locator(`[data-testid="capacity-table"] tr[data-home="${home.id}"] td[data-cell="bedrooms"]`)).toHaveText(hubCells[home.id]);
    }
    await expect(page.locator('[data-testid="disclaimer"]')).toContainText("not affiliated with");
    await expect(page.locator("main")).not.toContainText(/lawsuit|litigation|settlement|contaminat|PFAS|C8/i);
  });

  test("the inquiry carries the crew audience and each home", async ({ page }) => {
    await page.goto(PAGE);
    const url = new URL(await page.locator('[data-cta="hero"] a.button').first().getAttribute("href"));
    expect(url.searchParams.get("audience")).toBe("crew");
    for (const home of HOMES) await expect(page.locator(`#homes [data-cta="home-${home.id}"]`)).toHaveAttribute("href", new RegExp(`property=${home.id}`));
  });

  test("is linked from the corporate hub and each home it lists, and links back", async ({ page }) => {
    await page.goto(HUB);
    await expect(page.locator(`a[data-plant-landing][href="${PAGE}"]`)).toBeVisible();
    for (const home of HOMES) {
      await page.goto(home.href);
      await expect(page.locator(`[data-related] a[href="${PAGE}"]`)).toBeVisible();
    }
    await page.goto(PAGE);
    await expect(page.locator(`a[href="${HUB}"]`).first()).toBeAttached();
    for (const home of HOMES) await expect(page.locator(`#drives a[href="${home.href}"]`)).toBeAttached();
  });

  test("publishes FAQPage structured data matching the visible questions", async ({ page }) => {
    await page.goto(PAGE);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const nodes = blocks.flatMap((block) => { const parsed = JSON.parse(block); return Array.isArray(parsed) ? parsed : [parsed]; });
    const faq = nodes.find((node) => node["@type"] === "FAQPage");
    expect(faq).toBeTruthy();
    const visible = await page.locator("#faq summary").allTextContents();
    expect(faq.mainEntity.map((entry) => entry.name)).toEqual(visible.map((text) => text.trim()));
  });

  test("has no WCAG A/AA violations", async ({ page }) => {
    await page.goto(PAGE);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
  });
});
