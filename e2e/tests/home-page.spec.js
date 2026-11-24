// #21: the home page is built around the promise and routes each audience to its hub.
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const PROMISE = "A real home in the river towns, ready the day you arrive.";
const TOWNS = ["Marietta, Ohio", "Parkersburg, WV", "Ravenswood, WV"];
const BANNED = /\b(luxury|world-class|paradise|best-in-class|hidden gem|only \d+ left)\b|!/i;

test("on a 390px phone the promise, the three towns and Check dates are above the fold", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toHaveText(PROMISE);
  const towns = page.locator(".hero-towns a");
  await expect(towns).toHaveText(TOWNS);
  const cta = page.locator('.hero [data-cta="hero"] a.button');
  await expect(cta).toHaveAttribute("href", "https://stay.mtcottages.com/?src=home");
  await expect(cta).toHaveText(/Check dates/i);
  // The sticky mobile bar covers the bottom of the screen, so the fold ends at its top edge.
  const bar = await page.locator(".mobile-action").boundingBox();
  const fold = bar ? bar.y : 844;
  for (const [name, locator] of [["promise", h1], ["towns", towns.last()], ["CTA", cta]]) {
    const box = await locator.boundingBox();
    expect(box, `${name} is rendered`).not.toBeNull();
    expect(box.y + box.height, `${name} sits above the fold at 390px`).toBeLessThanOrEqual(fold);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("each audience card links to a live hub", async ({ page, request }) => {
  await page.goto("/");
  const cards = page.locator("[data-audience-router] .audience-card");
  await expect(cards).toHaveCount(4);
  const expected = [
    [/nurses and residents/i, "/travel-nurses/"],
    [/crews/i, "/corporate-housing/"],
    [/insurance and relocating families/i, "/insurance-housing/"],
    [/long-term/i, "/living.html"],
  ];
  for (const [index, [label, href]] of expected.entries()) {
    const card = cards.nth(index);
    await expect(card.locator(".eyebrow")).toHaveText(label);
    await expect(card.locator("a")).toHaveAttribute("href", href);
    const response = await request.get(href);
    expect(response.status(), `${href} resolves`).toBe(200);
  }
  await cards.first().locator("a").click();
  await expect(page).toHaveURL(/\/travel-nurses\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the towns list only live homes and say Marietta, Ohio", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#town-marietta h3")).toHaveText("Marietta, Ohio");
  await expect(page.locator("#town-parkersburg .town-card__homes a")).toHaveCount(3);
  await expect(page.locator("#town-ravenswood .town-card__homes a")).toHaveCount(2);
  await expect(page.locator("main")).not.toContainText(/Yellow Cottage|Walnut Cottage/);
  for (const link of await page.locator(".town-card__homes a").all()) {
    await expect(link).toContainText(/\$[\d,]+\/month/);
  }
});

test("the drive chart is a labelled table of estimates, longest bar for the longest drive", async ({ page }) => {
  await page.goto("/");
  const chart = page.locator("[data-drive-chart]");
  await expect(chart.locator("caption")).toContainText("Estimated drive");
  const rows = chart.locator("tbody tr");
  await expect(rows).toHaveCount(4);
  // The four homes with an approved address, shortest drive first (figures come from _data/distances.json).
  expect((await rows.locator("th").allTextContents()).sort()).toEqual(["Broad Cottage", "Frederick Cottage", "Henrietta Cottage", "Oak Cottage"]);
  const minutes = (await chart.locator(".drive-chart__value").allTextContents()).map((text) => Number(text.match(/\d+/)?.[0]));
  expect(minutes.every((value) => value > 0)).toBe(true);
  expect(minutes).toEqual([...minutes].sort((a, b) => a - b));
  const widths = await chart.locator(".drive-chart__bar").evaluateAll((bars) => bars.map((bar) => bar.getBoundingClientRect().width));
  expect(widths.every((width) => width > 0)).toBe(true);
  for (let index = 1; index < widths.length; index += 1) {
    if (minutes[index] > minutes[index - 1]) expect(widths[index]).toBeGreaterThan(widths[index - 1]);
  }
  // Each row links to that home's measured drive-time table.
  for (const href of await rows.locator("th a").evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    expect(href).toMatch(/\/location\.html#drive-times$/);
  }
  await expect(page.locator("#minutes figcaption")).toContainText("OpenStreetMap");
  await expect(page.locator("#minutes figcaption")).toContainText("confirm on inquiry");
  // Buck and Virginia have no published address, so they are never measured from a pin.
  await expect(rows.filter({ hasText: /Buck|Virginia/ })).toHaveCount(0);
});

test("the home page has one H1, a unique short title, its canonical and no banned copy", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  const title = await page.title();
  expect(title.length, title).toBeLessThanOrEqual(60);
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description.length, description).toBeLessThanOrEqual(160);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/mtcottages\.com\/(index\.html)?$/);
  expect(await page.locator("main").innerText()).not.toMatch(BANNED);
  const images = await page.locator("main img").evaluateAll((items) => items.map((item) => item.getAttribute("alt") || ""));
  expect(images.length).toBeGreaterThanOrEqual(6);
  expect(images.every((alt) => alt.trim().length > 10), images.join(" | ")).toBe(true);
});

// Review screenshots for the MR (kept in CI's e2e/test-results artifact): the new page from this build
// and, as the "before", the page live on mtcottages.com while this change is still unmerged.
test("captures before and after screenshots of the home page", async ({ page, browser }, testInfo) => {
  test.setTimeout(120_000);
  for (const [name, width, height] of [["phone", 390, 844], ["desktop", 1440, 900]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.screenshot({ path: testInfo.outputPath(`after-${name}-fold.png`) });
    await page.screenshot({ path: testInfo.outputPath(`after-${name}-full.png`), fullPage: true });
  }
  if (!process.env.HOME_BEFORE_URL) {
    testInfo.annotations.push({ type: "before", description: "HOME_BEFORE_URL is not set; only the after screenshots were taken." });
    return;
  }
  const live = await browser.newPage();
  try {
    for (const [name, width, height] of [["phone", 390, 844], ["desktop", 1440, 900]]) {
      await live.setViewportSize({ width, height });
      await live.goto(process.env.HOME_BEFORE_URL, { timeout: 30_000 });
      await live.screenshot({ path: testInfo.outputPath(`before-${name}-fold.png`) });
      await live.screenshot({ path: testInfo.outputPath(`before-${name}-full.png`), fullPage: true });
    }
  } catch (error) {
    testInfo.annotations.push({ type: "before", description: `Live page not captured: ${error.message}` });
  } finally {
    await live.close();
  }
});

for (const width of [390, 1440]) {
  test(`the home page has no axe violations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, results.violations.map((item) => `${item.id}: ${item.nodes.map((node) => node.target).join(", ")}`).join("\n")).toEqual([]);
  });
}
