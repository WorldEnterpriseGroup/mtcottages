const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

// The three data-driven home microsites (Frederick keeps its own hand-authored pages below).
const homeMicrosites = ["/ravenswood/henrietta-cottage/", "/parkersburg/oak-cottage/", "/parkersburg/broad-cottage/"];

const publicPages = [
  "/index.html", "/cottages.html", "/available.html", "/locations.html", "/room-to-settle.html",
  "/about.html", "/contact.html", "/faq.html", "/cozy-places.html",
  "/fully-furnished-homes.html", "/health-professionals.html", "/work-relocation.html",
  "/insurance-housing.html", "/family-stays.html", "/living.html", "/services.html",
  "/home-amenities.html", "/guest-services.html", "/meal-preparation.html", "/property-care.html",
  "/housekeeping.html", "/partnerships.html", "/pay-rent.html", "/privacy.html", "/residents.html",
  "/resident-portal.html", "/maintenance.html", "/emergency-maintenance.html",
  "/marietta/index.html", "/parkersburg/index.html", "/ravenswood/index.html",
  "/grantsville/index.html", "/racine/index.html",
  "/parkersburg/buck-apartment-1.html",
  "/parkersburg/yellow-cottage.html",
  "/ravenswood/walnut-cottage.html", "/ravenswood/virginia-cottage.html",
  ...homeMicrosites.flatMap((base) => [base, ...["tour", "plan", "amenities", "location"].map((page) => `${base}${page}.html`)]),
  "/marietta/frederick/index.html", "/marietta/frederick/gallery.html", "/marietta/frederick/rooms.html", "/marietta/frederick/kitchen.html", "/marietta/frederick/bathrooms.html", "/marietta/frederick/living.html", "/marietta/frederick/outdoors.html", "/marietta/frederick/amenities.html", "/marietta/frederick/utilities.html", "/marietta/frederick/arrival.html", "/marietta/frederick/area.html", "/marietta/frederick/handbook.html",
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
  await expect(page.locator('a[href="https://stay.mtcottages.com/"]:visible').first()).toBeVisible();
  await expect(page.locator('.hero-media img[src*="/_astro/"]')).toHaveCount(1);
  await expect(page.locator(".hero-media img")).toHaveAttribute("alt", /Frederick Cottage/);
  for (const essential of ["Furnished", "Fiber-optic internet", "Quiet", "Peaceful"]) {
    await expect(page.locator(".hero-essentials")).toContainText(essential);
  }
  await expect(page.locator("body")).not.toContainText("30+ days");
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
});

test("every public route is reachable and privacy-safe", async ({ page, request }) => {
  test.setTimeout(240_000);
  for (const path of publicPages) {
    const response = await request.get(path);
    expect(response.status(), `${path} should return a successful response`).toBe(200);
    const html = await response.text();
    expect(html, `${path} exposed private inventory`).not.toContain("255 Court St");
    await page.goto(path);
    await expect(page.locator('link[rel="stylesheet"]'), `${path} lost native stylesheet`).not.toHaveCount(0);
    await expect(page.locator("body"), `${path} needs visible content`).not.toBeEmpty();
    if (path !== "/404.html") {
      await expect(page.locator(".skip-link"), `${path} lost the skip link`).toHaveAttribute("href", "#main-content");
      await expect(page.locator("#main-content"), `${path} lost the main content target`).toHaveCount(1);
    }
  }
});

test("property pages keep the curated room coverage and responsive assets", async ({ page }) => {
  await page.goto("/parkersburg/buck-apartment-1.html");
  await expect(page.locator(".property-hero h1")).toBeVisible();
  const gallery = page.locator(".gallery-item img");
  expect(await gallery.count()).toBeGreaterThanOrEqual(4);
  await expect(gallery.first()).toHaveAttribute("alt", /Buck/);
  for (const image of await gallery.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
    const ratios = await image.evaluate((element) => ({
      natural: element.naturalWidth / element.naturalHeight,
      rendered: element.getBoundingClientRect().width / element.getBoundingClientRect().height,
    }));
    expect(Math.abs(ratios.natural - ratios.rendered)).toBeLessThan(0.02);
    await expect(image).toHaveCSS("object-fit", "contain");
  }
  const hero = page.locator('.property-hero .hero-image-frame--property img[src*="/_astro/"]');
  await expect(hero).toHaveCount(1);
  const heroRatios = await hero.evaluate((image) => ({
    natural: image.naturalWidth / image.naturalHeight,
    rendered: image.getBoundingClientRect().width / image.getBoundingClientRect().height,
  }));
  expect(Math.abs(heroRatios.natural - heroRatios.rendered)).toBeLessThan(0.02);
  await expect(hero).toHaveCSS("object-fit", "contain");
});

test("property inquiry CTAs go directly to stay with cottage context", async ({ page }) => {
  await page.goto("/marietta/frederick/index.html");
  expect(await page.locator('a[href="https://stay.mtcottages.com/?property=frederick"]').count()).toBeGreaterThanOrEqual(2);
});

test("the cottages and locations indexes expose useful property details", async ({ page }) => {
  await page.goto("/cottages.html");
  await expect(page.locator(".property-card")).toHaveCount(8);
  await expect(page.locator(".comparison-table")).toHaveCount(0);
  await expect(page.getByText("Compare at a glance")).toHaveCount(0);
  await expect(page.locator(".property-card").filter({ hasText: "$2,575/month" }).first()).toBeVisible();
  await expect(page.locator(".property-card").filter({ hasText: "$2,295/month" }).first()).toBeVisible();
  await expect(page.locator(".property-card").filter({ hasText: "$1,895/month" }).first()).toBeVisible();
  await page.goto("/locations.html");
  await expect(page.locator(".location-row")).toHaveCount(5);
  await expect(page.locator(".location-row").nth(3)).toContainText("Planning guide");
});

test("Walnut and Buck property stories use interior photography", async ({ page }) => {
  await page.goto("/ravenswood/walnut-cottage.html");
  await expect(page.locator("h1")).toHaveText("Walnut Cottage");
  await expect(page.locator("main img").first()).toHaveAttribute("alt", /Walnut Cottage.*bedroom/i);
  await expect(page.locator('main img[alt*="exterior"]')).toHaveCount(0);

  await page.goto("/parkersburg/buck-apartment-1.html");
  await expect(page.locator("main img").first()).toHaveAttribute("alt", /Buck Cottage.*living room/i);
  await expect(page.locator('main img[alt*="exterior"]')).toHaveCount(0);
});

test("all primary stay CTAs point directly to the canonical stay host", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.locator('a[href^="https://stay.mtcottages.com/"]:not([href*="/api/"]):visible').first()).toBeVisible();
  await page.goto("/marietta/frederick/index.html");
  expect(await page.locator('a[href="https://stay.mtcottages.com/?property=frederick"]').count()).toBeGreaterThanOrEqual(2);
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

test("the homepage hero links to the cottage it showcases", async ({ page }) => {
  await page.goto("/index.html");
  const link = page.locator(".hero-media a.hero-media__link");
  await expect(link).toHaveAttribute("href", "/marietta/frederick/index.html");
  await expect(link).toHaveAttribute("aria-label", /Frederick Cottage/);
  await link.click();
  await expect(page).toHaveURL(/\/marietta\/frederick\/index\.html$/);
});

test("every public page meets WCAG 2.1 AA colour contrast, including open navigation panels", async ({ page }) => {
  test.setTimeout(300_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const failures = [];
  for (const path of publicPages) {
    await page.goto(path);
    await page.evaluate(() => {
      document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
      document.querySelectorAll(".primary-nav details").forEach((element) => element.setAttribute("open", ""));
    });
    await page.waitForTimeout(150);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    for (const item of results.violations) {
      failures.push(`${path} ${item.id}: ${item.nodes.slice(0, 3).map((node) => node.target.join(" ")).join(" | ")}`);
    }
  }
  expect(failures).toEqual([]);
});

test("links and buttons never fall back to the browser's default blue", async ({ page }) => {
  for (const path of publicPages) {
    await page.goto(path);
    const blue = await page.evaluate(() => [...document.querySelectorAll("a")].filter((anchor) => /^rgb\(0, 0, (238|255)\)$|^rgb\(85, 26, 139\)$/.test(getComputedStyle(anchor).color)).map((anchor) => anchor.textContent.trim().slice(0, 40)));
    expect(blue, path).toEqual([]);
  }
});

test("the Frederick microsite quotes the $2,575 monthly guide and never the stale $1,395", async ({ page }) => {
  await page.goto("/marietta/frederick/index.html");
  await expect(page.locator("main")).toContainText("$2,575/month");
  await expect(page.locator("body")).not.toContainText("$1,395");
});

test("Bedroom 1 exposes the interactive 3D concept viewer", async ({ page }) => {
  await page.goto("/marietta/frederick/rooms.html");
  const viewer = page.locator('[data-bed1="bedroom-1"]');
  await viewer.scrollIntoViewIfNeeded();
  await expect(viewer).toContainText("AI-generated concept image");
  await viewer.locator("[data-load-bed1]").click();
  await expect(viewer.locator(".bed1-stage")).toBeVisible();
  await expect(viewer).toHaveAttribute("data-viewer-ready", "true", { timeout: 30000 });
  await expect.poll(() => page.evaluate(() => window.__bed1Ready), { timeout: 30000 }).toBe(true);
});

test("every AI concept view of a Frederick bedroom is labelled as AI-generated", async ({ page }) => {
  await page.goto("/marietta/frederick/rooms.html");
  const concepts = page.locator("[data-dollhouse], [data-photo3d]");
  await expect(concepts).toHaveCount(3);
  for (const concept of await concepts.all()) {
    await expect(concept.locator(".ai-badge")).toContainText("AI-generated concept image");
  }
  for (const img of await concepts.locator("img").all()) {
    await expect(img).toHaveAttribute("alt", /AI-generated concept/);
  }
});

test("Frederick arrival publishes the cottage address and walking directions start there", async ({ page }) => {
  await page.goto("/marietta/frederick/arrival.html");
  await expect(page.locator("main")).toContainText("125 Frederick St, Marietta, OH 45750");
  await page.goto("/marietta/frederick/area.html");
  const walking = page.locator('#schools a[href*="travelmode=walking"]');
  await expect(walking).toHaveCount(6);
  for (const link of await walking.all()) {
    await expect(link).toHaveAttribute("href", /origin=125%20Frederick%20St/);
  }
});

test("the shared photo viewer opens once, steps through photos, and returns focus", async ({ page }) => {
  await page.goto("/marietta/frederick/area.html");
  await expect(page.locator("body")).not.toContainText("Global fancy lightbox");
  await expect(page.locator("dialog")).toHaveCount(1);
  const thumb = page.locator("#restaurants .gallery-item img").first();
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

test("the Nearby highlights carousel can be paused and keeps off-screen slides out of the tab order", async ({ page }) => {
  await page.goto("/marietta/frederick/area.html");
  const carousel = page.locator("#nearby-hero");
  await expect(carousel.locator("[data-slide]:not([inert])")).toHaveCount(1);
  const toggle = carousel.locator("[data-toggle]");
  await expect(toggle).toHaveText("Pause");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await carousel.locator("[data-next]").click();
  await expect(carousel.locator('[data-dot="1"]')).toHaveAttribute("aria-current", "true");
});

test("the Nearby guide search also finds answers inside the FAQs", async ({ page }) => {
  await page.goto("/marietta/frederick/area.html");
  await page.fill("#nearby-search", "Grand Central");
  await expect(page.locator("#nearby-count")).toContainText("match");
  await expect(page.locator("#transit")).toBeHidden();
  await expect(page.locator("#shopping")).toBeVisible();
});

test("shared links preview as JPEG, same-site links prerender, and Frederick publishes listing data", async ({ page, request }) => {
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
  const offer = schemas.find((item) => item["@type"] === "Offer");
  expect(offer.itemOffered["@id"]).toBe(home["@id"]);
  expect(offer.priceSpecification).toMatchObject({ price: 2575, priceCurrency: "USD", unitCode: "MON" });
});
