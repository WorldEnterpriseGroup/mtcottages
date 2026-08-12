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

test("the homepage preserves the HotelHub theme and approved navigation", async ({ page }) => {
  const response = await page.goto("/index.html");
  expect(response.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Mt Cottages/);
  await expect(page.locator('link[href*="assets/css/style.css"]')).toHaveCount(1);
  await expect(page.locator(".hotelhub_nav_manu.style_four")).toHaveCount(1);
  const navigation = page.locator("ul.nav_scroll").first();
  await expect(navigation).toContainText("Cottages");
  await expect(navigation).toContainText("Locations");
  await expect(navigation).toContainText("Living");
  await expect(navigation).toContainText("Services");
  await expect(navigation).toContainText("About");
  await expect(navigation).toContainText("Contact");
  await expect(page.locator('a[href="https://stay.mtcottages.com/"]:visible').first()).toBeVisible();
});

test("every restored HotelHub route is reachable and privacy-safe", async ({ page, request }) => {
  for (const path of publicPages) {
    const response = await request.get(path);
    expect(response.status(), `${path} should return a successful response`).toBe(200);
    const html = await response.text();
    expect(html, `${path} exposed private inventory`).not.toContain("255 Court St");
    await page.goto(path);
    await expect(page.locator('link[href*="assets/css/style.css"]'), `${path} lost HotelHub CSS`).toHaveCount(1);
    await expect(page.locator("body"), `${path} needs visible content`).not.toBeEmpty();
    if (path !== "/404.html") {
      await expect(page.locator(".mtc-skip-link"), `${path} lost the skip link`).toHaveAttribute("href", "#main-content");
      await expect(page.locator("#main-content"), `${path} lost the main content target`).toHaveCount(1);
    }
  }
});

test("property pages keep the curated HotelHub room coverage", async ({ page }) => {
  await page.goto("/marietta/frederick-cottage.html");
  await expect(page.locator(".breatcome-content h1")).toHaveText("Frederick Cottage");
  const gallery = page.locator('.rooms-section a[data-gall="house-gallery"] img');
  await expect(gallery).toHaveCount(5);
  await expect(gallery.first()).toHaveAttribute("alt", /exterior of Frederick Cottage/);
  await expect(gallery.first()).toHaveJSProperty("naturalWidth", 648);
  await expect(gallery.first()).toHaveJSProperty("naturalHeight", 470);
  await expect(gallery.first().locator("xpath=.."), "the property page should lead with the approved exterior").toHaveAttribute(
    "href",
    /\/exterior\.avif$/
  );
});

test("the application route points to the secure application host", async ({ page }) => {
  await page.goto("/apply.html");
  await expect(page.locator(".breatcome-content h1")).toHaveText("Stay with Us");
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
  const navigation = page.locator(".mtc-site-header .mtc-primary-nav");
  await expect(navigation.locator("[data-mtc-mega-details]")).toHaveCount(5);

  const cottages = navigation.locator("[data-mtc-mega-details]").first();
  await cottages.locator("summary").click();
  await expect(cottages.locator(".mtc-mega-panel")).toBeVisible();
  await expect(cottages.locator("h2")).toHaveText("A home that fits the chapter.");
  await expect(cottages.locator('a[href="available.html"]')).toHaveCount(1);

  const locations = navigation.locator("[data-mtc-mega-details]").nth(1);
  await locations.locator("summary").click();
  await expect(cottages).not.toHaveAttribute("open", "");
  await expect(locations.locator(".mtc-mega-panel")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(locations).not.toHaveAttribute("open", "");
});

test("mobile navigation supports disclosure, escape, and scroll locking", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html");
  const menuButton = page.locator("[data-mtc-mobile-toggle]");
  const drawer = page.locator("[data-mtc-mobile-drawer]");
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(drawer).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  const cottages = drawer.locator("details").first();
  await cottages.locator("summary").click();
  await expect(cottages.locator('a[href="cottages.html"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await expect(menuButton).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("the layout does not overflow a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/index.html", "/cottages.html", "/marietta/frederick-cottage.html"]) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(dimensions.content, `${path} overflows on mobile`).toBe(dimensions.viewport);
  }
});
