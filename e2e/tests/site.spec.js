const { test, expect } = require("@playwright/test");

const publicPages = [
  "/index.html",
  "/cottages.html",
  "/cozy-places.html",
  "/room-to-settle.html",
  "/available.html",
  "/locations.html",
  "/marietta/index.html",
  "/parkersburg/index.html",
  "/ravenswood/index.html",
  "/grantsville/index.html",
  "/racine/index.html",
  "/marietta/frederick-cottage.html",
  "/parkersburg/broad-cottage.html",
  "/parkersburg/buck-apartment-1.html",
  "/parkersburg/oak-cottage.html",
  "/parkersburg/yellow-cottage.html",
  "/ravenswood/henrietta-cottage.html",
  "/ravenswood/virginia-cottage.html",
  "/ravenswood/white-cottage.html",
  "/living.html",
  "/health-professionals.html",
  "/work-relocation.html",
  "/insurance-housing.html",
  "/family-stays.html",
  "/services.html",
  "/fully-furnished-homes.html",
  "/home-amenities.html",
  "/guest-services.html",
  "/meal-preparation.html",
  "/property-care.html",
  "/housekeeping.html",
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
  "/404.html"
];

const removedFlatPages = [
  "/marietta-01.html",
  "/parkersburg-01.html",
  "/parkersburg-02.html",
  "/parkersburg-03.html",
  "/parkersburg-04.html",
  "/ravenswood-01.html",
  "/ravenswood-02.html",
  "/ravenswood-03.html",
  "/grantsville-wv.html",
  "/racine-oh.html"
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

test("Living and Services dropdowns point to their dedicated pages", async ({ page }) => {
  await page.goto("/index.html");
  const navigation = page.locator("ul.nav_scroll").first();

  for (const href of [
    "health-professionals.html",
    "work-relocation.html",
    "insurance-housing.html",
    "family-stays.html",
    "fully-furnished-homes.html",
    "home-amenities.html",
    "guest-services.html",
    "meal-preparation.html",
    "property-care.html",
    "housekeeping.html"
  ]) {
    await expect(navigation.locator(`a[href="${href}"]`), `missing navigation link: ${href}`).toHaveCount(1);
  }
});

test("location navigation and cottage cards use only canonical nested routes", async ({ page, request }) => {
  await page.goto("/index.html");
  const navigation = page.locator("ul.nav_scroll").first();
  for (const href of [
    "marietta/index.html",
    "parkersburg/index.html",
    "ravenswood/index.html",
    "grantsville/index.html",
    "racine/index.html"
  ]) {
    await expect(navigation.locator(`a[href="${href}"]`), `missing location route: ${href}`).toHaveCount(1);
  }

  for (const path of removedFlatPages) {
    expect((await request.get(path)).status(), `${path} should be removed, not redirected`).toBe(404);
  }
});

test("the homepage rotates five unique portfolio heroes in randomized order", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/index.html");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-home-hero-count", "5");
  const firstPath = await html.getAttribute("data-home-hero-path");
  await expect.poll(() => html.getAttribute("data-home-hero-path"), {
    timeout: 10_000,
    message: "homepage hero did not advance to the next shuffled image"
  }).not.toBe(firstPath);
});

test("town guides and canonical cottage pages are substantial and correctly named", async ({ page }) => {
  for (const path of [
    "/marietta/index.html",
    "/parkersburg/index.html",
    "/ravenswood/index.html",
    "/grantsville/index.html",
    "/racine/index.html"
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    expect((await page.locator("main").innerText()).split(/\s+/).length, `${path} needs an enriched guide`).toBeGreaterThan(650);
  }

  const namesByPath = {
    "/marietta/frederick-cottage.html": "Frederick Cottage",
    "/parkersburg/broad-cottage.html": "Broad Cottage",
    "/parkersburg/buck-apartment-1.html": "Buck Cottage",
    "/parkersburg/oak-cottage.html": "Oak Cottage",
    "/parkersburg/yellow-cottage.html": "Yellow Cottage",
    "/ravenswood/henrietta-cottage.html": "Henrietta Cottage",
    "/ravenswood/virginia-cottage.html": "Virginia Cottage",
    "/ravenswood/white-cottage.html": "White Cottage"
  };
  for (const [path, name] of Object.entries(namesByPath)) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toContainText(name);
    await expect(page).toHaveTitle(new RegExp(name));
  }
});

test("the new topic pages provide substantial, photo-rich guidance", async ({ page }) => {
  const topicPages = publicPages.filter((path) => [
    "/health-professionals.html",
    "/work-relocation.html",
    "/insurance-housing.html",
    "/family-stays.html",
    "/fully-furnished-homes.html",
    "/home-amenities.html",
    "/guest-services.html",
    "/meal-preparation.html",
    "/property-care.html",
    "/housekeeping.html"
  ].includes(path));

  for (const path of topicPages) {
    await page.goto(path);
    await expect(page.locator("h1").first(), `${path} needs a visible page heading`).toBeVisible();
    const mainText = await page.locator("body").innerText();
    expect(mainText.length, `${path} needs substantial page copy`).toBeGreaterThan(1800);
    const propertyPhotoCount = await page.locator('img[src*="assets/images/cottages/"]').count();
    expect(propertyPhotoCount, `${path} needs multiple property photos`).toBeGreaterThanOrEqual(2);
  }

  await page.goto("/health-professionals.html");
  const healthText = (await page.locator("body").innerText()).toLowerCase();
  expect(healthText).toContain("blackout curtain");
  expect(healthText).toMatch(/10\+ years|more than 10 years|over 10 years/);
  expect(healthText).toMatch(/hospital|medical center/);
  expect(healthText).toMatch(/nursing home|skilled nursing|long-term care/);
});

test("Cozy Places keeps its heading readable and excludes rejected photography", async ({ page, request }) => {
  await page.goto("/cozy-places.html");
  const hero = page.locator(".cozy-places-hero");
  await expect(hero).toHaveCount(1);
  const overlayColor = await hero.evaluate((element) =>
    getComputedStyle(element, "::before").backgroundColor
  );
  expect(overlayColor).toBe("rgba(11, 18, 12, 0.62)");
  await expect(hero.locator("h1")).toHaveCSS("color", "rgb(255, 255, 255)");

  for (const path of publicPages) {
    const html = await (await request.get(path)).text();
    expect(html, `${path} uses the rejected Ravenswood photo`).not.toContain(
      "ravenswood-01/theme-gallery-card-photo-01.avif"
    );
    expect(html, `${path} uses the rejected Parkersburg photo`).not.toContain(
      "parkersburg-02/theme-gallery-strip-photo-23.avif"
    );
  }
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

test("every public page loads without browser or asset errors", async ({ page }) => {
  let errors = [];
  page.on("pageerror", (error) => errors.push(`page error: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console error: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && response.request().resourceType() !== "document") {
      errors.push(`${response.status()} asset: ${response.url()}`);
    }
  });

  for (const path of publicPages) {
    errors = [];
    await page.goto(path, { waitUntil: "networkidle" });
    expect(errors, `${path} emitted browser or asset errors`).toEqual([]);
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

test("the Mountain Home layout and exact-size photo crops stay intact", async ({ page, request }) => {
  await page.goto("/index.html");
  await expect(page.locator(".hotelhub_nav_manu.style_four")).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("data-home-hero-count", "5");
  await expect(page.locator("html")).toHaveAttribute("data-home-hero-path", /homepage-hero-.*\.avif/);
  await expect(page.locator(".banner_area_4").first()).toHaveCSS("background-image", /linear-gradient/);

  const allowedCropSizes = new Set([
    "97x97", "240x240", "250x250", "421x540", "424x330",
    "551x596", "600x440", "600x450", "648x470", "760x588",
    "854x500", "880x569", "960x950", "960x1105", "1320x309",
    "1920x586", "1920x660", "1920x869", "2400x1800"
  ]);

  for (const path of publicPages) {
    const response = await request.get(path);
    const html = await response.text();
    const embeddedPhotos = [...html.matchAll(/<img\b[^>]*\bsrc="(?:\.\.\/)?(assets\/images\/cottages\/[^"?]+)"/g)]
      .map((match) => match[1]);
    const uncroppedPhotos = embeddedPhotos.filter((source) =>
      !source.includes("/theme-") && !source.includes("/thumb-") && !source.includes("/unique/")
    );
    expect(uncroppedPhotos, `${path} embeds a full-size photo in a theme slot`).toEqual([]);
  }

  for (const path of ["/index.html", "/about.html", "/services.html", "/marietta/frederick-cottage.html"]) {
    await page.goto(path);
    const cropSizes = await page.locator('img[src*="/theme-"]').evaluateAll((images) =>
      images.map((image) => `${image.naturalWidth}x${image.naturalHeight}`)
    );
    for (const size of cropSizes) {
      expect(allowedCropSizes.has(size), `${path} has unexpected crop dimensions ${size}`).toBeTruthy();
    }
  }

  await page.goto("/marietta/frederick-cottage.html");
  const galleryPreview = page.locator('.rooms-section a[data-gall="house-gallery"] img').first();
  await expect(galleryPreview).toHaveJSProperty("naturalWidth", 648);
  await expect(galleryPreview).toHaveJSProperty("naturalHeight", 470);
  await expect(galleryPreview.locator("xpath=.."), "lightbox should retain the full original").toHaveAttribute(
    "href",
    /\/gallery-01\.avif$/
  );

  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/index.html", "/cottages.html", "/marietta/frederick-cottage.html"]) {
    await page.goto(path);
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(widths.content, `${path} overflows the mobile viewport`).toBe(widths.viewport);
  }
});
