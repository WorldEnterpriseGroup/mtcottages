// Memorial Health System landing (#33): /travel-nurses/memorial-health-marietta/.
// Checks the keyword targeting, the measured drives, the cited residency facts,
// the honesty rules, the inquiry links (never submitted), the structured data,
// accessibility and the internal links from the hub and the Marietta town page.
const fs = require("node:fs");
const path = require("node:path");
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { stubStayHost } = require("./support/stay-host");

const PAGE = "/travel-nurses/memorial-health-marietta/";
const HUB = "/travel-nurses/";
const STAY = "https://stay.mtcottages.com/";
const ORIGIN = "https://mtcottages.com";
const STAY_HREF = `${STAY}?property=frederick&audience=healthcare&src=travel-nurses-memorial-health-marietta`;

const distances = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "_data", "distances.json"), "utf8"));
const measured = (origin, destination) => {
  const row = distances.rows.find((entry) => entry.origin === origin && entry.destination === destination);
  if (!row) throw new Error(`_data/distances.json has no ${origin} to ${destination} row`);
  return row;
};

const jsonLd = async (page) => {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((block) => {
    const parsed = JSON.parse(block);
    return Array.isArray(parsed) ? parsed : [parsed];
  });
};

test.describe("Memorial Health landing /travel-nurses/memorial-health-marietta/", () => {
  test("targets Marietta Memorial and travel nurse housing in Marietta, Ohio", async ({ page, request }) => {
    const response = await page.goto(PAGE);
    expect(response.ok()).toBeTruthy();
    const title = await page.title();
    expect(title.length, `title "${title}" is longer than 60 characters`).toBeLessThanOrEqual(60);
    expect(title).toMatch(/Marietta Memorial Hospital/);
    const description = (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
    expect(description.length).toBeGreaterThan(70);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toMatch(/travel nurse/i);
    expect(description).toMatch(/resident/i);
    await expect(page.locator("h1")).toHaveCount(1);
    const h1 = (await page.locator("h1").textContent()) ?? "";
    expect(h1).toMatch(/housing near Marietta Memorial Hospital/i);
    expect(h1).toMatch(/Marietta, Ohio/);
    const lede = (await page.locator("main h1 + p").textContent()) ?? "";
    expect(lede).toMatch(/Memorial Health System residency/);
    const intro = (await page.locator("main h1 + p + p").textContent()) ?? "";
    expect(intro).toMatch(/travel nurse housing in Marietta, Ohio/i);
    // Every Marietta in the targeted text is the Ohio one, never Georgia.
    for (const text of [title, description, h1, lede, intro]) {
      expect(text).not.toMatch(/Georgia|\bGA\b|Atlanta|Cobb/);
      expect(text.match(/Marietta(?!,? (Ohio|OH|Memorial|College))/g) ?? [], `bare Marietta in "${text}"`).toEqual([]);
    }
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect([`${ORIGIN}${PAGE}`, `${ORIGIN}${PAGE}index.html`]).toContain(canonical);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap, "the page is in the sitemap under its canonical").toContain(`<loc>${canonical}</loc>`);
  });

  test("is linked from the travel-nurse hub and the Marietta town page, and links to homes and hubs", async ({ page, request }) => {
    for (const source of [HUB, "/marietta/index.html"]) {
      const html = await (await request.get(source)).text();
      expect(html, `${source} should link to ${PAGE}`).toContain(`href="${PAGE}"`);
    }
    await page.goto(PAGE);
    for (const href of [HUB, "/marietta/frederick/", "/parkersburg/broad-cottage/", "/parkersburg/oak-cottage/", "/marietta/index.html"]) {
      expect(await page.locator(`main a[href="${href}"]`).count(), `${href} is linked`).toBeGreaterThanOrEqual(1);
      expect((await request.get(href)).status(), `${href} status`).toBe(200);
    }
    const crumbs = page.locator("main nav.crumbs");
    await expect(crumbs.getByRole("link", { name: "Travel nurses" })).toHaveAttribute("href", HUB);
  });

  test("every drive minute and mile is the measured one, nearest first, with its source", async ({ page }) => {
    await page.goto(PAGE);
    const rows = page.locator('[data-testid="memorial-drives"] tbody tr');
    const ids = await rows.evaluateAll((items) => items.map((item) => item.getAttribute("data-home")));
    expect(ids.sort()).toEqual(["broad", "frederick", "oak"]);
    const order = await rows.evaluateAll((items) => items.map((item) => item.getAttribute("data-home")));
    const toMemorial = order.map((id) => measured(id, "marietta-memorial").minutes);
    expect(toMemorial, "rows are sorted by the drive to Marietta Memorial").toEqual([...toMemorial].sort((a, b) => a - b));
    for (const id of order) {
      for (const destination of ["marietta-memorial", "selby-general"]) {
        const row = measured(id, destination);
        const cell = page.locator(`[data-testid="memorial-drives"] tr[data-home="${id}"] td[data-destination="${destination}"]`);
        await expect(cell, `${id} to ${destination}`).toContainText(`${row.minutes} min`);
        await expect(cell).toContainText(`${row.miles.toFixed(1)} mi`);
      }
    }
    // Frederick's figures in the lede, facts and FAQ are the measured ones too.
    const memorial = measured("frederick", "marietta-memorial");
    const selby = measured("frederick", "selby-general");
    await expect(page.locator('[data-testid="memorial-lede"]')).toContainText(`${memorial.minutes}-minute drive from Marietta Memorial Hospital and ${selby.minutes} minutes from Selby General`);
    await expect(page.locator('[data-testid="frederick-facts"]')).toContainText(`${memorial.minutes} minutes by car to Marietta Memorial Hospital (${memorial.miles.toFixed(1)} mi)`);
    await expect(page.locator('[data-testid="drive-source"]')).toContainText(/OpenStreetMap/);
    await expect(page.locator('[data-testid="drive-source"]')).toContainText(/measured \d{1,2} \w{3} 20\d\d/);
    // No Belpre time on this page: its table measures the hospitals only. Belpre's
    // measured drives (belpre-centre, #56) belong to the Belpre guide.
    const main = (await page.locator("main").textContent()) ?? "";
    expect(main).not.toMatch(/\d+\s*min(ute)?s?[^.]{0,40}Belpre|Belpre[^.]{0,40}\d+\s*min/i);
  });

  test("the residents section cites Memorial's own pages for both programmes", async ({ page }) => {
    await page.goto(`${PAGE}#residents`);
    await expect(page.locator("#residents h2")).toContainText(/Memorial Health System residents/);
    const programmes = page.locator('[data-testid="residency-programmes"] [data-programme]');
    await expect(programmes).toHaveCount(2);
    await expect(page.locator('[data-programme="emergency-medicine"]')).toContainText("Emergency Medicine Residency");
    await expect(page.locator('[data-programme="emergency-medicine"]')).toContainText(/three-year/i);
    await expect(page.locator('[data-programme="emergency-medicine"]')).toContainText(/ACGME/);
    await expect(page.locator('[data-programme="family-medicine"]')).toContainText("Family Medicine Residency");
    await expect(page.locator('[data-programme="family-medicine"]')).toContainText(/Belpre, Ohio/);
    for (const id of ["emergency-medicine", "family-medicine"]) {
      const hrefs = await page.locator(`[data-programme="${id}"] .tn-sources a`).evaluateAll((links) => links.map((link) => link.getAttribute("href")));
      expect(hrefs.length, `${id} cites a source`).toBeGreaterThanOrEqual(1);
      for (const href of hrefs) expect(href).toMatch(/^https:\/\/www\.mhsystem\.org\//);
    }
    await expect(page.locator("#residents")).toContainText(/Programme details read from Memorial Health System's public pages/);
    // Long-stay terms are not invented: a residency-length stay is confirmed on inquiry.
    await expect(page.locator('[data-testid="residency-housing"]')).toContainText(/we have not set terms for stays of a year or longer/i);
  });

  test("states only confirmed terms and makes no promise ops has not confirmed", async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('[data-testid="terms-stated"]')).toContainText("30-day minimum stay");
    await expect(page.locator('[data-testid="terms-stated"]')).toContainText("$2,575");
    // "Owner-confirmed" only while src/data/terms.json marks Frederick's rate confirmed (#72).
    const termsJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../../src/data/terms.json"), "utf8"));
    const rateConfirmed = termsJson.homes.frederick.monthlyRate.status === "confirmed";
    const mainText = (await page.locator("main").textContent()) ?? "";
    if (rateConfirmed) expect(mainText).toMatch(/confirmed by the owner/);
    else expect(mainText).not.toMatch(/owner[- ]confirmed|confirmed by the owner|owner has confirmed/i);
    const confirm = page.locator('[data-testid="terms-confirm"] li');
    expect(await confirm.count()).toBeGreaterThanOrEqual(5);
    await expect(page.locator('[data-testid="terms-confirm"]')).toContainText(/residency year/i);
    await expect(page.locator('[data-testid="terms-confirm"]')).toContainText(/security deposit/i);
    await expect(page.locator('[data-testid="terms-stated"]')).toContainText("Utilities are included in the monthly price. No pets.");
    const main = (await page.locator("main").textContent()) ?? "";
    expect(main).not.toMatch(/guarantee|within \d+ (hours?|minutes?|days?)|same[- ]day|pets? (are )?(welcome|allowed)|pet[- ]friendly|no minimum|week[- ]to[- ]week|blackout/i);
    expect(main).not.toMatch(/\b(luxury|world-class|paradise|best-in-class|hidden gem|only \d+ left)\b|!/i);
    // No street address on this page, not even an approved one; the home pages carry those.
    expect(main).not.toMatch(/\b\d{2,5} [A-Z][a-z]+ (St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd)\b/);
    // The wrong "5 minutes" claim from the issue brief never appears (scripts/lib/claims.mjs).
    expect(main).not.toMatch(/\b[1-5]\s*min(ute)?s?\s+(drive\s+)?(to|from)\s+(the\s+)?Marietta Memorial/i);
  });

  test("the inquiry links carry Frederick and the healthcare audience, and are never submitted", async ({ page, context }) => {
    const methods = await stubStayHost(context, STAY);
    await page.goto(PAGE);
    const hero = page.locator('main [data-cta="hero"] a.button').first();
    await expect(hero).toHaveAttribute("href", STAY_HREF);
    await expect(hero).toHaveText(/Check dates for Frederick Cottage/);
    await expect(page.locator('main [data-cta="next-step"]')).toHaveAttribute("href", STAY_HREF);
    // Every stay link on the page carries the healthcare audience and this page as its source.
    const hrefs = await page.locator(`a[href^="${STAY}"]`).evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThanOrEqual(3);
    for (const href of hrefs) {
      const url = new URL(href);
      expect(url.searchParams.get("audience"), href).toBe("healthcare");
      expect(url.searchParams.get("src"), href).toBe("travel-nurses-memorial-health-marietta");
    }
    await expect(page.locator("main form")).toHaveCount(0);
    await hero.click();
    await expect(page).toHaveURL(STAY_HREF);
    expect(methods.every((method) => method === "GET"), `stay requests were ${methods.join(", ")}`).toBe(true);
  });

  test("the FAQ disclosures match the FAQPage schema word for word, with breadcrumbs and no price markup", async ({ page }) => {
    await page.goto(PAGE);
    const questions = page.locator("#faq details");
    const count = await questions.count();
    expect(count).toBeGreaterThanOrEqual(5);
    const visible = [];
    for (let index = 0; index < count; index += 1) {
      const item = questions.nth(index);
      visible.push({ q: ((await item.locator("summary").textContent()) ?? "").trim(), a: ((await item.locator("p").textContent()) ?? "").trim() });
    }
    const text = visible.map(({ q }) => q).join("\n");
    for (const topic of [/Marietta Memorial/, /13-week/, /residency year/, /Memorial Health System/, /scam/]) expect(text).toMatch(topic);
    const nodes = await jsonLd(page);
    const faqPage = nodes.find((node) => node["@type"] === "FAQPage");
    expect(faqPage, "FAQPage JSON-LD").toBeTruthy();
    expect(faqPage.mainEntity.map((entry) => ({ q: entry.name, a: entry.acceptedAnswer.text }))).toEqual(visible);
    const crumbs = nodes.find((node) => node["@type"] === "BreadcrumbList");
    expect(crumbs.itemListElement.map((item) => item.name)).toEqual(["Home", "Travel nurses", "Memorial Health, Marietta"]);
    expect(crumbs.itemListElement.at(-1).item).toBe(`${ORIGIN}${PAGE}`);
    expect(JSON.stringify(nodes)).not.toMatch(/aggregateRating|"review"|"offers"|priceRange/);
  });

  test("says plainly that Mt Cottages is not affiliated with Memorial Health System", async ({ page }) => {
    await page.goto(PAGE);
    const disclaimer = page.locator('[data-testid="disclaimer"]');
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText(/not affiliated with, endorsed by or sponsored by Memorial Health System/);
    await expect(disclaimer).toContainText(/residency programmes/);
  });

  test("uses a real home photo as the hero, with a meaningful alt", async ({ page }) => {
    await page.goto(PAGE);
    const hero = page.locator(".tl-hero figure img");
    await expect(hero).toHaveAttribute("alt", /Frederick Cottage/);
    await expect(hero).toHaveAttribute("src", /frederick/);
    for (const image of await page.locator("main img").all()) {
      // A real description: at least 10 characters with a word in them (the same check as the hub's cards).
      await expect(image).toHaveAttribute("alt", /^(?=.*\w{3}).{10,}$/);
    }
  });

  test("has no axe violations (WCAG 2.2 AA) with every answer open", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator("#faq details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
  });

  test("fits a 390px phone without sideways scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PAGE);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.locator('[data-testid="memorial-drives"]')).toBeVisible();
  });
});
