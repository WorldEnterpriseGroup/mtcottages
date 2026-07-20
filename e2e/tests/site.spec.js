const { test, expect } = require("@playwright/test");

const publicPages = [
  "/index.html",
  "/cottages.html",
  "/cozy-places.html",
  "/room-to-settle.html",
  "/available.html",
  "/locations.html",
  "/living.html",
  "/services.html",
  "/about.html",
  "/contact.html",
  "/faq.html",
  "/apply.html",
  "/residents.html",
  "/resident-portal.html",
  "/pay-rent.html",
  "/maintenance.html",
  "/emergency-maintenance.html",
  "/partnerships.html",
  "/marietta-01.html",
  "/parkersburg-01.html",
  "/parkersburg-02.html",
  "/parkersburg-03.html",
  "/parkersburg-04.html",
  "/ravenswood-01.html",
  "/ravenswood-02.html",
  "/ravenswood-03.html",
  "/ravenswood-04.html"
];

test("the homepage carries the HotelHub theme and approved navigation", async ({ page }) => {
  const response = await page.goto("/index.html");
  expect(response).not.toBeNull();
  expect(response.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Mt Cottages/);
  await expect(page.locator('link[href*="assets/css/style.css"]')).toHaveCount(1);

  const navigation = page.locator("ul.nav_scroll").first();
  await expect(navigation).toContainText("Cottages");
  await expect(navigation).toContainText("Locations");
  await expect(navigation).toContainText("Living");
  await expect(navigation).toContainText("Services");
  await expect(navigation).toContainText("About");
  await expect(navigation).toContainText("Contact");
  await expect(page.locator('a[href="https://stay.mtcottages.com/"]').first()).toBeVisible();
});

test("every public page is reachable and remains HotelHub themed", async ({ page }) => {
  for (const path of publicPages) {
    const response = await page.goto(path);
    expect(response, `${path} returned no response`).not.toBeNull();
    expect(response.ok(), `${path} did not return a successful response`).toBeTruthy();
    await expect(page.locator('link[href*="assets/css/style.css"]'), `${path} lost HotelHub CSS`).toHaveCount(1);
    const body = await page.locator("body").innerText();
    expect(body, `${path} exposed the private address`).not.toContain("255 Court St");
  }
});

test("the application page has the complete themed intake form", async ({ page }) => {
  await page.goto("/apply.html");
  await expect(page).toHaveTitle(/Stay with Us/);
  await expect(page.locator('link[href*="assets/css/style.css"]')).toHaveCount(1);

  const form = page.locator("form[data-application-form]");
  await expect(form).toHaveCount(1);
  await expect(form).toHaveAttribute("action", "https://stay.mtcottages.com/api/apply");
  for (const name of [
    "firstName",
    "lastName",
    "email",
    "phone",
    "moveInDate",
    "duration",
    "occupants",
    "preferredLocation",
    "homeSize",
    "stayType",
    "pets",
    "employment",
    "monthlyBudget",
    "furnishedNeeds",
    "message",
    "screeningConsent",
    "termsAccepted"
  ]) {
    await expect(form.locator(`[name="${name}"]`), `missing application field: ${name}`).toHaveCount(1);
  }
});
