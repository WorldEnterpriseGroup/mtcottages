const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const BASE = "/parkersburg/broad-cottage/";
const ADDRESS = "3113 Broad St, Parkersburg, WV 26104";

test.describe("Broad Cottage", () => {
  test("the Parkersburg guide lists Broad Cottage and opens its microsite", async ({ page }) => {
    const response = await page.goto("/parkersburg/");
    expect(response.ok(), "Parkersburg guide should be reachable").toBeTruthy();
    const broadLink = page.getByRole("link", { name: /Broad Cottage/i }).first();
    await expect(broadLink).toBeVisible();
    await expect(broadLink).toHaveAttribute("href", /parkersburg\/broad-cottage\//);
    await broadLink.click();
    await expect(page).toHaveURL(/\/parkersburg\/broad-cottage\/(?:index\.html)?$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Broad Cottage");

    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    const townLink = breadcrumb.getByRole("link", { name: /Parkersburg/i });
    await expect(townLink).toHaveAttribute("href", /\/parkersburg\/index\.html$/);
    await townLink.click();
    await expect(page).toHaveURL(/\/parkersburg\/(?:index\.html)?$/);
  });

  test("shows the overview with the published address and status-marked facts", async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/Broad Cottage/i);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Broad Cottage");
    await expect(page.locator(".residence-hero")).toContainText("Parkersburg");
    await expect(page.locator(".hm-chip")).toContainText(ADDRESS);
    await expect(page.locator(".hm-fact").first()).toBeVisible();
    await expect(page.locator(".hm-fact", { hasText: "Bedrooms" })).toContainText("1");
    await expect(page.locator("main")).not.toContainText("$1,895/month Offer");
  });

  test("does not publish a bedroom-2 route or link", async ({ page, request }) => {
    await page.goto(BASE);
    const hrefs = await page.locator("a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs.some((href) => /bedroom-2/i.test(href || ""))).toBe(false);
    for (const path of ["/parkersburg/broad-cottage/bedroom-2/", "/parkersburg/broad-cottage/bedroom-2.html", "/parkersburg/broad-cottage/bedroom-2"]) {
      const response = await request.get(path);
      expect(response.status(), `${path} should not resolve`).toBe(404);
    }
  });

  test("the old section URLs and summary page land on the closest new page", async ({ page }) => {
    const moves = [
      ["/parkersburg/broad-cottage.html", /\/parkersburg\/broad-cottage\/$/],
      ["/parkersburg/broad-cottage/gallery/", /\/broad-cottage\/tour\.html$/],
      ["/parkersburg/broad-cottage/living-room/", /\/broad-cottage\/tour\.html$/],
      ["/parkersburg/broad-cottage/floor-plan/", /\/broad-cottage\/plan\.html$/],
      ["/parkersburg/broad-cottage/virtual-tour/", /\/broad-cottage\/plan\.html$/],
      ["/parkersburg/broad-cottage/parking/", /\/broad-cottage\/amenities\.html$/],
      ["/parkersburg/broad-cottage/map/", /\/broad-cottage\/location\.html$/],
      ["/parkersburg/broad-cottage/healthcare/", /\/broad-cottage\/location\.html$/],
      ["/parkersburg/broad-cottage/availability/", /\/parkersburg\/broad-cottage\/$/],
    ];
    for (const [from, to] of moves) {
      await page.goto(from);
      await page.waitForURL(to, { timeout: 10_000 });
      await expect(page.getByRole("heading", { level: 1 })).not.toHaveCount(0);
    }
  });

  test("provides an accessible photo viewer with navigation and Escape close", async ({ page }) => {
    await page.goto(`${BASE}tour.html`);
    const thumbs = page.locator(".hm-shot img");
    const total = await thumbs.count();
    expect(total).toBeGreaterThanOrEqual(3);
    const first = thumbs.first();
    await expect(first).toHaveAttribute("role", "button");
    await first.scrollIntoViewIfNeeded();
    await first.focus();
    await page.keyboard.press("Enter");

    const dialog = page.locator("dialog.site-lightbox");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-label", "Photo viewer");
    await expect(dialog.locator("[data-lightbox-counter]")).toHaveText(`1 / ${total}`);
    const firstAlt = await dialog.locator("img").getAttribute("alt");
    expect(firstAlt).toBeTruthy();
    await dialog.locator("[data-lightbox-next]").click();
    await expect(dialog.locator("img")).not.toHaveAttribute("alt", firstAlt);
    await dialog.locator("[data-lightbox-prev]").click();
    await expect(dialog.locator("img")).toHaveAttribute("alt", firstAlt);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(first).toBeFocused();
  });

  test("keeps the section navigation and inquiry action usable on a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE);
    const nav = page.locator('nav[aria-label="Broad Cottage sections"]');
    await expect(nav.locator(".residence-links")).toBeHidden();
    const menu = nav.locator("details.residence-menu");
    await menu.locator("summary").click();
    await expect(menu).toHaveAttribute("open", "");
    const links = menu.locator("a");
    await expect(links).toHaveCount(5);
    await expect(menu.locator('a[aria-current="page"]')).toContainText("Overview");
    await links.filter({ hasText: "Location" }).click();
    await expect(page).toHaveURL(/\/broad-cottage\/location\.html$/);
    await expect(page.locator('a[href^="https://stay.mtcottages.com/"][href*="property=broad"]:visible').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("has accessible landmarks, image alternatives, and no axe violations", async ({ page }) => {
    test.setTimeout(240_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const path of [BASE, `${BASE}tour.html`, `${BASE}plan.html`, `${BASE}amenities.html`, `${BASE}location.html`]) {
      await page.goto(path);
      await expect(page.locator(".skip-link")).toHaveAttribute("href", "#main-content");
      await expect(page.locator("main#main-content")).toHaveCount(1);
      await expect(page.locator('nav[aria-label="Breadcrumb"]')).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

      const badImages = await page.locator("main img").evaluateAll((items) =>
        items.filter((item) => !item.hasAttribute("alt") || (!item.getAttribute("alt").trim() && !item.closest("a")?.textContent.trim())).length
      );
      expect(badImages, `${path} images without alternatives`).toBe(0);

      await page.evaluate(() => document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible")));
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, `${path}: ${results.violations.map((item) => item.id).join(", ")}`).toEqual([]);
    }
    await page.goto(BASE);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
  });

  test("inquiry CTAs retain Broad Cottage context", async ({ page }) => {
    await page.goto(BASE);
    const inquiryLinks = page.locator('a[href^="https://stay.mtcottages.com/"][href*="property=broad"]');
    expect(await inquiryLinks.count()).toBeGreaterThanOrEqual(2);
    await expect(inquiryLinks.filter({ hasText: /Ask about this home/i }).first()).toBeVisible();
    await expect(inquiryLinks.filter({ hasText: /Start a stay inquiry/i }).first()).toBeVisible();
    await expect(page.locator('a[href*="/apply.html"]')).toHaveCount(0);
    await expect(page.locator('a[href*="property=broad"]').first()).toHaveAttribute("href", "https://stay.mtcottages.com/?property=broad");
  });
});
