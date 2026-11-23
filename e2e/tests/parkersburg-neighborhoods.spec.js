const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { readFileSync } = require("node:fs");
const path = require("node:path");

// The Parkersburg neighborhoods guide (#54). Every drive must be the one in
// _data/distances.json, the areas must run north to south by their measured
// points, every place links to the source it was checked against, and the
// copy describes places, never people (fair housing).
const GUIDE = "/guides/parkersburg-neighborhoods/";
const distances = JSON.parse(readFileSync(path.join(__dirname, "../../_data/distances.json"), "utf8"));
const row = (origin, destination) => {
  const found = distances.rows.find((candidate) => candidate.origin === origin && candidate.destination === destination);
  if (!found) throw new Error(`no distances row ${origin} -> ${destination}`);
  return found;
};

// Words that describe or steer by who lives somewhere, or rank an area as a
// place to live, rather than saying what is there. Fair Housing Act advertising
// guidance (24 CFR 100.75) treats such words as a preference.
const FAIR_HOUSING = [
  /\bsafe(?:st|r|ty)?\b/i, /\bcrime\b/i, /\bdangerous\b/i, /\bsketchy\b/i, /\brough\b/i,
  /\b(?:good|bad|best|worst|nice|better) (?:area|neighbou?rhood|part of town|side of town|schools?)\b/i,
  /\bfamily[- ]friendly\b/i, /\bfamil(?:y|ies) (?:area|neighbou?rhood)\b/i, /\b(?:young )?professionals\b/i, /\bretirees\b/i,
  /\bsingles\b/i, /\bcouples\b/i, /\bstudents\b/i, /\bexclusive\b/i, /\bupscale\b/i, /\bdesirable\b/i, /\bprestigious\b/i,
  /\bdiverse\b/i, /\bethnic\b/i, /\bdemographic/i, /\bminorit/i, /\bimmigrant/i, /\bchurch(?:es)?\b/i, /\bchristian\b/i,
  /\bwhite\b/i, /\bblack\b/i, /\bhispanic\b/i, /\bperfect for\b/i, /\bideal for\b/i, /\bquiet\b/i, /\btight-knit\b/i,
];

test("the neighborhoods guide shows its areas north to south with measured drives", async ({ page }) => {
  await page.goto(GUIDE);
  await expect(page).toHaveTitle("Parkersburg, WV Neighborhoods: What's Nearby | Mt Cottages");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Parkersburg, WV neighborhoods: what is near each area");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://mtcottages.com${GUIDE}`);

  // Our own diagram, ordered by the anchors' measured latitude; no map tiles, no photo.
  const anchors = { "Vienna, a separate city": "vienna-centre", "Broad Street and City Park": "parkersburg-city-park", "Downtown, at the two rivers": "downtown-parkersburg", "The south side": "parkersburg-south-high-school" };
  const expected = Object.keys(anchors).sort((a, b) => distances.destinations[anchors[b]].lat - distances.destinations[anchors[a]].lat);
  await expect(page.locator('[data-guide-diagram="parkersburg-areas"] .gd-step strong')).toHaveText(expected);
  await expect(page.locator(".garticle-figure")).toHaveCount(0);
  await expect(page.locator('.garticle img, .garticle iframe, .garticle [class*="leaflet"]')).toHaveCount(0);

  const areaDrives = page.locator('[data-guide-chart="parkersburg-area-drives"]');
  const park = areaDrives.locator("svg g[data-chart-group]").filter({ hasText: "Parkersburg City Park" });
  await expect(park.locator('[data-chart-bar="Broad Cottage"] .gc-value')).toHaveText(`${row("broad", "parkersburg-city-park").minutes} min`);
  // Buck's street is not published: its bars say they are the town centre's.
  await expect(park.locator('[data-chart-bar="Buck Cottage (from the Parkersburg centre)"] .gc-value')).toHaveText(`${row("parkersburg-centre", "parkersburg-city-park").minutes} min`);
  const everyday = page.locator('[data-guide-chart="parkersburg-everyday-drives"]');
  const camden = everyday.locator("svg g[data-chart-group]").filter({ hasText: "Camden Clark" });
  await expect(camden.locator('[data-chart-bar="Oak Cottage"] .gc-value')).toHaveText(`${row("oak", "camden-clark").minutes} min`);

  // Every place links to where it was checked, in a new tab.
  const places = page.locator("[data-places] a");
  expect(await places.count()).toBeGreaterThanOrEqual(15);
  for (const href of await places.evaluateAll((links) => links.map((link) => link.getAttribute("href")))) expect(href).toMatch(/^https:\/\//);
  await expect(page.locator('#city-park [data-place="Parkersburg City Park"] a')).toHaveAttribute("href", /openstreetmap\.org/);

  const cta = page.locator("[data-guide-cta]");
  await expect(cta.getByRole("link", { name: /Check dates/ })).toHaveAttribute("href", /audience=relocation/);
  for (const home of ["/parkersburg/broad-cottage/", "/parkersburg/oak-cottage/", "/parkersburg/buck-cottage/"]) await expect(cta.locator(`a[href="${home}"]`)).toBeAttached();
});

test("the neighborhoods guide describes places, never people (fair housing)", async ({ page }) => {
  await page.goto(GUIDE);
  const copy = await page.evaluate(() => {
    const parts = [document.title, document.querySelector('meta[name="description"]').content, document.querySelector("h1").innerText];
    for (const section of document.querySelectorAll(".garticle-section, .garticle-hero")) {
      const clone = section.cloneNode(true);
      clone.querySelectorAll("[data-guide-cta]").forEach((cta) => cta.remove());
      parts.push(clone.innerText);
    }
    return parts.join("\n");
  });
  expect(copy).toContain("Point Park");
  expect(FAIR_HOUSING.map((pattern) => copy.match(pattern)?.[0]).filter(Boolean)).toEqual([]);
  // Buck Cottage's street is not published, so the guide never places it in an area.
  expect(copy).not.toMatch(/Buck Cottage (?:is|sits) (?:on|in|near)/i);
});

test("the neighborhoods guide is linked from the guides index, its homes and the sitemap", async ({ page, request }) => {
  await page.goto("/guides/");
  await expect(page.locator(`[data-guide-list] a[href="${GUIDE}"]`)).toBeVisible();
  for (const home of ["/parkersburg/broad-cottage/", "/parkersburg/oak-cottage/"]) {
    await page.goto(home);
    await expect(page.locator(`[data-related] a[href="${GUIDE}"]`)).toBeVisible();
  }
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain(`https://mtcottages.com${GUIDE}`);
});

test("the neighborhoods guide has no WCAG A/AA violations", async ({ page }) => {
  await page.goto(GUIDE);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
});
