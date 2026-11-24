// Corporate and project-crew hub (#34): /corporate-housing/ targets persona P2 (docs/marketing/brand-and-positioning.md).
// Checks the search targeting, the crew-capacity table against each home's own data, the drive chart and
// its table against _data/distances.json, the company-paid process and terms against src/data/terms.json,
// the honesty rules (no invoicing promise, no affiliation claim, nothing unconfirmed stated), the prefilled
// inquiry that never submits, the FAQ and its FAQPage schema, the /work-relocation.html redirect stub, and
// accessibility.
const fs = require("node:fs");
const path = require("node:path");
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { stubStayHost } = require("./support/stay-host");

const HUB = "/corporate-housing/";
const STAY = "https://stay.mtcottages.com/";
const ORIGIN = "https://mtcottages.com";
const STAY_HREF = `${STAY}?audience=crew&src=corporate-housing`;
const CONFIRM = "Confirm on inquiry";

const root = path.join(__dirname, "..", "..");
const readJson = (...parts) => JSON.parse(fs.readFileSync(path.join(root, ...parts), "utf8"));

// The measured drives behind every minute the page prints (#25, #26).
const distances = readJson("_data", "distances.json");
// Rates and terms as src/data/terms.json publishes them (#72).
const terms = readJson("src", "data", "terms.json").homes;
// The portfolio's own bedroom counts (_data/houses.json), keyed by home name.
const houses = Object.values(readJson("_data", "houses.json"));
const bedroomsOf = (name) => {
  const house = houses.find((entry) => entry.name === name);
  if (!house) throw new Error(`_data/houses.json has no ${name}`);
  return house.bedrooms;
};

const homes = [
  { id: "frederick", name: "Frederick Cottage", href: "/marietta/frederick/" },
  { id: "broad", name: "Broad Cottage", href: "/parkersburg/broad-cottage/" },
  { id: "buck", name: "Buck Cottage", href: "/parkersburg/buck-cottage/" },
  { id: "oak", name: "Oak Cottage", href: "/parkersburg/oak-cottage/" },
  { id: "virginia", name: "Virginia Cottage", href: "/ravenswood/virginia-cottage/" },
  { id: "henrietta", name: "Henrietta Cottage", href: "/ravenswood/henrietta-cottage/" },
];
// The table lists the homes with the most bedrooms first, then by name.
const tableOrder = [...homes].sort((a, b) => bedroomsOf(b.name) - bedroomsOf(a.name) || a.name.localeCompare(b.name));

const crewDestinations = ["chemours-washington-works", "constellium-ravenswood", "i77-parkersburg", "i77-ravenswood", "i77-marietta"];
const addressOrigins = Object.entries(distances.origins).filter(([, origin]) => origin.kind === "address").map(([id]) => id);
const expectedDrives = distances.rows.filter((row) => addressOrigins.includes(row.origin) && crewDestinations.includes(row.destination));

const jsonLd = async (page) => {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((block) => {
    const parsed = JSON.parse(block);
    return Array.isArray(parsed) ? parsed : [parsed];
  });
};

const canonicalOf = (html) => html.match(/<link[^>]+rel="canonical"[^>]*>/i)?.[0].match(/href="([^"]+)"/i)?.[1];

// A home's key facts as its own page prints them: label to { value, confirmed }.
const keyFacts = async (page, href) => {
  await page.goto(href);
  return page.locator(".hm-facts .hm-fact").evaluateAll((items) =>
    Object.fromEntries(items.map((item) => [
      item.querySelector("dt")?.textContent?.trim() ?? "",
      { value: item.querySelector(".hm-fact-value")?.textContent?.trim() ?? "", confirmed: !item.classList.contains("hm-fact--confirm") },
    ])));
};

test.describe("corporate and crew hub /corporate-housing/", () => {
  test("targets corporate and crew housing in the title, description, H1 and first paragraph", async ({ page, request }) => {
    const response = await page.goto(HUB);
    expect(response.ok()).toBeTruthy();
    const title = await page.title();
    expect(title.length, `title "${title}" is longer than 60 characters`).toBeLessThanOrEqual(60);
    expect(title).toMatch(/corporate (&|and) crew housing/i);
    expect(title).toMatch(/Parkersburg WV/);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description.length).toBeGreaterThan(70);
    expect(description.length).toBeLessThanOrEqual(160);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText(/corporate and crew housing/i);
    await expect(page.locator("h1")).toContainText(/Parkersburg, WV/);
    await expect(page.locator("h1")).toContainText(/Ravenswood, WV/);
    await expect(page.locator("h1")).toContainText(/Marietta, Ohio/);
    const lede = (await page.locator('[data-testid="hub-lede"]').textContent()) ?? "";
    for (const place of [/Parkersburg, WV/, /Ravenswood, WV/, /Marietta, Ohio/, /whole furnished homes/i, /point of contact/i]) expect(lede).toMatch(place);
    // Every mention of Marietta in the targeted text is the Ohio one, never Georgia.
    for (const text of [title, description, lede, (await page.locator("h1").textContent()) ?? ""]) {
      expect(text).not.toMatch(/Georgia|\bGA\b|Atlanta|Cobb/);
      expect(text.match(/Marietta(?!,? (Ohio|OH|Memorial|College))/g) ?? [], `bare Marietta in "${text}"`).toEqual([]);
    }
    const hero = (await page.locator(".tl-hero").textContent()) ?? "";
    expect(hero.match(/Marietta(?!,? (Ohio|OH|Memorial|College))/g) ?? [], "bare Marietta in the hero").toEqual([]);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect([`${ORIGIN}${HUB}`, `${ORIGIN}${HUB}index.html`]).toContain(canonical);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap, "the hub is in the sitemap under its canonical").toContain(`<loc>${canonical}</loc>`);
    // The hero is a real portfolio photo with a real description.
    const photo = page.locator(".hero-image-frame img");
    await expect(photo).toHaveAttribute("src", /\/_astro\//);
    await expect(photo).toHaveAttribute("alt", /Frederick Cottage/);
  });

  test("is linked from the home page, the town pages and the Living menu, and the retired guide is linked nowhere", async ({ page, request }) => {
    for (const source of ["/", "/parkersburg/index.html", "/marietta/index.html", "/ravenswood/index.html", "/travel-nurses/"]) {
      const html = await (await request.get(source)).text();
      expect(html, `${source} should link to ${HUB}`).toContain(`href="${HUB}"`);
      expect(html, `${source} must not link to the retired guide`).not.toContain("work-relocation");
    }
    // A town page's own audience list carries it, beyond the menu every page has.
    const parkersburg = await (await request.get("/parkersburg/index.html")).text();
    expect(parkersburg).toMatch(/class="[^"]*tl-audience[^"]*"[\s\S]*href="\/corporate-housing\/"/);
    await page.goto("/");
    expect(await page.locator(`[data-audience-router] a[href="${HUB}"]`).count()).toBeGreaterThanOrEqual(1);
    await expect(page.locator(`.site-header a[href="${HUB}"]`).first()).toHaveText(/Corporate & crew housing/);
  });

  test("the crew-capacity table equals each home's own data and says Confirm on inquiry where the data does not", async ({ page }) => {
    await page.goto(HUB);
    const table = page.locator('[data-testid="capacity-table"]');
    await expect(table.locator("caption")).toHaveCount(1);
    await expect(table.locator("thead th")).toHaveText(["Home", "Bedrooms", "Beds and sleeps", "Parking", "Laundry", "Wi-Fi and internet"]);
    await expect(table.locator("tbody tr")).toHaveCount(homes.length);
    // Rows run most bedrooms first.
    const rowIds = await table.locator("tbody tr").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-home")));
    expect(rowIds).toEqual(tableOrder.map((home) => home.id));

    // What each home's own page prints, read before the table is compared with it.
    const facts = {};
    for (const home of homes) facts[home.id] = await keyFacts(page, home.href);
    await page.goto(HUB);

    for (const home of homes) {
      const row = table.locator(`tbody tr[data-home="${home.id}"]`);
      const own = facts[home.id];
      // The name links to the home's own site.
      await expect(row.locator("th a")).toHaveText(home.name);
      await expect(row.locator("th a")).toHaveAttribute("href", home.href);
      // Bedrooms: the portfolio file, the home's own Bedrooms fact and the table agree.
      const bedrooms = bedroomsOf(home.name);
      await expect(row.locator('[data-cell="bedrooms"]')).toHaveText(String(bedrooms));
      expect(Number.parseInt(own.Bedrooms.value, 10), `${home.name} Bedrooms fact`).toBe(bedrooms);
      // Beds and sleeps.
      const sleeps = row.locator('[data-cell="sleeps"]');
      if (own.Sleeps?.confirmed) {
        await expect(sleeps).toContainText(`Sleeps ${own.Sleeps.value}`);
        await expect(sleeps).toHaveAttribute("data-confirmed", "yes");
      } else {
        await expect(sleeps).toContainText(CONFIRM);
        await expect(sleeps).toHaveAttribute("data-confirmed", "no");
        await expect(sleeps).not.toContainText(/Sleeps \d/);
      }
      const beds = row.locator('[data-cell="beds"]');
      if (/[(,]/.test(own.Bedrooms.value)) {
        const detail = ((await beds.textContent()) ?? "").toLowerCase();
        expect(own.Bedrooms.value.toLowerCase(), `${home.name} bed types`).toContain(detail);
      } else {
        await expect(beds).toHaveCount(0);
      }
      // Parking, laundry and internet: the home's own value when it confirms, lists or photographs it, otherwise Confirm on inquiry.
      for (const [cell, label] of [["parking", "Parking"], ["laundry", "Laundry"], ["internet", "Internet"]]) {
        const td = row.locator(`[data-cell="${cell}"]`);
        const fact = own[label];
        if (fact?.confirmed) {
          await expect(td, `${home.name} ${label}`).toContainText(fact.value);
          await expect(td).toHaveAttribute("data-confirmed", "yes");
          await expect(td).not.toContainText(CONFIRM);
        } else {
          await expect(td, `${home.name} ${label}`).toHaveText(CONFIRM);
          await expect(td).toHaveAttribute("data-confirmed", "no");
        }
      }
    }
    // The note says how to read an unconfirmed cell.
    await expect(page.locator('[data-testid="capacity-note"]')).toContainText(/Confirm on inquiry/);
  });

  test("the drive chart has an accessible name and a table that repeats the measured minutes in _data/distances.json", async ({ page }) => {
    await page.goto(HUB);
    const chart = page.locator('[data-testid="drive-chart"] [role="img"]');
    await expect(chart).toHaveCount(1);
    const label = (await chart.getAttribute("aria-label")) ?? "";
    const table = page.locator('[data-testid="drive-table"]');
    await expect(table.locator("caption")).toHaveCount(1);
    expect(expectedDrives.length, "the data has crew drive rows").toBeGreaterThanOrEqual(9);
    await expect(table.locator("tbody tr")).toHaveCount(expectedDrives.length);
    await expect(chart.locator(".tn-bar")).toHaveCount(expectedDrives.length);
    // Only destinations the data holds: both plants and the three I-77 access points.
    const places = await table.locator("tbody tr").evaluateAll((rows) => [...new Set(rows.map((row) => row.getAttribute("data-place")))]);
    expect(places.sort()).toEqual([...crewDestinations].sort());
    for (const row of expectedDrives) {
      const homeName = homes.find((home) => home.id === row.origin).name;
      const line = table.locator(`tbody tr[data-place="${row.destination}"][data-home="${row.origin}"]`);
      await expect(line, `${row.origin} to ${row.destination}`).toHaveCount(1);
      await expect(line.locator('[data-cell="minutes"]')).toHaveText(`${row.minutes} min`);
      await expect(line.locator('[data-cell="miles"]')).toHaveText(`${row.miles.toFixed(1)} mi`);
      expect(label, `chart name lists ${homeName} ${row.minutes} minutes`).toContain(`${homeName} ${row.minutes} minutes`);
    }
    // Each destination's note comes from the data: the plant gate caveat is on the page.
    await expect(table).toContainText(distances.destinations["chemours-washington-works"].note);
    // Bar widths are proportional: the longest drive fills the track and no bar exceeds it.
    const longest = Math.max(...expectedDrives.map((row) => row.minutes));
    const bars = await chart.locator(".tn-bar").evaluateAll((items) => items.map((item) => ({
      share: Number.parseFloat(item.querySelector(".tn-bar-fill").style.getPropertyValue("--share")),
      minutes: Number.parseInt(item.querySelector(".tn-bar-value").textContent, 10),
    })));
    for (const bar of bars) expect(bar.share).toBeCloseTo(Math.max(4, (bar.minutes / longest) * 100), 0);
    expect(Math.max(...bars.map((bar) => bar.share))).toBe(100);
    // The source and date of the measurement are on the page, and a home with no approved address is not charted.
    await expect(page.locator('[data-testid="drive-source"]')).toContainText(/OpenStreetMap/);
    await expect(page.locator('[data-testid="drive-source"]')).toContainText(/measured \d{1,2} \w{3} 20\d\d/);
    await expect(page.locator('[data-testid="drive-gap"]')).toContainText(/Buck Cottage/);
    await expect(page.locator('[data-testid="drive-gap"]')).toContainText(/Virginia Cottage/);
    expect(await table.locator('tbody tr[data-home="buck"], tbody tr[data-home="virginia"]').count()).toBe(0);
  });

  test("explains company-paid stays from the #70 decision and promises no direct invoicing", async ({ page }) => {
    await page.goto(HUB);
    const section = page.locator("#company-paid");
    await expect(section.getByRole("heading", { level: 2, name: "How company-paid stays work" })).toBeVisible();
    const steps = page.locator('[data-testid="process-steps"] li');
    await expect(steps).toHaveCount(4);
    const text = (await section.textContent()) ?? "";
    expect(text).toMatch(/stay form/i);
    expect(text).toMatch(/KeyCheck/);
    expect(text).toMatch(/Furnished Finder/);
    expect(text).toMatch(/month to month/i);
    expect(text).toMatch(/three months paid/i);
    expect(text).toMatch(/hold no booking before payment/i);
    expect(text).toMatch(/company can pay through that same flow/i);
    // Terms read from src/data/terms.json: one-month minimum, utilities included, no pets, deposit set at booking.
    const stated = page.locator('[data-testid="terms-stated"]');
    await expect(stated).toContainText("one-month minimum stay");
    await expect(stated).toContainText("Utilities are included");
    await expect(stated).toContainText("No pets");
    await expect(stated).toContainText("security deposit is set at booking");
    for (const home of homes) {
      const entry = terms[home.id];
      expect(entry.utilities.value, `${home.id} utilities in terms.json`).toBe("Included");
      expect(entry.pets.value, `${home.id} pets in terms.json`).toBe("No pets");
      expect(entry.minimumStay.status, `${home.id} minimum stay in terms.json`).not.toBe("confirm");
    }
    // Nothing the owner has not decided: no company invoicing, net terms or purchase orders are offered.
    const main = (await page.locator("main").textContent()) ?? "";
    expect(main).not.toMatch(/\bwe (will )?invoice\b|net[- ]?(15|30|45|60)\b|invoices? (is|are) (sent|issued)|bill(ed|ing)? (your|the) company directly/i);
    await expect(page.locator('[data-testid="process-limits"]')).toContainText(/say so on your inquiry/i);
    await expect(page.locator('[data-testid="process-limits"]')).toContainText(/before you commit/i);
    expect(main).not.toMatch(/guarantee|within \d+ (hours?|minutes?|days?)|same[- ]day|pets? (are )?(welcome|allowed)|pet[- ]friendly|no minimum|week[- ]to[- ]week|stripe/i);
    // Unconfirmed items are listed as questions.
    const confirm = page.locator('[data-testid="terms-confirm"]');
    expect(await confirm.locator("li").count()).toBeGreaterThanOrEqual(5);
    await expect(confirm).toContainText(/work trucks or trailers/i);
    await expect(confirm).toContainText(/security deposit/i);
  });

  test("the terms table repeats src/data/terms.json and each home's own card price", async ({ page }) => {
    await page.goto(HUB);
    const table = page.locator('[data-testid="terms-table"]');
    await expect(table.locator("caption")).toHaveCount(1);
    await expect(table.locator("tbody tr")).toHaveCount(homes.length);
    for (const home of homes) {
      const entry = terms[home.id];
      const row = table.locator(`tbody tr[data-home="${home.id}"]`);
      await expect(row.locator("th")).toHaveText(home.name);
      const rate = row.locator('[data-cell="rate"]');
      if (entry.monthlyRate.status === "confirmed") {
        await expect(rate.locator("strong")).toHaveText(`$${Number(entry.monthlyRate.value).toLocaleString("en-US")}/month`);
        await expect(rate).not.toContainText(/guide/i);
      } else {
        await expect(rate.locator("strong")).toHaveText(/^\$[\d,]+\/month guide$/);
        await expect(rate).toContainText("Guide price, confirm on inquiry");
      }
      // The same price as the home's own card on this page.
      await expect(page.locator(`.tn-card[data-home="${home.id}"] .property-price`)).toHaveText(((await rate.locator("strong").textContent()) ?? "").trim());
      await expect(row.locator('[data-cell="minimum-stay"]')).toHaveText(entry.minimumStay.value);
      await expect(row.locator('[data-cell="utilities"]')).toHaveText(entry.utilities.value);
      await expect(row.locator('[data-cell="pets"]')).toHaveText(entry.pets.value);
      // A deposit stays "Set at booking" until the owner confirms an amount; it is never invented.
      await expect(row.locator('[data-cell="deposit"]')).toHaveText(entry.deposit.status === "confirm" ? "Set at booking" : /^\$[\d,]+$/);
    }
  });

  test("follows the brand voice and never prints a street address", async ({ page }) => {
    await page.goto(HUB);
    const main = (await page.locator("main").textContent()) ?? "";
    expect(main).not.toMatch(/\b(luxury|world-class|paradise|best-in-class|hidden gem|only \d+ left)\b|!/i);
    expect(main).not.toMatch(/\b\d{2,5} [A-Z][a-z]+ (St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd)\b/);
    expect(main).not.toMatch(/Yellow|Walnut/);
    // No review, rating or testimonial is invented.
    expect(main).not.toMatch(/testimonial|five[- ]star|\d(\.\d)? ?\/ ?5|rated/i);
  });

  test("lists the live homes and related hubs, each link resolving", async ({ page, request }) => {
    await page.goto(HUB);
    await expect(page.locator("#homes .tn-card")).toHaveCount(homes.length);
    for (const home of homes) {
      const card = page.locator(`#homes .tn-card[data-home="${home.id}"]`);
      await expect(card.getByRole("heading", { level: 3 })).toHaveText(home.name);
      // Property cards use the explicit index.html form, the convention every card on the site follows.
      await expect(card.getByRole("link", { name: home.name }).first()).toHaveAttribute("href", new RegExp(`^${home.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(index\\.html)?$`));
      await expect(card.locator("img")).toHaveAttribute("alt", /^(?=.*\w{3}).{10,}$/);
      expect((await request.get(home.href)).status(), `${home.href} status`).toBe(200);
    }
    for (const related of ["/travel-nurses/", "/insurance-housing/", "/family-stays.html", "/parkersburg/index.html", "/marietta/index.html", "/ravenswood/index.html"]) {
      expect(await page.locator(`main a[href="${related}"]`).count(), `${related} is linked`).toBeGreaterThanOrEqual(1);
      expect((await request.get(related)).status(), `${related} status`).toBe(200);
    }
  });

  test("the inquiry links pre-fill the crew audience and open the stay form without submitting", async ({ page, context }) => {
    // Never submit a real application: the stay host is stubbed, and any non-GET request fails the test.
    const methods = await stubStayHost(context, STAY);
    await page.goto(HUB);
    const hero = page.locator('main [data-cta="hero"] a.button').first();
    await expect(hero).toHaveAttribute("href", STAY_HREF);
    await expect(page.locator('main [data-cta="next-step"]')).toHaveAttribute("href", STAY_HREF);
    // Every stay link on the page, header and footer included, carries the crew audience and this page as its source;
    // a per-home link also names the home.
    const hrefs = await page.locator(`a[href^="${STAY}"]`).evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThanOrEqual(4 + homes.length);
    const homeLinks = homes.map((home) => `${STAY}?property=${home.id}&audience=crew&src=corporate-housing`);
    for (const href of hrefs) expect([STAY_HREF, ...homeLinks], href).toContain(href);
    for (const home of homes) {
      await expect(page.locator(`#homes [data-cta="home-${home.id}"]`)).toHaveAttribute("href", `${STAY}?property=${home.id}&audience=crew&src=corporate-housing`);
    }
    // No form lives on this page, and the audience value is one the stay form accepts.
    await expect(page.locator("main form")).toHaveCount(0);
    const form = fs.readFileSync(path.join(root, "infra", "azure", "apply-proxy", "index.html"), "utf8");
    expect(form).toMatch(/crew: "[^"]+"/);
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
    for (const topic of [/sleep/i, /park/i, /company pay/i, /invoice/i, /plants/i, /less than a month/i, /utilities and Wi-Fi/i, /pets/i]) expect(text).toMatch(topic);
    const faqPage = (await jsonLd(page)).find((node) => node["@type"] === "FAQPage");
    expect(faqPage, "FAQPage JSON-LD").toBeTruthy();
    expect(faqPage.mainEntity.map((entry) => ({ q: entry.name, a: entry.acceptedAnswer.text }))).toEqual(visible);
    // The invoicing answer says what is not offered, and the plant answer repeats the measured minutes.
    expect(visible.find(({ q }) => /invoice/i.test(q)).a).toMatch(/we do not offer net payment terms/i);
    const plants = visible.find(({ q }) => /plants/i.test(q)).a;
    for (const row of expectedDrives.filter((entry) => ["chemours-washington-works", "constellium-ravenswood"].includes(entry.destination))) {
      expect(plants).toContain(`about ${row.minutes} minutes (${row.miles.toFixed(1)} miles)`);
    }
    const first = questions.first().locator("summary");
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(questions.first()).toHaveAttribute("open", "");
    await expect(questions.first().locator("p")).toBeVisible();
  });

  test("publishes the typed business, FAQ and breadcrumb structured data, and no rating or price markup", async ({ page }) => {
    await page.goto(HUB);
    const nodes = await jsonLd(page);
    expect(nodes.map((node) => node["@type"]).sort()).toEqual(["BreadcrumbList", "FAQPage", "LodgingBusiness"]);
    const crumbs = nodes.find((node) => node["@type"] === "BreadcrumbList");
    expect(crumbs.itemListElement.map((item) => item.name)).toEqual(["Home", "Corporate and crew housing"]);
    expect(crumbs.itemListElement.at(-1).item).toBe(`${ORIGIN}${HUB}`);
    expect(JSON.stringify(nodes)).not.toMatch(/aggregateRating|"review"|"offers"|priceRange/);
  });

  test("the no-affiliation disclaimer is present and names the plants without claiming a client", async ({ page }) => {
    await page.goto(HUB);
    const disclaimer = page.locator('[data-testid="disclaimer"]');
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText(/not affiliated with, endorsed by or sponsored by/i);
    await expect(disclaimer).toContainText("Chemours");
    await expect(disclaimer).toContainText("Constellium");
    await expect(disclaimer).toContainText(/no employer is a client or partner/i);
    // Outside the disclaimer and the FAQ, no sentence calls an employer a customer, partner or supplier of ours.
    const main = (await page.locator("main").textContent()) ?? "";
    expect(main).not.toMatch(/(trusted|preferred|official) (housing )?(partner|provider|supplier)|our (clients|customers) include|housing (partner|provider) (to|for) (Chemours|Constellium)/i);
  });

  test("has no axe violations (WCAG 2.2 AA) with every answer open", async ({ page }) => {
    await page.goto(HUB);
    await page.locator("#faq details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
  });

  test("fits a 390px phone with its tables scrolling inside their own regions", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(HUB);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.locator('[data-testid="drive-chart"] .tn-bar').first()).toBeVisible();
    for (const region of await page.locator('main [role="region"][tabindex="0"]').all()) {
      await expect(region).toHaveAttribute("aria-labelledby", /.+/);
    }
  });
});

test.describe("retired guide /work-relocation.html", () => {
  test("is a noindex redirect stub to the hub, with a visible link, and stays out of the sitemap", async ({ page, request }) => {
    const response = await request.get("/work-relocation.html");
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toMatch(/<meta[^>]+http-equiv="refresh"[^>]+content="0;url=\/corporate-housing\/"/i);
    expect(html).toMatch(/<meta[^>]+name="robots"[^>]+noindex/i);
    expect(canonicalOf(html)).toBe(`${ORIGIN}${HUB}`);
    expect(html.match(/<link[^>]+rel="canonical"/gi) ?? []).toHaveLength(1);
    expect(html).toContain(`<a href="${HUB}">`);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("work-relocation");
    await page.goto("/work-relocation.html");
    await expect(page).toHaveURL(new RegExp(`${HUB}$`));
    await expect(page.locator("h1")).toContainText(/corporate and crew housing/i);
  });
});
