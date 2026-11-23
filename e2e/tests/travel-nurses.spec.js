// Travel-nurse hub (#29): /travel-nurses/ targets persona P1 (docs/marketing/brand-and-positioning.md).
// Checks the search targeting, the measured hospital drives, the cited GSA per diem and its chart with
// a table fallback, the honesty rules (no unconfirmed promise, no affiliation claim), the prefilled
// inquiry that never submits, the FAQ and its FAQPage schema, the /health-professionals.html redirect
// stub, and accessibility.
const fs = require("node:fs");
const path = require("node:path");
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { stubStayHost } = require("./support/stay-host");

const HUB = "/travel-nurses/";
const STAY = "https://stay.mtcottages.com/";
const ORIGIN = "https://mtcottages.com";
const STAY_HREF = `${STAY}?audience=healthcare&src=travel-nurses`;

// The measured drives behind every minute the page prints (#25, #26).
const distances = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "_data", "distances.json"), "utf8"));
const measured = (origin, destination) => {
  const row = distances.rows.find((entry) => entry.origin === origin && entry.destination === destination);
  if (!row) throw new Error(`_data/distances.json has no ${origin} to ${destination} row`);
  return row;
};

// Rates as src/data/terms.json publishes them (#72): Broad and Oak carry their Furnished Finder rates (#70);
// the rest are on the bedroom-count guide.
const homes = [
  { id: "broad", name: "Broad Cottage", href: "/parkersburg/broad-cottage/", price: "$1,875", confirmed: true },
  { id: "buck", name: "Buck Cottage", href: "/parkersburg/buck-cottage/", price: "$1,895", confirmed: false },
  { id: "oak", name: "Oak Cottage", href: "/parkersburg/oak-cottage/", price: "$2,585", confirmed: true },
  { id: "frederick", name: "Frederick Cottage", href: "/marietta/frederick/index.html", price: "$2,575", confirmed: false },
  { id: "virginia", name: "Virginia Cottage", href: "/ravenswood/virginia-cottage/", price: "$2,295", confirmed: false },
  { id: "henrietta", name: "Henrietta Cottage", href: "/ravenswood/henrietta-cottage/", price: "$2,295", confirmed: false },
];

const jsonLd = async (page) => {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((block) => {
    const parsed = JSON.parse(block);
    return Array.isArray(parsed) ? parsed : [parsed];
  });
};

const canonicalOf = (html) => html.match(/<link[^>]+rel="canonical"[^>]*>/i)?.[0].match(/href="([^"]+)"/i)?.[1];

test.describe("travel-nurse hub /travel-nurses/", () => {
  test("targets travel nurse housing in the title, description, H1 and first paragraph", async ({ page, request }) => {
    const response = await page.goto(HUB);
    expect(response.ok()).toBeTruthy();
    const title = await page.title();
    expect(title.length, `title "${title}" is longer than 60 characters`).toBeLessThanOrEqual(60);
    expect(title).toMatch(/travel nurse housing/i);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description.length).toBeGreaterThan(70);
    expect(description.length).toBeLessThanOrEqual(160);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText(/travel nurse housing/i);
    await expect(page.locator("h1")).toContainText(/Parkersburg, WV/);
    await expect(page.locator("h1")).toContainText(/Marietta, Ohio/);
    const lede = (await page.locator("main h1 + p").textContent()) ?? "";
    for (const hospital of [/Camden Clark/, /Marietta Memorial/, /Jackson General/]) expect(lede).toMatch(hospital);
    // Every mention of Marietta in the targeted text is the Ohio one, never Georgia.
    for (const text of [title, description, lede, (await page.locator("h1").textContent()) ?? ""]) {
      expect(text).not.toMatch(/Georgia|\bGA\b|Atlanta|Cobb/);
      expect(text.match(/Marietta(?!,? (Ohio|OH|Memorial|College))/g) ?? [], `bare Marietta in "${text}"`).toEqual([]);
    }
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect([`${ORIGIN}${HUB}`, `${ORIGIN}${HUB}index.html`]).toContain(canonical);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap, "the hub is in the sitemap under its canonical").toContain(`<loc>${canonical}</loc>`);
  });

  test("is linked from the home page and from the Parkersburg and Marietta town pages", async ({ page, request }) => {
    for (const source of ["/", "/parkersburg/index.html", "/marietta/index.html"]) {
      const html = await (await request.get(source)).text();
      expect(html, `${source} should link to ${HUB}`).toContain(`href="${HUB}"`);
      expect(html, `${source} must not link to the retired guide`).not.toContain("health-professionals");
    }
    await page.goto("/");
    expect(await page.locator(`[data-audience-router] a[href="${HUB}"]`).count()).toBeGreaterThanOrEqual(1);
    // The Living menu lists the hub too, on every page.
    await expect(page.locator(`.site-header a[href="${HUB}"]`).first()).toHaveText(/Travel nurses/);
  });

  test("lists the three hospitals with drive minutes taken from the measured data", async ({ page, request }) => {
    await page.goto(HUB);
    const cards = page.locator("#hospitals [data-hospital]");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText("WVU Medicine Camden Clark Medical Center");
    await expect(cards.nth(0)).toContainText("Parkersburg, West Virginia");
    await expect(cards.nth(1)).toContainText("Marietta Memorial Hospital");
    await expect(cards.nth(1)).toContainText("Marietta, Ohio");
    await expect(cards.nth(1)).toContainText("Selby General Hospital");
    await expect(cards.nth(2)).toContainText("WVU Medicine Jackson General Hospital");
    await expect(cards.nth(2)).toContainText("Ripley, West Virginia");
    // Each printed drive is the measured one (never typed by hand): [hospital card, home id, destination id].
    const drives = [
      ["camden-clark", "broad", "camden-clark"],
      ["camden-clark", "oak", "camden-clark"],
      ["memorial-health", "frederick", "marietta-memorial"],
      ["memorial-health", "frederick", "selby-general"],
      ["jackson-general", "henrietta", "jackson-general"],
    ];
    for (const [card, home, destination] of drives) {
      const row = measured(home, destination);
      const campus = page.locator(`#hospitals [data-hospital="${card}"] li[data-home="${home}"]`);
      const line = campus.filter({ hasText: `${row.minutes} min` });
      await expect(line.first(), `${home} to ${destination}: ${row.minutes} min`).toContainText(`${row.miles.toFixed(1)} mi`);
    }
    // The source and date of the measurements are on the page.
    await expect(page.locator('[data-testid="drive-source"]')).toContainText(/OpenStreetMap/);
    await expect(page.locator('[data-testid="drive-source"]')).toContainText(/measured \d{1,2} \w{3} 20\d\d/);
    // Each hospital links to a page that exists.
    for (const href of await cards.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
      expect((await request.get(href)).status(), `${href} status`).toBe(200);
    }
    // Only hospitals with their own landing page link one, from their own card: Camden Clark (#32), Memorial (#33) and Jackson General (#45). No placeholder promises others.
    const main = (await page.locator("main").textContent()) ?? "";
    expect(main).not.toMatch(/hospital guides?|coming soon|\bTBD\b|lorem/i);
    const guides = page.locator('main a[href^="/travel-nurses/"][href$="/"]:not([href="/travel-nurses/"])');
    await expect(guides).toHaveCount(3);
    await expect(page.locator('#hospitals [data-hospital="memorial-health"] a[data-hospital-guide]')).toHaveAttribute("href", "/travel-nurses/memorial-health-marietta/");
    await expect(page.locator('#hospitals [data-hospital="camden-clark"] a[data-hospital-guide]')).toHaveAttribute("href", "/travel-nurses/camden-clark/");
    await expect(page.locator('#hospitals [data-hospital="jackson-general"] a[data-hospital-guide]')).toHaveAttribute("href", "/travel-nurses/jackson-general/");
    await expect(cards.nth(0).locator('a[href="/travel-nurses/camden-clark/"]')).toHaveCount(1);
  });

  test("cites the GSA lodging per diem with its fiscal year, rate, counties and source links", async ({ page }) => {
    await page.goto(HUB);
    const panel = page.locator('[data-testid="per-diem"]');
    await expect(panel).toContainText("FY2027");
    await expect(page.locator('[data-testid="per-diem-rate"]')).toHaveText("$113");
    await expect(panel).toContainText("October 1, 2026 to September 30, 2027");
    await expect(panel).toContainText("$3,390");
    const counties = page.locator('[data-testid="per-diem-counties"]');
    await expect(counties).toContainText("Wood County, West Virginia");
    await expect(counties).toContainText("Washington County, Ohio");
    await expect(panel).toContainText(/standard rate/i);
    const links = page.locator('[data-testid="per-diem-sources"] a');
    expect(await links.count()).toBeGreaterThanOrEqual(2);
    const hrefs = await links.evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href")));
    for (const href of hrefs) expect(href).toMatch(/^https:\/\/www\.gsa\.gov\//);
    expect(hrefs).toContain("https://www.gsa.gov/travel/plan-book/per-diem-rates");
    // The framing is honest: a reference, not a promise, and not tax advice.
    const stipend = (await page.locator("#stipend").textContent()) ?? "";
    expect(stipend).toMatch(/reference, not a promise/i);
    expect(stipend).toMatch(/not tax advice/i);
    expect(stipend).toMatch(/agency sets your stipend/i);
  });

  test("the stipend chart has an accessible name, a matching data table, and labelled guide prices", async ({ page }) => {
    await page.goto(HUB);
    const chart = page.locator('[data-testid="stipend-chart"] [role="img"]');
    await expect(chart).toHaveCount(1);
    const label = (await chart.getAttribute("aria-label")) ?? "";
    expect(label).toMatch(/FY2027/);
    expect(label).toContain("$113");
    expect(label).toContain("$3,390");
    for (const home of homes) expect(label, `chart name lists ${home.name}`).toContain(`${home.name} ${home.price}`);
    // One bar for the per diem and one per home, and the table repeats the same figures.
    await expect(chart.locator(".tn-bar")).toHaveCount(homes.length + 1);
    const table = page.locator('[data-testid="stipend-table"]');
    await expect(table.locator("caption")).toHaveCount(1);
    await expect(table.locator("tbody tr")).toHaveCount(homes.length + 1);
    await expect(table.locator("tr.tn-row-ref")).toContainText("$3,390");
    for (const home of homes) {
      const row = table.locator(`tr[data-home="${home.id}"]`);
      await expect(row.locator("th")).toHaveText(home.name);
      await expect(row.locator("td").nth(0)).toHaveText(home.price);
      await expect(row.locator("td").nth(1)).toContainText(/\$[\d,]+ below/);
      if (home.confirmed) await expect(row.locator("td").nth(2)).toHaveText("Monthly rate");
      else await expect(row.locator("td").nth(2)).toHaveText(/guide price, confirm on inquiry/i);
      // The price is the same one the home's own card shows.
      await expect(page.locator(`.tn-card[data-home="${home.id}"] .property-price`)).toHaveText(`${home.price}/month${home.confirmed ? "" : " guide"}`);
    }
    // The bar widths are proportional: the per diem is the longest and no guide price exceeds it.
    const shares = await chart.locator(".tn-bar-fill").evaluateAll((fills) => fills.map((fill) => Number.parseFloat(fill.style.getPropertyValue("--share"))));
    expect(shares[0]).toBe(100);
    for (const share of shares.slice(1)) expect(share).toBeLessThan(100);
  });

  test("states 13-week terms only as far as they are confirmed", async ({ page }) => {
    await page.goto(HUB);
    await expect(page.locator('[data-testid="terms-stated"]')).toContainText("one-month minimum stay");
    await expect(page.locator('[data-testid="terms-stated"]')).toContainText("Utilities are included");
    await expect(page.locator('[data-testid="terms-stated"]')).toContainText("No pets");
    await expect(page.locator("#terms")).toContainText(/ask about 13-week stays/i);
    const confirm = page.locator('[data-testid="terms-confirm"] li');
    expect(await confirm.count()).toBeGreaterThanOrEqual(5);
    await expect(page.locator('[data-testid="terms-confirm"]')).toContainText(/security deposit/i);
    // No promise ops has not confirmed: reply times, guarantees, pet permissions, stays under a month.
    const main = (await page.locator("main").textContent()) ?? "";
    expect(main).not.toMatch(/guarantee|within \d+ (hours?|minutes?|days?)|same[- ]day|pets? (are )?(welcome|allowed)|pet[- ]friendly|no minimum|week[- ]to[- ]week/i);
    expect(main).not.toMatch(/more than 10 years/i);
  });

  test("follows the brand voice and never prints a street address", async ({ page }) => {
    await page.goto(HUB);
    const main = (await page.locator("main").textContent()) ?? "";
    expect(main).not.toMatch(/\b(luxury|world-class|paradise|best-in-class|hidden gem|only \d+ left)\b|!/i);
    expect(main).not.toMatch(/\b\d{2,5} [A-Z][a-z]+ (St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd)\b/);
    expect(main).not.toMatch(/Yellow|Walnut/);
  });

  test("lists the live homes with links to their own sites and the town pages", async ({ page, request }) => {
    await page.goto(HUB);
    const cards = page.locator("#homes .tn-card");
    await expect(cards).toHaveCount(homes.length);
    for (const home of homes) {
      const card = page.locator(`#homes .tn-card[data-home="${home.id}"]`);
      await expect(card.getByRole("heading", { level: 3 })).toHaveText(home.name);
      await expect(card.getByRole("link", { name: home.name }).first()).toHaveAttribute("href", home.href);
      // A real description, not a bare file name or a blank: at least 10 characters with a word in them.
      await expect(card.locator("img")).toHaveAttribute("alt", /^(?=.*\w{3}).{10,}$/);
      expect((await request.get(home.href)).status(), `${home.href} status`).toBe(200);
    }
    for (const town of ["/parkersburg/index.html", "/marietta/index.html", "/ravenswood/index.html"]) {
      expect(await page.locator(`main a[href="${town}"]`).count(), `${town} is linked`).toBeGreaterThanOrEqual(1);
    }
  });

  test("the inquiry links pre-fill the healthcare audience and open the stay form without submitting", async ({ page, context }) => {
    // Never submit a real application: the stay host is stubbed, and any non-GET request fails the test.
    const methods = await stubStayHost(context, STAY);
    await page.goto(HUB);
    const hero = page.locator('main [data-cta="hero"] a.button').first();
    await expect(hero).toHaveAttribute("href", STAY_HREF);
    await expect(page.locator('main [data-cta="next-step"]')).toHaveAttribute("href", STAY_HREF);
    // Every stay link on the page, header and footer included, carries the audience and this page as its source.
    const hrefs = await page.locator(`a[href^="${STAY}"]`).evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThanOrEqual(4);
    for (const href of hrefs) expect(href).toBe(STAY_HREF);
    // No form lives on this page, and the audience value is one the stay form accepts.
    await expect(page.locator("main form")).toHaveCount(0);
    const form = fs.readFileSync(path.join(__dirname, "..", "..", "infra", "azure", "apply-proxy", "index.html"), "utf8");
    expect(form).toMatch(/healthcare: "healthcare"/);
    await hero.click();
    await expect(page).toHaveURL(STAY_HREF);
    expect(methods.every((method) => method === "GET"), `stay requests were ${methods.join(", ")}`).toBe(true);
  });

  test("answers the objections in native disclosures that match the FAQPage schema word for word", async ({ page }) => {
    await page.goto(HUB);
    const questions = page.locator("#faq details");
    const count = await questions.count();
    expect(count).toBeGreaterThanOrEqual(6);
    const visible = [];
    for (let index = 0; index < count; index += 1) {
      const item = questions.nth(index);
      visible.push({ q: ((await item.locator("summary").textContent()) ?? "").trim(), a: ((await item.locator("p").textContent()) ?? "").trim() });
    }
    const text = visible.map(({ q }) => q).join("\n");
    for (const topic of [/stipend/i, /13-week/i, /quiet/i, /utilities and Wi-Fi/i, /park/i, /scam/i]) expect(text).toMatch(topic);
    const faqPage = (await jsonLd(page)).find((node) => node["@type"] === "FAQPage");
    expect(faqPage, "FAQPage JSON-LD").toBeTruthy();
    expect(faqPage.mainEntity.map((entry) => ({ q: entry.name, a: entry.acceptedAnswer.text }))).toEqual(visible);
    // The scam answer only claims what the rest of the site says.
    const scam = visible.find(({ q }) => /scam/i.test(q)).a;
    expect(scam).toMatch(/no payment/i);
    expect(scam).toMatch(/never email card numbers/i);
    expect(scam).not.toMatch(/wire/i);
    const first = questions.first().locator("summary");
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(questions.first()).toHaveAttribute("open", "");
    await expect(questions.first().locator("p")).toBeVisible();
  });

  test("publishes the typed business, FAQ and breadcrumb structured data, and no rating or price markup", async ({ page }) => {
    await page.goto(HUB);
    const nodes = await jsonLd(page);
    const types = nodes.map((node) => node["@type"]).sort();
    expect(types).toEqual(["BreadcrumbList", "FAQPage", "LodgingBusiness"]);
    const crumbs = nodes.find((node) => node["@type"] === "BreadcrumbList");
    expect(crumbs.itemListElement.map((item) => item.name)).toEqual(["Home", "Travel nurses"]);
    expect(crumbs.itemListElement.at(-1).item).toBe(`${ORIGIN}${HUB}`);
    expect(JSON.stringify(nodes)).not.toMatch(/aggregateRating|"review"|"offers"|priceRange/);
  });

  test("the no-affiliation disclaimer is present and names the health systems", async ({ page }) => {
    await page.goto(HUB);
    const disclaimer = page.locator('[data-testid="disclaimer"]');
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText(/not affiliated with, endorsed by or sponsored by/i);
    await expect(disclaimer).toContainText("WVU Medicine");
    await expect(disclaimer).toContainText("Memorial Health System");
  });

  test("has no axe violations (WCAG 2.2 AA) with every answer open", async ({ page }) => {
    await page.goto(HUB);
    await page.locator("#faq details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
  });

  test("fits a 390px phone without sideways scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(HUB);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.locator('[data-testid="stipend-chart"] .tn-bar').first()).toBeVisible();
  });
});

test.describe("retired guide /health-professionals.html", () => {
  test("is a noindex redirect stub to the hub, with a visible link, and stays out of the sitemap", async ({ page, request }) => {
    const response = await request.get("/health-professionals.html");
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toMatch(/<meta[^>]+http-equiv="refresh"[^>]+content="0;url=\/travel-nurses\/"/i);
    expect(html).toMatch(/<meta[^>]+name="robots"[^>]+noindex/i);
    expect(canonicalOf(html)).toBe(`${ORIGIN}${HUB}`);
    expect(html.match(/<link[^>]+rel="canonical"/gi) ?? []).toHaveLength(1);
    expect(html).toContain(`<a href="${HUB}">`);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("health-professionals");
    await page.goto("/health-professionals.html");
    await expect(page).toHaveURL(new RegExp(`${HUB}$`));
    await expect(page.locator("h1")).toContainText(/travel nurse housing/i);
  });
});
