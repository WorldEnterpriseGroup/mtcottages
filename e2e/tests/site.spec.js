const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

// Every home microsite; all of them render from the shared template in src/pages/[town]/[home].
const frederickBase = "/marietta/frederick/";
const otherMicrosites = [
  "/parkersburg/broad-cottage/", "/parkersburg/buck-cottage/", "/parkersburg/oak-cottage/",
  "/ravenswood/virginia-cottage/", "/ravenswood/henrietta-cottage/",
];
const homeMicrosites = [frederickBase, ...otherMicrosites];
// Yellow and Walnut are parked (CEO decision 2026-11-14): not listed anywhere, and their old pages
// send guests to the town page.
const parkedHomePages = [
  ["/parkersburg/yellow-cottage.html", "/parkersburg/index.html"],
  ["/ravenswood/walnut-cottage.html", "/ravenswood/index.html"],
];
// The live homes on the home page, by town, and where each one links (Frederick keeps its long-standing
// index.html URL). cottages.html lists the same homes, one card each.
const listedHomes = [
  ["marietta", "Frederick Cottage", "/marietta/frederick/index.html"],
  ["parkersburg", "Broad Cottage", "/parkersburg/broad-cottage/"],
  ["parkersburg", "Buck Cottage", "/parkersburg/buck-cottage/"],
  ["parkersburg", "Oak Cottage", "/parkersburg/oak-cottage/"],
  ["ravenswood", "Virginia Cottage", "/ravenswood/virginia-cottage/"],
  ["ravenswood", "Henrietta Cottage", "/ravenswood/henrietta-cottage/"],
];
// Developer and planning language that must never reach a guest (#71).
const developerCopy = /\bLevel \d\b|\bmicrosite\b|\bpublic (homes?|cottages?|portfolio|options|image|site)\b|photo need|\bis sourced\b|\bdrill (down|deeper)\b/i;

const publicPages = [
  "/index.html", "/cottages.html", "/available.html", "/locations.html", "/room-to-settle.html",
  "/about/", "/contact.html", "/faq.html", "/cozy-places.html",
  "/fully-furnished-homes.html", "/travel-nurses/index.html", "/corporate-housing/index.html",
  "/insurance-housing/", "/family-stays.html", "/living.html", "/services.html",
  "/home-amenities.html", "/guest-services.html", "/meal-preparation.html", "/property-care.html",
  "/housekeeping.html", "/partnerships.html", "/pay-rent.html", "/privacy.html", "/residents.html",
  "/resident-portal.html", "/maintenance.html", "/emergency-maintenance.html",
  "/marietta/index.html", "/parkersburg/index.html", "/ravenswood/index.html",
  "/grantsville/index.html", "/racine/index.html",
  // Every home has a resident guide (#89).
  ...homeMicrosites.flatMap((base) => [base, ...["tour", "plan", "amenities", "location", "guide"].map((page) => `${base}${page}.html`)]),
  "/marietta/frederick/index.html",
  "/404.html"
];

test("the homepage exposes the native Astro navigation and responsive image pipeline", async ({ page }) => {
  const response = await page.goto("/index.html");
  expect(response.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Mt Cottages/);
  await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(1);
  await expect(page.locator(".site-header")).toHaveCount(1);
  const navigation = page.locator(".primary-nav");
  await expect(navigation).toContainText("Cottages");
  await expect(navigation).toContainText("Locations");
  await expect(navigation).toContainText("Living");
  await expect(navigation).toContainText("Services");
  await expect(navigation).toContainText("About");
  await expect(navigation).toContainText("Contact");
  await expect(page.locator('a[href="https://stay.mtcottages.com/?src=home"]:visible').first()).toBeVisible();
  await expect(page.locator('.hero-media img[src*="/_astro/"]')).toHaveCount(1);
  await expect(page.locator(".hero-media img")).toHaveAttribute("alt", /Frederick Cottage/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A real home in the river towns, ready the day you arrive.");
  await expect(page.locator("body")).not.toContainText("30+ days");
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
});

test("every public route is reachable and privacy-safe", async ({ page, request }) => {
  // One full page load per route, so the budget grows with the route list (5s each) instead of a fixed cap.
  test.setTimeout(Math.max(240_000, publicPages.length * 5_000));
  for (const path of publicPages) {
    const response = await request.get(path);
    expect(response.status(), `${path} should return a successful response`).toBe(200);
    const html = await response.text();
    expect(html, `${path} exposed private inventory`).not.toContain("255 Court St");
    await page.goto(path);
    await expect(page.locator('link[rel="stylesheet"]'), `${path} lost native stylesheet`).not.toHaveCount(0);
    await expect(page.locator("body"), `${path} needs visible content`).not.toBeEmpty();
    // #71: parked homes are never offered, and no developer language is visible or in alt/caption text.
    const text = await page.locator("body").innerText();
    expect(text, `${path} mentions a parked home`).not.toMatch(/Yellow Cottage|Walnut Cottage/);
    expect(html, `${path} links a parked home`).not.toMatch(/yellow-cottage|walnut-cottage|property=(yellow|walnut)\b/);
    expect(text.match(developerCopy)?.[0], `${path} shows developer copy`).toBeUndefined();
    const attributes = await page.locator("img[alt], [data-caption], [aria-label]").evaluateAll((nodes) => nodes.map((node) => [node.getAttribute("alt"), node.getAttribute("data-caption"), node.getAttribute("aria-label")].join(" ")));
    expect(attributes.join(" ").match(developerCopy)?.[0], `${path} has developer copy in alt, caption or label text`).toBeUndefined();
    if (path !== "/404.html") {
      await expect(page.locator(".skip-link"), `${path} lost the skip link`).toHaveAttribute("href", "#main-content");
      await expect(page.locator("#main-content"), `${path} lost the main content target`).toHaveCount(1);
    }
  }
});

test("the homepage lists every live home under its town and links each one to its microsite", async ({ page, request }) => {
  await page.goto("/index.html");
  const listing = page.locator("[data-town-cards]");
  await expect(listing.locator(".town-card")).toHaveCount(3);
  await expect(listing.locator(".town-card__homes a")).toHaveCount(listedHomes.length);
  for (const [town, name, href] of listedHomes) {
    const link = listing.locator(`#town-${town} .town-card__homes a[href="${href}"]`);
    await expect(link, `${href} under ${town}`).toHaveCount(1);
    await expect(link).toContainText(name);
    expect((await request.get(href)).status(), `${href} status`).toBe(200);
  }
  await expect(page.locator("main")).not.toContainText(/Yellow|Walnut/);
  await expect(page.locator('main a[href*="yellow"], main a[href*="walnut"]')).toHaveCount(0);
  await expect(page.locator('section a[href="https://stay.mtcottages.com/?src=home"]').filter({ hasText: /Check dates/i }).first()).toBeVisible();
});

test("microsite tour photos load as responsive, undistorted images", async ({ page }) => {
  for (const base of ["/parkersburg/buck-cottage/", "/ravenswood/virginia-cottage/"]) {
    await page.goto(`${base}tour.html`);
    const photos = page.locator('.hm-shot img[src*="/_astro/"]');
    expect(await photos.count(), `${base} tour photos`).toBeGreaterThanOrEqual(4);
    for (const image of await photos.all()) {
      await expect(image).toHaveAttribute("srcset", /\S/);
      await expect(image).toHaveAttribute("alt", /\S{3,}/);
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
    }
  }
});

test("property inquiry CTAs go directly to stay with cottage context", async ({ page }) => {
  await page.goto("/marietta/frederick/index.html");
  expect(await page.locator('a[href="https://stay.mtcottages.com/?property=frederick&src=marietta-frederick"]').count()).toBeGreaterThanOrEqual(2);
});

test("the cottages and locations indexes expose useful property details", async ({ page }) => {
  await page.goto("/cottages.html");
  await expect(page.locator(".property-card")).toHaveCount(listedHomes.length);
  // #71: prices change only with the owner's answer (see "Price drift" in notes/owner-decisions.md).
  const shownPrices = {
    "Frederick Cottage": "$2,575/month", "Broad Cottage": "$1,875/month", "Buck Cottage": "$1,895/month",
    "Oak Cottage": "$2,585/month", "Virginia Cottage": "$2,295/month", "Henrietta Cottage": "$2,295/month",
  };
  // #72: a rate that is still the bedroom-count guide carries the word "guide" (src/data/terms.ts).
  for (const [name, price] of Object.entries(shownPrices)) {
    await expect(page.locator(".property-card").filter({ has: page.locator("h2", { hasText: name }) }).locator(".property-price")).toHaveText(new RegExp(`^\\${price}( guide)?$`));
  }
  // The August 2026 hand-typed comparison table stays gone; #79's compare table reads the terms data (cottage-browser.spec.js).
  await expect(page.locator(".comparison-table")).toHaveCount(0);
  await expect(page.locator(".cottage-compare tbody tr")).toHaveCount(listedHomes.length);
  await expect(page.locator(".property-card").filter({ hasText: "$2,575/month" }).first()).toBeVisible();
  await expect(page.locator(".property-card").filter({ hasText: "$2,295/month" }).first()).toBeVisible();
  await expect(page.locator(".property-card").filter({ hasText: "$1,895/month" }).first()).toBeVisible();
  await page.goto("/locations.html");
  await expect(page.locator(".location-row")).toHaveCount(5);
  await expect(page.locator(".location-row").nth(3)).toContainText("Planning guide");
  // The lede names exactly the towns whose rows list homes.
  const listedTowns = await page.locator(".location-row").filter({ hasText: /cottages? listed/ }).locator("h2").allInnerTexts();
  expect(listedTowns.length).toBeGreaterThan(0);
  for (const town of listedTowns) await expect(page.getByTestId("locations-lede")).toContainText(`${town.split(",")[0]}`);
  await expect(page.getByTestId("locations-lede")).toContainText("have furnished homes listed today");
});

test("parked homes' old pages send guests to the town page and stay out of search", async ({ page, request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const [oldPath, townPath] of parkedHomePages) {
    const response = await request.get(oldPath);
    expect(response.status(), oldPath).toBe(200);
    const html = await response.text();
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain(`http-equiv="refresh" content="0;url=${townPath}"`);
    expect(html).not.toMatch(/Yellow|Walnut/);
    expect(sitemap, `${oldPath} is not in the sitemap`).not.toContain(oldPath);
    await page.goto(oldPath);
    await expect(page).toHaveURL(new RegExp(`${townPath.replace(/[.]/g, "\\.")}$`));
  }
});

test("Buck's microsite leads with interior photography", async ({ page }) => {
  await page.goto("/parkersburg/buck-cottage/");
  await expect(page.locator("h1")).toHaveText("Buck Cottage");
  await expect(page.locator("main img").first()).toHaveAttribute("alt", /^Living room/);
});

test("all primary stay CTAs point directly to the canonical stay host", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.locator('a[href^="https://stay.mtcottages.com/"]:not([href*="/api/"]):visible').first()).toBeVisible();
  await page.goto("/marietta/frederick/index.html");
  expect(await page.locator('a[href^="https://stay.mtcottages.com/?property=frederick&"]').count()).toBeGreaterThanOrEqual(2);
});

test("desktop navigation exposes one accessible mega panel at a time", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/index.html");
  const navigation = page.locator(".site-header .primary-nav");
  await expect(navigation.locator(".nav-item")).toHaveCount(5);

  const cottages = navigation.locator(".nav-item").first();
  await cottages.locator("summary").click();
  await expect(cottages.locator(".mega-panel")).toBeVisible();
  await expect(cottages.locator("h2")).toHaveText("A place that fits the chapter.");
  await expect(cottages.locator('a[href="/available.html"]')).toHaveCount(1);

  const locations = navigation.locator(".nav-item").nth(1);
  await locations.locator("summary").click();
  await expect(cottages).not.toHaveAttribute("open", "");
  await expect(locations.locator(".mega-panel")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(locations).not.toHaveAttribute("open", "");
});

test("mobile navigation supports disclosure, escape, and scroll locking", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html");
  const menu = page.locator(".mobile-nav");
  const menuButton = menu.locator(":scope > summary");
  await expect(menu).not.toHaveAttribute("open", "");
  await menuButton.click();
  await expect(menu).toHaveAttribute("open", "");
  const drawer = menu.locator(".mobile-nav-panel");
  await expect(drawer).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("overflow", "hidden");

  const cottages = drawer.locator("details").first();
  await cottages.locator("summary").click();
  await expect(cottages.locator('a[href="/cottages.html"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(menuButton).toBeFocused();
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
});

test("the layout does not overflow a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/index.html", "/cottages.html", "/marietta/frederick/index.html", "/parkersburg/broad-cottage/", "/ravenswood/henrietta-cottage/plan.html"]) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.body.scrollWidth }));
    expect(dimensions.content, `${path} overflows on mobile`).toBe(dimensions.viewport);
  }
});

test("key decision routes have no automatically detectable accessibility violations", async ({ page }) => {
  test.setTimeout(240_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/index.html", "/cottages.html", "/marietta/frederick/index.html", "/parkersburg/broad-cottage/", "/ravenswood/henrietta-cottage/plan.html"]) {
    await page.goto(path);
    await page.evaluate(() => document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible")));
    await page.waitForTimeout(150);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, `${path}: ${results.violations.map((item) => item.id).join(", ")}`).toEqual([]);
  }
});

// #23: cookieless counts. Off the live hosts the beacons are queued in window.__mtcAnalytics
// instead of being sent, so these tests read exactly what production would send.
const beacons = (page) => page.evaluate(() => window.__mtcAnalytics ?? []);
const expectNothingStored = async (page, context) => {
  const stored = await page.evaluate(async () => ({
    cookie: document.cookie,
    local: localStorage.length,
    session: sessionStorage.length,
    databases: (await indexedDB.databases()).length,
  }));
  expect(stored).toEqual({ cookie: "", local: 0, session: 0, databases: 0 });
  expect(await context.cookies()).toEqual([]);
};

test("a microsite visit counts a page view and an inquiry click, and stores nothing in the browser", async ({ page, context }) => {
  await page.goto("/marietta/frederick/index.html");
  await expect.poll(() => beacons(page)).toContainEqual(expect.objectContaining({ e: "pageview", p: "/marietta/frederick/index.html", h: "frederick", t: "webdriver" }));
  // Keep the click on this page: the beacon is what is under test, not the stay host.
  await page.evaluate(() => document.addEventListener("click", (event) => event.preventDefault()));
  await page.locator('.hm-hero [data-cta="hero"] a[href^="https://stay.mtcottages.com/?property=frederick"]').click();
  await expect.poll(() => beacons(page)).toContainEqual(expect.objectContaining({ e: "cta_click", h: "frederick", s: "hero", p: "/marietta/frederick/index.html" }));
  for (const beacon of await beacons(page)) {
    expect(Object.keys(beacon).every((key) => ["e", "p", "h", "a", "s", "r", "t"].includes(key)), JSON.stringify(beacon)).toBe(true);
  }
  await expectNothingStored(page, context);
});

test("header inquiry clicks are counted with their source and audience links with their audience", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/index.html");
  await page.evaluate(() => document.addEventListener("click", (event) => event.preventDefault()));
  await page.locator(".site-header a.header-cta").click();
  await expect.poll(() => beacons(page)).toContainEqual(expect.objectContaining({ e: "cta_click", s: "header", p: "/index.html" }));
  await page.goto("/travel-nurses/");
  await page.evaluate(() => document.addEventListener("click", (event) => event.preventDefault()));
  await page.locator('main a[href*="audience=healthcare"]').first().click();
  await expect.poll(() => beacons(page)).toContainEqual(expect.objectContaining({ e: "cta_click", a: "healthcare" }));
  await expectNothingStored(page, context);
});

// GitHub Pages run #112 went red because the live-host branch of the analytics script (send,
// do not queue) only ever ran in the post-publish live smoke. This serves the build under test
// as https://mtcottages.com so every MR runs that branch. The collector is always answered
// here, so no beacon from this test reaches production counts.
test("on the live host the beacon goes to the collector as test traffic and stays readable", async ({ page, context, baseURL }) => {
  const liveOrigin = "https://mtcottages.com";
  if (!/^https:\/\/(www\.)?mtcottages\.com\/?$/.test(baseURL ?? "")) {
    await page.route(`${liveOrigin}/**`, async (route) => {
      const url = new URL(route.request().url());
      const response = await route.fetch({ url: new URL(url.pathname + url.search, baseURL).href });
      await route.fulfill({ response });
    });
  }
  const collected = [];
  await page.route("https://stay.mtcottages.com/api/collect", async (route) => {
    collected.push(JSON.parse(route.request().postData() ?? "{}"));
    await route.fulfill({ status: 204 });
  });
  await page.goto(`${liveOrigin}/marietta/frederick/index.html`);
  const pageview = expect.objectContaining({ e: "pageview", p: "/marietta/frederick/index.html", h: "frederick", t: "webdriver" });
  await expect.poll(() => collected).toContainEqual(pageview);
  await expect.poll(() => beacons(page)).toContainEqual(pageview);
  await expectNothingStored(page, context);
  // The page keeps loading photos through the route above; one still in flight when the test ends
  // throws "route.fetch: Test ended" into the next test on this worker (GitHub Pages run 122).
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

test("the privacy notice explains the cookieless visit counts", async ({ page }) => {
  await page.goto("/privacy.html");
  await expect(page.locator("main")).toContainText("Visit counts without cookies");
  await expect(page.locator("main")).toContainText("no cookie");
});

test("the homepage hero links to the cottage it showcases", async ({ page }) => {
  await page.goto("/index.html");
  const link = page.locator(".hero-media a.hero-media__link");
  await expect(link).toHaveAttribute("href", "/marietta/frederick/index.html");
  await expect(link).toHaveAttribute("aria-label", /Frederick Cottage/);
  await link.click();
  await expect(page).toHaveURL(/\/marietta\/frederick\/index\.html$/);
});

// One test per page, so each axe run gets its own timeout. A single loop over every page under one
// timeout took 3.9 minutes on a quiet runner and timed out twice on a CPU-starved one (MR !19).
// The pages stay serial in one worker: running them in parallel put ten Chromium axe runs in the
// site-check pod at once and it was OOM-killed.
test.describe("every public page meets WCAG 2.1 AA colour contrast, including open navigation panels", () => {
  for (const path of publicPages) {
    test(path, async ({ page }) => {
      test.setTimeout(90_000);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await page.evaluate(() => {
        document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
        document.querySelectorAll(".primary-nav details").forEach((element) => element.setAttribute("open", ""));
      });
      await page.waitForTimeout(150);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const failures = results.violations.map((item) => `${path} ${item.id}: ${item.nodes.slice(0, 3).map((node) => node.target.join(" ")).join(" | ")}`);
      expect(failures).toEqual([]);
    });
  }
});

test.describe("links and buttons never fall back to the browser's default blue", () => {
  for (const path of publicPages) {
    test(path, async ({ page }) => {
      await page.goto(path);
      const blue = await page.evaluate(() => [...document.querySelectorAll("a")].filter((anchor) => /^rgb\(0, 0, (238|255)\)$|^rgb\(85, 26, 139\)$/.test(getComputedStyle(anchor).color)).map((anchor) => anchor.textContent.trim().slice(0, 40)));
      expect(blue, path).toEqual([]);
    });
  }
});

test("the Frederick microsite quotes the $2,575 monthly guide and never the stale $1,395", async ({ page }) => {
  await page.goto("/marietta/frederick/index.html");
  await expect(page.locator("main")).toContainText("$2,575/month");
  await expect(page.locator("body")).not.toContainText("$1,395");
});

test("every AI concept view of a Frederick bedroom is labelled and kept off the photo tour", async ({ page }) => {
  await page.goto(`${frederickBase}plan.html`);
  const concepts = page.locator(".hm-shot--ai");
  await expect(concepts).toHaveCount(4);
  for (const concept of await concepts.all()) {
    await expect(concept.locator(".hm-ai-label")).toHaveText("AI-generated concept");
    await expect(concept.locator("img")).toHaveAttribute("alt", /^AI-generated concept/);
  }
  await page.goto(`${frederickBase}tour.html`);
  await expect(page.locator(".hm-shot--ai")).toHaveCount(0);
});

test("Frederick publishes the cottage address and walking directions start there", async ({ page }) => {
  await page.goto(`${frederickBase}location.html`);
  await expect(page.locator("main")).toContainText("125 Frederick St, Marietta, OH 45750");
  const walking = page.locator('#nearby a.hm-walk[href*="travelmode=walking"]');
  expect(await walking.count()).toBeGreaterThanOrEqual(20);
  for (const link of await walking.all()) {
    await expect(link).toHaveAttribute("href", /origin=125(%20|\+)Frederick(%20|\+)St/);
    await expect(link).toHaveAttribute("target", "_blank");
  }
});

test("the shared photo viewer opens once, steps through photos, and returns focus", async ({ page }) => {
  await page.goto(`${frederickBase}tour.html`);
  await expect(page.locator("body")).not.toContainText("Global fancy lightbox");
  await expect(page.locator("dialog")).toHaveCount(1);
  const thumb = page.locator("#kitchen [data-lightbox-item] img").first();
  await thumb.scrollIntoViewIfNeeded();
  await thumb.focus();
  await page.keyboard.press("Enter");
  const viewer = page.locator("dialog.site-lightbox");
  await expect(viewer).toBeVisible();
  await expect(page.locator("dialog[open]")).toHaveCount(1);
  const counter = viewer.locator("[data-lightbox-counter]");
  const first = await counter.textContent();
  await page.keyboard.press("ArrowRight");
  await expect(counter).not.toHaveText(first);
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await expect(thumb).toBeFocused();
});

test("shared links preview as JPEG, same-site links prerender, and Frederick publishes home data without an unconfirmed Offer", async ({ page, request }) => {
  await page.goto("/marietta/frederick/index.html");
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toMatch(/\.jpe?g$/);
  const preview = await request.get(new URL(og).pathname);
  expect(preview.ok()).toBeTruthy();
  expect(preview.headers()["content-type"]).toMatch(/image\/jpeg/);
  const rules = JSON.parse(await page.locator('script[type="speculationrules"]').textContent());
  expect(rules.prerender[0].eagerness).toBe("moderate");
  const schemas = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  const home = schemas.find((item) => item["@type"] === "Accommodation");
  expect(home.address).toMatchObject({ streetAddress: "125 Frederick St", postalCode: "45750", addressLocality: "Marietta", addressRegion: "OH" });
  expect(home.numberOfBedrooms).toBe(3);
  expect(home.occupancy.maxValue).toBe(6);
  // The monthly guide is shown on the page, but rates are confirmed on inquiry, so no Offer is published.
  expect(schemas.find((item) => item["@type"] === "Offer")).toBeUndefined();
  expect(schemas.find((item) => item["@type"] === "BreadcrumbList")).toBeTruthy();
});

// #91: Astro rendered each photo's fallback src at the source file's full size (a
// 2400px, 337 KB AVIF on Oak) when no width was given. The fallback must never be
// wider than the largest candidate the srcset itself offers.
for (const route of ["/parkersburg/oak-cottage/", "/parkersburg/oak-cottage/tour.html", "/index.html"]) {
  test(`photo fallbacks on ${route} are no wider than their srcset`, async ({ page }) => {
    await page.goto(route);
    const oversized = await page.locator("img[srcset]").evaluateAll((images) =>
      images.flatMap((image) => {
        const widths = image.getAttribute("srcset").split(",").map((candidate) => Number.parseInt(candidate.trim().split(/\s+/)[1], 10)).filter(Number.isFinite);
        const largest = Math.max(...widths);
        const width = Number.parseInt(image.getAttribute("width"), 10);
        return widths.length && width > largest ? [`${image.getAttribute("src")}: width ${width} > srcset ${largest}`] : [];
      }),
    );
    expect(oversized).toEqual([]);
  });
}
