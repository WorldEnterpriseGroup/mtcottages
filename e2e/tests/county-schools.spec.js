const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { readFileSync } = require("node:fs");
const path = require("node:path");

// The county schools guides (#53). Every drive time must be the one in
// _data/distances.json; every district and college links to its official site;
// each guide tells families to confirm the serving school with the district.
const distances = JSON.parse(readFileSync(path.join(__dirname, "../../_data/distances.json"), "utf8"));
const row = (origin, destination) => {
  const found = distances.rows.find((candidate) => candidate.origin === origin && candidate.destination === destination);
  if (!found) throw new Error(`no distances row ${origin} -> ${destination}`);
  return found;
};

const GUIDES = [
  {
    href: "/guides/wood-county-wv-schools/",
    title: "Parkersburg, WV Schools: Wood County Guide | Mt Cottages",
    h1: "Schools in Wood County, West Virginia",
    district: "https://www.woodcountyschoolswv.com/",
    colleges: ["https://www.wvup.edu/"],
    bar: { origin: "oak", destination: "parkersburg-high-school", name: "Oak Cottage" },
    homes: ["/parkersburg/broad-cottage/", "/parkersburg/oak-cottage/"],
    notOffered: "/marietta/frederick/",
  },
  {
    href: "/guides/marietta-ohio-schools/",
    title: "Marietta, Ohio Schools and Colleges | Mt Cottages",
    h1: "Schools and colleges in Marietta, Ohio",
    district: "https://www.mariettacityschools.k12.oh.us/",
    colleges: ["https://www.marietta.edu/", "https://www.wscc.edu/"],
    bar: { origin: "frederick", destination: "marietta-college", name: "Frederick Cottage" },
    homes: ["/marietta/frederick/"],
    notOffered: "/parkersburg/broad-cottage/",
  },
  {
    href: "/guides/ravenswood-wv-schools/",
    title: "Ravenswood, WV Schools: Jackson County Guide | Mt Cottages",
    h1: "Schools in Ravenswood and Jackson County, West Virginia",
    district: "https://www.boe.jack.k12.wv.us/",
    colleges: [],
    bar: { origin: "henrietta", destination: "ripley-high-school", name: "Henrietta Cottage" },
    homes: ["/ravenswood/henrietta-cottage/"],
    notOffered: "/parkersburg/oak-cottage/",
  },
];

for (const guide of GUIDES) {
  test(`${guide.href} links official sites and quotes measured drives`, async ({ page }) => {
    await page.goto(guide.href);
    await expect(page).toHaveTitle(guide.title);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.h1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://mtcottages.com${guide.href}`);

    const short = page.locator("#short-answer");
    await expect(short).toContainText("Confirm it with the district");
    for (const url of [guide.district, ...guide.colleges]) await expect(page.locator(`.garticle a[href="${url}"]`).first()).toBeAttached();

    const drive = row(guide.bar.origin, guide.bar.destination);
    const chart = page.locator(`[data-guide-chart="${guide.href.split("/")[2]}-drives"]`);
    await expect(chart.locator(`[data-chart-bar="${guide.bar.name}"] .gc-value`).first()).toHaveText(`${drive.minutes} min`);

    const cta = page.locator("[data-guide-cta]");
    await expect(cta.getByRole("link", { name: /Check dates/ })).toHaveAttribute("href", /audience=relocation/);
    for (const home of guide.homes) await expect(cta.locator(`a[href="${home}"]`)).toBeAttached();
    await expect(cta.locator(`a[href="${guide.notOffered}"]`)).toHaveCount(0);
    // Charts only: no school photo.
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
