const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const PARKERSBURG_DIRECTORY_URL = "/parkersburg/";
const BROAD_COTTAGE_DIRECTORY_URL = "/parkersburg/broad-cottage/";
const BROAD_COTTAGE_LEGACY_URL = "/parkersburg/broad-cottage.html";
const BROAD_COTTAGE_ROUTE = /\/parkersburg\/broad-cottage(?:\/|\.html)$/;

async function openBroadCottage(page) {
  let response;
  for (const path of [BROAD_COTTAGE_DIRECTORY_URL, BROAD_COTTAGE_LEGACY_URL]) {
    response = await page.goto(path);
    if (response && response.ok()) return response;
  }
  expect(response, "Broad Cottage route should return a response").not.toBeNull();
  expect(response.ok(), "Broad Cottage route should be reachable").toBeTruthy();
  return response;
}

test.describe("Broad Cottage", () => {
  test("the Parkersburg directory URL lists Broad Cottage and opens its child page", async ({ page }) => {
    const response = await page.goto(PARKERSBURG_DIRECTORY_URL);
    expect(response, "Parkersburg directory URL should return a response").not.toBeNull();
    expect(response.ok(), "Parkersburg directory URL should be reachable").toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Parkersburg|cottage/i);

    const broadLink = page.getByRole("link", { name: /Broad Cottage/i }).first();
    await expect(broadLink).toBeVisible();
    await expect(broadLink).toHaveAttribute("href", /parkersburg\/broad-cottage(?:\/|\.html)/);
    await broadLink.click();
    await expect(page).toHaveURL(BROAD_COTTAGE_ROUTE);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Broad Cottage");

    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    const directoryLink = breadcrumb.getByRole("link", { name: /Parkersburg/i });
    await expect(directoryLink).toHaveAttribute("href", /\/parkersburg\/(?:index\.html)?$/);
    await directoryLink.click();
    await expect(page).toHaveURL(/\/parkersburg\/(?:index\.html)?$/);
  });

  test("shows the one-bedroom overview and current property details", async ({ page }) => {
    await openBroadCottage(page);

    await expect(page).toHaveTitle(/Broad Cottage/i);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Broad Cottage");

    const hero = page.locator(".property-hero");
    await expect(hero).toContainText("Parkersburg");
    await expect(hero).toContainText(/one-bedroom/i);
    await expect(page.locator(".property-fact-rail")).toContainText("1 Bedroom");
    await expect(page.locator(".property-fact-rail")).toContainText("$1,895/month");
    await expect(page.locator('[data-microsite-verification]')).toContainText("Shown in photo");

    const amenities = page.locator(".amenity-grid");
    for (const amenity of ["Furnished one-bedroom layout", "Full kitchen", "Queen bedroom", "Fiber-optic internet"]) {
      await expect(amenities).toContainText(amenity);
    }

    const details = page.locator('[data-property-details="Broad Cottage"]');
    await expect(details).toBeVisible();
    await expect(details).toContainText(/one-bedroom/i);
    await expect(details).toContainText(/queen bed/i);
    await expect(details).toContainText(/refrigerator.*stove.*oven.*microwave/i);
    await expect(details).toContainText(/Source photos still needed/i);
  });

  test("does not publish a bedroom-2 child route or link", async ({ page, request }) => {
    await openBroadCottage(page);

    const hrefs = await page.locator("a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs.some((href) => /bedroom-2/i.test(href || ""))).toBe(false);

    for (const path of [
      "/parkersburg/broad-cottage/bedroom-2/",
      "/parkersburg/broad-cottage/bedroom-2.html",
      "/parkersburg/broad-cottage/bedroom-2",
    ]) {
      const response = await request.get(path);
      expect(response.status(), `${path} should not resolve`).toBe(404);
    }
  });

  test("keeps gallery categories and any published deep links usable", async ({ page, request }) => {
    await openBroadCottage(page);

    const gallery = page.locator('section[aria-labelledby="gallery-title"]');
    await expect(gallery).toBeVisible();
    const images = gallery.locator("img");
    expect(await images.count()).toBeGreaterThanOrEqual(3);

    const altText = (await images.evaluateAll((items) => items.map((item) => item.getAttribute("alt") || ""))).join(" ");
    expect(altText).toMatch(/living room/i);
    expect(altText).toMatch(/bedroom/i);
    expect(altText).toMatch(/bathroom/i);

    const coverage = page.locator('[aria-label="Photo coverage"]');
    await expect(coverage).toContainText("Living room");
    await expect(coverage).toContainText("One bedroom");
    await expect(coverage).toContainText("Bathroom / tub");

    const optionalCategoryControls = gallery.locator(
      'button[data-gallery-category], button[data-photo-category], [role="tab"][data-gallery-category], [role="tab"][data-photo-category], button[data-gallery-filter]'
    );
    for (let index = 0; index < await optionalCategoryControls.count(); index += 1) {
      const control = optionalCategoryControls.nth(index);
      await expect(control).toBeVisible();
      await control.click();
      await expect(images).not.toHaveCount(0);
    }

    const optionalDeepLinks = gallery.locator(
      'a[data-gallery-category], a[data-photo-category], a[data-gallery-deep-link], a[href*="gallery"], a[href*="#gallery"], a[href*="#photo"]'
    );
    const hrefs = await optionalDeepLinks.evaluateAll((links) => [
      ...new Set(links.map((link) => link.getAttribute("href")).filter(Boolean)),
    ]);
    for (const href of hrefs) {
      const target = new URL(href, page.url());
      if (target.origin !== new URL(page.url()).origin) continue;

      const response = await request.get(`${target.pathname}${target.search}`);
      expect(response.ok(), `${href} should resolve`).toBeTruthy();
      if (target.hash) {
        const targetId = decodeURIComponent(target.hash.slice(1));
        const targetExists = await page.evaluate((id) => Boolean(document.getElementById(id)), targetId);
        expect(targetExists, `${href} should point to an existing element`).toBeTruthy();
      }
    }
  });

  test("provides an accessible photo viewer with navigation, zoom, and Escape close", async ({ page }) => {
    await openBroadCottage(page);

    const gallery = page.locator('section[aria-labelledby="gallery-title"]');
    const firstPhoto = gallery.locator("[data-gallery-open]").first();
    await firstPhoto.click();

    const dialog = gallery.locator("[data-gallery-dialog]");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("1 / 7");
    const firstAlt = await dialog.locator("[data-gallery-lightbox-image]").getAttribute("alt");
    await dialog.locator("[data-gallery-next]").click();
    await expect(dialog.locator("[data-gallery-lightbox-image]")).not.toHaveAttribute("alt", firstAlt);
    await dialog.locator("[data-gallery-zoom-in]").click();
    await expect(dialog.locator("[data-gallery-zoom-reset]")).toHaveText("125%");
    const imageButton = dialog.locator("[data-gallery-image-zoom]");
    await imageButton.focus();
    const panBefore = await dialog.locator("[data-gallery-lightbox-image]").evaluate((image) => getComputedStyle(image).transform);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => dialog.locator("[data-gallery-lightbox-image]").evaluate((image) => getComputedStyle(image).transform)).not.toBe(panBefore);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(firstPhoto).toBeFocused();
  });

  test("supports shareable photo fragments, thumbnail navigation, and a full-size fallback", async ({ page }) => {
    await page.goto(`${BROAD_COTTAGE_DIRECTORY_URL}#bedroom-queen`);

    const gallery = page.locator('section[aria-labelledby="gallery-title"]');
    const dialog = gallery.locator("[data-gallery-dialog]");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("[data-gallery-lightbox-image]")).toHaveAttribute("alt", /bedroom/i);
    await expect(dialog.locator("[data-gallery-lightbox-counter]")).toHaveText("3 / 7");
    await expect(page).toHaveURL(/#bedroom-queen$/);

    await dialog.locator('[data-gallery-thumbnail="4"]').click();
    await expect(dialog.locator("[data-gallery-lightbox-image]")).toHaveAttribute("alt", /bathroom/i);
    await expect(dialog.locator('[data-gallery-thumbnail="4"]')).toHaveAttribute("aria-current", "true");
    await expect(page).toHaveURL(/#bathroom-tub$/);
    await expect(dialog.locator("[data-gallery-original]")).toHaveAttribute("href", /photo-20/);

    await dialog.locator("[data-gallery-close]").click();
    await expect(dialog).not.toBeVisible();
    await expect(page).not.toHaveURL(/#bathroom-tub$/);
  });

  test("puts the long-stay brief, question path, and section position in the primary experience", async ({ page }) => {
    await openBroadCottage(page);

    await expect(page.locator("[data-broad-cottage-route-progress]")).toContainText("Section 1 of 13");
    const decisionPath = page.locator('[aria-label="Monthly-stay decision path"]');
    await expect(decisionPath).toContainText(/Read the decision brief/i);
    await expect(decisionPath).toContainText(/public photos are published/i);
    await expect(page.locator("#long-stay-fit")).toContainText(/Could Broad Cottage work for a longer stay/i);
    await expect(page.locator("#long-stay-fit")).toContainText(/Traveling clinicians/i);
    await expect(page.locator("#question-path")).toContainText(/Start with the question that affects your stay/i);

    const questions = page.locator("#question-path details");
    await expect(questions.first()).toHaveAttribute("open", "");
    await questions.nth(1).locator("summary").click();
    await expect(questions.nth(1)).toHaveAttribute("open", "");
    await expect(questions.nth(1)).toContainText(/published price guide is a starting point/i);
  });

  test("inherits parent wayfinding state on detailed child routes", async ({ page }) => {
    await page.goto(`${BROAD_COTTAGE_DIRECTORY_URL}bedroom/`);

    const propertyNav = page.locator('nav[aria-label="Broad Cottage property sections"]');
    await expect(propertyNav.locator('a[aria-current="location"]')).toHaveText("Rooms");
    await expect(page.locator("[data-broad-cottage-route-progress]")).toContainText(/Current section Bedroom.*Section 5 of 13/i);
  });

  test("keeps the property navigation and inquiry action usable on a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openBroadCottage(page);

    const geometry = await page.evaluate(() => {
      const links = document.querySelector(".microsite-property-subnav__links").getBoundingClientRect();
      const action = document.querySelector(".microsite-property-subnav__action").getBoundingClientRect();
      return {
        pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
        navActionOverlap: links.right > action.left && links.left < action.right && links.bottom > action.top && links.top < action.bottom,
      };
    });
    expect(geometry.pageOverflow).toBe(0);
    expect(geometry.navActionOverlap).toBe(false);
  });

  test("has accessible landmarks, image alternatives, and no axe violations", async ({ page }) => {
    await openBroadCottage(page);

    await expect(page.locator(".skip-link")).toHaveAttribute("href", "#main-content");
    await expect(page.locator("main#main-content")).toHaveCount(1);
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();

    const imagesWithoutAlt = await page.locator("main img").evaluateAll((items) =>
      items.filter((item) => !item.hasAttribute("alt") || !item.getAttribute("alt").trim()).length
    );
    expect(imagesWithoutAlt).toBe(0);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, results.violations.map((item) => item.id).join(", ")).toEqual([]);
  });

  test("inquiry CTAs retain Broad Cottage context", async ({ page }) => {
    await openBroadCottage(page);

    const inquiryLinks = page.locator('a[href^="https://stay.mtcottages.com/"][href*="property=broad"]');
    expect(await inquiryLinks.count()).toBeGreaterThan(0);
    await expect(inquiryLinks.filter({ hasText: /Ask about this home/i }).first()).toBeVisible();
    await expect(inquiryLinks.filter({ hasText: /Start a stay inquiry/i }).first()).toBeVisible();
    await expect(page.locator('a[href*="/apply.html"]')).toHaveCount(0);
  });
});
