// Town landing (money) pages, Growth M1 (#24 Parkersburg). Checks the search
// targeting, honesty rules (no unconfirmed price, no parked home), the per-home
// calls to action, the FAQ and its FAQPage schema, and accessibility.
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const STAY = "https://stay.mtcottages.com/";

const towns = [
  {
    path: "/parkersburg/index.html",
    alias: "/parkersburg/furnished-rentals/",
    // The stay-form town and the page's source slug (pageSlug in src/data/stay-link.ts).
    src: "parkersburg",
    // What the town "Check dates" CTAs pre-select on the stay form.
    cta: "location=parkersburg",
    townPattern: /Parkersburg, WV/,
    // Priority-1 rows in docs/marketing/keyword-universe.csv, phrased the way the lede reads.
    ledePhrases: [/furnished apartment/i, /monthly rental/i, /short-term rental/i, /Parkersburg, WV/],
    homes: [
      { id: "broad", name: "Broad Cottage", href: "/parkersburg/broad-cottage/" },
      { id: "buck", name: "Buck Cottage", href: "/parkersburg/buck-cottage/" },
      { id: "oak", name: "Oak Cottage", href: "/parkersburg/oak-cottage/" },
    ],
    parked: ["yellow-cottage", "walnut-cottage"],
    hubs: ["/travel-nurses/", "/corporate-housing/", "/family-stays.html", "/insurance-housing/"],
    pricedHomes: [],
    linkedFrom: ["/locations.html", "/parkersburg/broad-cottage/", "/parkersburg/oak-cottage/"],
  },
  {
    path: "/marietta/index.html",
    alias: "/marietta/furnished-rentals/",
    src: "marietta",
    // Frederick is the only Marietta home, so the town CTAs ask about it directly.
    cta: "property=frederick",
    townPattern: /Marietta, Ohio/,
    ledePhrases: [/furnished apartment/i, /monthly rental/i, /short-term rental/i, /Marietta, Ohio/],
    homes: [{ id: "frederick", name: "Frederick Cottage", href: "/marietta/frederick/" }],
    parked: ["yellow-cottage", "walnut-cottage"],
    hubs: ["/travel-nurses/", "/corporate-housing/", "/family-stays.html", "/insurance-housing/"],
    // Frederick's monthly guide is owner-confirmed (notes/owner-decisions.md).
    pricedHomes: ["frederick"],
    linkedFrom: ["/locations.html", "/marietta/frederick/"],
    // Plain "marietta" searches belong to Marietta, Georgia; this page targets Ohio only.
    notGeorgia: true,
  },
  {
    path: "/ravenswood/index.html",
    alias: "/ravenswood/furnished-rentals/",
    src: "ravenswood",
    cta: "location=ravenswood",
    townPattern: /Ravenswood, WV/,
    ledePhrases: [/furnished apartment/i, /monthly rental/i, /short-term rental/i, /Ravenswood, WV/, /Constellium/, /Jackson General Hospital in Ripley/, /I-77/],
    homes: [
      { id: "henrietta", name: "Henrietta Cottage", href: "/ravenswood/henrietta-cottage/" },
      { id: "virginia", name: "Virginia Cottage", href: "/ravenswood/virginia-cottage/" },
    ],
    // Walnut is parked (CEO decision 2026-11-14) and is never named on the page (#41).
    parked: ["yellow-cottage", "walnut-cottage"],
    neverNamed: /Walnut Cottage/i,
    hubs: ["/travel-nurses/", "/corporate-housing/", "/family-stays.html", "/insurance-housing/"],
    pricedHomes: [],
    linkedFrom: ["/locations.html", "/travel-nurses/jackson-general/"],
  },
];

const jsonLd = async (page) => {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((block) => {
    const parsed = JSON.parse(block);
    return Array.isArray(parsed) ? parsed : [parsed];
  });
};

for (const town of towns) {
  test.describe(`town landing ${town.path}`, () => {
    test("targets the town's furnished-rental searches in the title, H1 and first paragraph", async ({ page, request }) => {
      const response = await page.goto(town.path);
      expect(response.ok()).toBeTruthy();
      const title = await page.title();
      expect(title.length, `title "${title}" is longer than 60 characters`).toBeLessThanOrEqual(60);
      expect(title).toMatch(town.townPattern);
      expect(title).toMatch(/furnished rentals/i);
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description.length).toBeGreaterThan(70);
      expect(description.length).toBeLessThanOrEqual(160);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText(town.townPattern);
      await expect(page.locator("h1")).toContainText(/furnished rentals/i);
      // The first paragraph of body copy is the one straight after the H1.
      const lede = (await page.locator("main h1 + p").textContent()) ?? "";
      for (const phrase of town.ledePhrases) expect(lede, `first paragraph should mention ${phrase}`).toMatch(phrase);
      // Astro writes the directory form (/parkersburg/); the sitemap lists the same URL.
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect([`https://mtcottages.com${town.path}`, `https://mtcottages.com${town.path.replace(/index\.html$/, "")}`]).toContain(canonical);
      const sitemap = await (await request.get("/sitemap.xml")).text();
      expect(sitemap, "the landing page is in the sitemap under its canonical").toContain(`<loc>${canonical}</loc>`);
    });

    test("lists each live home with its own site link and a prefilled inquiry, and no parked home", async ({ page }) => {
      await page.goto(town.path);
      const cards = page.locator("#homes [data-home]");
      await expect(cards).toHaveCount(town.homes.length);
      for (const home of town.homes) {
        const card = page.locator(`#homes [data-home="${home.id}"]`);
        await expect(card.getByRole("heading", { level: 3 })).toHaveText(home.name);
        await expect(card.getByRole("link", { name: `Explore ${home.name}` })).toHaveAttribute("href", home.href);
        await expect(card.getByRole("link", { name: `Ask about ${home.name}` })).toHaveAttribute("href", `${STAY}?property=${home.id}&src=${town.src}`);
        // A real description, not a bare file name or a blank: at least 10 characters with a word in them.
        await expect(card.locator("img")).toHaveAttribute("alt", /^(?=.*\w{3}).{10,}$/);
      }
      const hrefs = await page.locator("main a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
      for (const parked of town.parked) expect(hrefs.some((href) => href.includes(parked)), `${parked} must not be listed`).toBe(false);
      if (town.neverNamed) expect((await page.locator("main").textContent()) ?? "").not.toMatch(town.neverNamed);
      const townCtas = page.locator("main").getByRole("link", { name: /^Check dates (in|at) / });
      expect(await townCtas.count()).toBeGreaterThanOrEqual(2);
      for (const href of await townCtas.evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
        expect(href).toBe(`${STAY}?${town.cta}&src=${town.src}`);
      }
    });

    test("shows no price that the owner has not confirmed", async ({ page }) => {
      await page.goto(town.path);
      const main = (await page.locator("main").textContent()) ?? "";
      if (town.pricedHomes.length === 0) expect(main).not.toMatch(/\$\s?\d/);
      for (const home of town.homes) {
        const price = page.locator(`#homes [data-home="${home.id}"] .tl-price`);
        if (town.pricedHomes.includes(home.id)) await expect(price).toContainText(/\$\d[\d,]*\/month/);
        else await expect(price).toHaveText(/confirm on inquiry/i);
      }
    });

    if (town.notGeorgia) {
      test("targets Ohio, never Marietta, Georgia, in the title, description, H1 and lede", async ({ page }) => {
        await page.goto(town.path);
        const targeted = [
          await page.title(),
          (await page.locator('meta[name="description"]').getAttribute("content")) ?? "",
          (await page.locator("h1").textContent()) ?? "",
          (await page.locator("main h1 + p").textContent()) ?? "",
        ];
        for (const text of targeted) {
          expect(text).not.toMatch(/Georgia|\bGA\b|Atlanta|Cobb/);
          // Every "Marietta" in the targeted text is the Ohio one.
          expect(text.match(/Marietta(?!,? (Ohio|OH|Memorial|College))/g) ?? [], `bare Marietta in "${text}"`).toEqual([]);
        }
      });
    }

    test("links the audience hubs, including the travel-nurse hub, and is linked from related pages", async ({ page, request }) => {
      await page.goto(town.path);
      for (const hub of town.hubs) await expect(page.locator(`main a[href="${hub}"]`)).toHaveCount(1);
      for (const source of town.linkedFrom) {
        const html = await (await request.get(source)).text();
        expect(html, `${source} should link to ${town.path}`).toContain(`href="${town.path}"`);
      }
    });

    test("measured drive times carry their source", async ({ page }) => {
      await page.goto(town.path);
      const table = page.locator("#distances table");
      await expect(table.locator("tbody tr")).toHaveCount(town.homes.length);
      await expect(table.locator("thead th").nth(1)).toContainText(/\S/);
      await expect(page.locator("#distances")).toContainText(/OpenStreetMap/);
      await expect(page.locator("#distances")).toContainText(/measured/i);
    });

    test("the FAQ is native, keyboard operable, and matches its FAQPage schema word for word", async ({ page }) => {
      await page.goto(town.path);
      const questions = page.locator("#faq details");
      const count = await questions.count();
      expect(count).toBeGreaterThanOrEqual(4);
      const visible = [];
      for (let index = 0; index < count; index += 1) {
        const item = questions.nth(index);
        visible.push({ q: ((await item.locator("summary").textContent()) ?? "").trim(), a: ((await item.locator("p").textContent()) ?? "").trim() });
      }
      const faqPage = (await jsonLd(page)).find((node) => node["@type"] === "FAQPage");
      expect(faqPage, "FAQPage JSON-LD").toBeTruthy();
      expect(faqPage.mainEntity.map((entry) => ({ q: entry.name, a: entry.acceptedAnswer.text }))).toEqual(visible);
      // No answer may quote a price unless the town's home has an owner-confirmed one.
      for (const { a } of visible) {
        expect(a).not.toMatch(/30\+ days/);
        if (town.pricedHomes.length === 0) expect(a).not.toMatch(/\$\s?\d/);
      }

      const first = questions.first().locator("summary");
      await first.focus();
      await page.keyboard.press("Enter");
      await expect(questions.first()).toHaveAttribute("open", "");
      await expect(questions.first().locator("p")).toBeVisible();
    });

    test("has no axe violations (WCAG 2.2 AA)", async ({ page }) => {
      await page.goto(town.path);
      // Open every answer so collapsed content is checked too.
      await page.locator("#faq details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
    });

    test("the keyword-map path redirects to the town page instead of competing with it", async ({ page, request }) => {
      const html = await (await request.get(town.alias)).text();
      // Astro's redirect page: a meta refresh plus a canonical pointing at the town page.
      expect(html).toContain(`https://mtcottages.com${town.path}`);
      expect(html).toMatch(/http-equiv="?refresh/i);
      await page.goto(town.alias);
      await expect(page).toHaveURL(new RegExp(`${town.path.replace(/\./g, "\\.")}$`));
      const sitemap = await (await request.get("/sitemap.xml")).text();
      expect(sitemap).not.toContain(`https://mtcottages.com${town.alias}`);
    });
  });
}
