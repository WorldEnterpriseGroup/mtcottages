const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

// The insurance displacement and ALE housing hub (#42) and its printable
// adjuster summary. The pages run on the existing payment flow: no direct
// insurer billing and no move-in promise, and every inquiry link pre-fills
// the insurance audience.
const HUB = "/insurance-housing/";
const SUMMARY = "/insurance-housing/adjuster-summary/";
const HOMES = ["frederick", "broad", "buck", "oak", "virginia", "henrietta"];

test("the insurance hub explains an ALE stay on the existing payment flow", async ({ page }) => {
  await page.goto(HUB);
  await expect(page).toHaveTitle("Temporary Housing for Insurance Claims (ALE) | Mt Cottages");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Temporary furnished housing after a fire, flood or covered loss");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://mtcottages.com${HUB}`);

  const steps = page.locator("#how-it-works");
  await expect(steps).toContainText("not a coverage decision");
  await expect(steps).toContainText("Furnished Finder and KeyCheck");
  await expect(steps).toContainText("We do not bill insurance companies directly");
  await expect(steps).toContainText("no promise on how soon you can move in");
  await expect(page.locator("#household li")).toHaveCount(HOMES.length);

  // Each school is measured from the homes in its own town; town-centre origins say so.
  const chart = page.locator('[data-guide-chart="insurance-school-drives"]');
  await expect(chart.locator("svg g[data-chart-group]")).toHaveCount(4);
  await expect(chart.locator('[data-chart-bar="Frederick Cottage"]')).toHaveCount(1);
  await expect(chart.locator('[data-chart-group="Ravenswood High School"] [data-chart-bar="Virginia Cottage (from the town centre)"]')).toHaveCount(1);
  await expect(chart.locator('[data-chart-group="Marietta High School"] [data-chart-bar]')).toHaveCount(1);

  const cta = page.locator("[data-guide-cta]");
  await expect(cta.getByRole("link", { name: /Check dates/ })).toHaveAttribute("href", /audience=insurance/);
  await expect(page.locator(`[data-related] a[href="${SUMMARY}"]`)).toBeVisible();
});

test("the adjuster summary lists every home, the terms and a pre-filled inquiry", async ({ page }) => {
  await page.goto(SUMMARY);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Furnished housing for insurance claims: a one-page summary");
  for (const id of HOMES) await expect(page.locator(`[data-testid="summary-homes"] li[data-home="${id}"]`)).toHaveCount(1);
  await expect(page.locator('[data-testid="summary-terms"] li').first()).toBeVisible();
  await expect(page.locator('[data-testid="summary-steps"] li')).toHaveCount(4);
  await expect(page.locator('[data-cta="summary-inquiry"]')).toHaveAttribute("href", /audience=insurance/);
  await expect(page.locator('a[href="mailto:stay@mtcottages.com"]')).toBeVisible();
  // Printed, the page is the summary alone: the site chrome is hidden.
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".site-header")).toBeHidden();
  await expect(page.locator('[data-testid="summary-homes"]')).toBeVisible();
});

test("the old insurance guide URL redirects to the hub and stays out of the sitemap", async ({ page, request }) => {
  const old = await request.get("/insurance-housing.html");
  expect(old.status()).toBe(200);
  const html = await old.text();
  expect(html).toContain('name="robots" content="noindex"');
  expect(html).toContain(`href="https://mtcottages.com${HUB}"`);
  await page.goto("/insurance-housing.html");
  await expect(page).toHaveURL(new RegExp(`${HUB}$`));
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain(`https://mtcottages.com${HUB}`);
  expect(sitemap).toContain(`https://mtcottages.com${SUMMARY}`);
  expect(sitemap).not.toContain("insurance-housing.html");
  await page.goto("/");
  await expect(page.locator(`header a[href="${HUB}"]`).first()).toBeAttached();
});

for (const pathname of [HUB, SUMMARY]) {
  test(`${pathname} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(pathname);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
  });
}
