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

test("the homepage presents the new editorial navigation and lead image", async ({ page }) => {
  const response = await page.goto("/index.html");
  expect(response.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/M&T Cottages/);
  await expect(page.locator("h1")).toHaveText("A place that feels like yours.");
  await expect(page.locator('nav[aria-label="Primary navigation"]')).toContainText("Cottages");
  await expect(page.locator('nav[aria-label="Primary navigation"]')).toContainText("Locations");
  await expect(page.locator('a[href="/apply.html"]').first()).toBeVisible();
  await expect(page.locator("img").first()).toHaveAttribute("alt", /Frederick Cottage/);
});

test("every migrated public route is reachable and privacy-safe", async ({ page, request }) => {
  for (const path of publicPages) {
    const response = await request.get(path);
    expect(response.status(), `${path} should return a successful response`).toBe(200);
    const html = await response.text();
    expect(html, `${path} exposed private inventory`).not.toMatch(/255 Court St|216 Sand St|287 Ridgeway/);
    expect(html, `${path} exposed source staging data`).not.toMatch(/sharepoint|UnitedHome|focushive/i);
    await page.goto(path);
    await expect(page.locator("h1"), `${path} needs a page heading`).toHaveCount(1);
  }
});

test("property pages use curated room coverage and optimized responsive images", async ({ page }) => {
  await page.goto("/marietta/frederick-cottage.html");
  await expect(page.locator("h1")).toHaveText("Frederick Cottage");
  await expect(page.locator(".property-gallery figure")).toHaveCount(5);
  await expect(page.locator('.property-hero-image img')).toHaveAttribute("alt", "Frederick Cottage exterior");
  const imageSources = await page.locator("img").evaluateAll((images) => images.map((image) => image.currentSrc));
  expect(imageSources.length).toBeGreaterThanOrEqual(6);
  expect(imageSources.every((source) => source.includes("/_astro/") || source.startsWith("data:"))).toBeTruthy();
});

test("the application route points to the secure application host", async ({ page }) => {
  await page.goto("/apply.html");
  await expect(page.locator("h1")).toContainText("Tell us what you need");
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

test("the layout does not overflow a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/index.html", "/cottages.html", "/marietta/frederick-cottage.html"]) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(dimensions.content, `${path} overflows on mobile`).toBe(dimensions.viewport);
  }
});
