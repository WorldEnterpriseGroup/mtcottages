const { test, expect } = require("@playwright/test");

const publicPages = [
  "/index.html", "/cottages.html", "/available.html", "/locations.html", "/room-to-settle.html",
  "/about.html", "/apply.html", "/contact.html", "/faq.html", "/cozy-places.html",
  "/fully-furnished-homes.html", "/health-professionals.html", "/work-relocation.html",
  "/insurance-housing.html", "/family-stays.html", "/living.html", "/services.html",
  "/home-amenities.html", "/guest-services.html", "/meal-preparation.html", "/property-care.html",
  "/housekeeping.html", "/partnerships.html", "/pay-rent.html", "/residents.html",
  "/resident-portal.html", "/maintenance.html", "/emergency-maintenance.html",
  "/marietta/index.html", "/parkersburg/index.html", "/ravenswood/index.html",
  "/grantsville/index.html", "/racine/index.html", "/marietta/frederick-cottage.html",
  "/parkersburg/broad-cottage.html", "/parkersburg/buck-apartment-1.html",
  "/parkersburg/yellow-cottage.html", "/parkersburg/oak-cottage.html",
  "/ravenswood/white-cottage.html", "/ravenswood/virginia-cottage.html",
  "/ravenswood/henrietta-cottage.html", "/404.html"
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
  await expect(page.locator("picture").first()).toHaveCount(1);
});

test("every public route is reachable and privacy-safe", async ({ page, request }) => {
  for (const path of publicPages) {
    const response = await request.get(path);
    expect(response.status(), `${path} should return a successful response`).toBe(200);
    const html = await response.text();
    expect(html, `${path} exposed private inventory`).not.toContain("255 Court St");
    await page.goto(path);
    await expect(page.locator('link[rel="stylesheet"]'), `${path} lost native stylesheet`).toHaveCount(1);
    await expect(page.locator("body"), `${path} needs visible content`).not.toBeEmpty();
    if (path !== "/404.html") {
      await expect(page.locator(".skip-link"), `${path} lost the skip link`).toHaveAttribute("href", "#main-content");
      await expect(page.locator("#main-content"), `${path} lost the main content target`).toHaveCount(1);
    }
  }
});

test("property pages keep the curated room coverage and responsive assets", async ({ page }) => {
  await page.goto("/marietta/frederick-cottage.html");
  await expect(page.locator(".property-hero h1")).toHaveText("Frederick Cottage");
  const gallery = page.locator(".gallery-item img");
  await expect(gallery).toHaveCount(5);
  await expect(gallery.first()).toHaveAttribute("alt", /Frederick Cottage/);
  expect(await gallery.first().evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator(".property-hero picture")).toHaveCount(1);
});

test("the application route points to the secure application host", async ({ page }) => {
  await page.goto("/apply.html");
  await expect(page.locator(".page-hero h1")).toHaveText("Start with a useful conversation.");
  const form = page.locator("form[data-application-form]");
  await expect(form).toHaveAttribute("action", "https://stay.mtcottages.com/api/apply");
  for (const name of [
    "firstName", "lastName", "email", "phone", "moveInDate", "duration", "occupants",
    "preferredLocation", "homeSize", "stayType", "pets", "employment", "monthlyBudget",
    "furnishedNeeds", "message", "screeningConsent", "termsAccepted"
  ]) {
    await expect(form.locator(`[name="${name}"]`), `missing application field: ${name}`).toHaveCount(1);
  }
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
  for (const path of ["/index.html", "/cottages.html", "/marietta/frederick-cottage.html"]) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(dimensions.content, `${path} overflows on mobile`).toBe(dimensions.viewport);
  }
});
