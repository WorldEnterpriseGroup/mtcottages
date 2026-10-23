const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

// The three data-driven home microsites share one template; every check loops over them.
const homes = [
  { id: "henrietta", name: "Henrietta Cottage", base: "/ravenswood/henrietta-cottage/", street: "200 Henrietta St", address: "200 Henrietta St, Ravenswood, WV 26164" },
  { id: "oak", name: "Oak Cottage", base: "/parkersburg/oak-cottage/", street: "2712 Broad St", address: "2712 Broad St, Parkersburg, WV 26101" },
  { id: "broad", name: "Broad Cottage", base: "/parkersburg/broad-cottage/", street: "3113 Broad St", address: "3113 Broad St, Parkersburg, WV 26104" },
];
const pageNames = ["tour", "plan", "amenities", "location"];
const pagesOf = (home) => [home.base, ...pageNames.map((name) => `${home.base}${name}.html`)];
const settle = async (page) => {
  await page.evaluate(() => document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible")));
  await page.waitForTimeout(100);
};

for (const home of homes) {
  test.describe(home.name, () => {
    test("every page returns 200 and shows the shared shell", async ({ page, request }) => {
      for (const path of pagesOf(home)) {
        const response = await request.get(path);
        expect(response.status(), `${path} status`).toBe(200);
        await page.goto(path);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator(`nav[aria-label="${home.name} sections"]`), `${path} sub-navigation`).toHaveCount(1);
        await expect(page.locator(".hm-family"), `${path} family switcher`).toHaveCount(1);
        await expect(page.locator(".hm-family-card")).toHaveCount(4);
        await expect(page.locator(`.hm-family-card[aria-current="page"]`)).toContainText(home.name);
        await expect(page.locator(".hm-inquiry"), `${path} inquiry panel`).toHaveCount(1);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://mtcottages.com${path}`);
      }
    });

    test("the address is visible and the directions link is correct", async ({ page }) => {
      await page.goto(home.base);
      await expect(page.locator(".hm-chip")).toContainText(home.address);
      await page.goto(`${home.base}location.html`);
      const card = page.locator("[data-address-card]");
      await expect(card).toContainText(home.street);
      await expect(card.locator("address")).toBeVisible();
      await expect(card.locator("[data-directions]")).toHaveAttribute("href", `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(home.address)}`);
      await expect(card.locator('a[href^="https://maps.apple.com/"]')).toHaveCount(1);
      await expect(card.locator("[data-copy-address]")).toBeVisible();
      const from = page.locator(".hm-links a");
      expect(await from.count()).toBeGreaterThanOrEqual(1);
      for (const link of await from.all()) {
        const href = await link.getAttribute("href");
        expect(href).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&origin=.+&destination=/);
        expect(href).toContain(`destination=${encodeURIComponent(home.address)}`);
      }
      const nearby = page.locator(".hm-nearby-group a");
      expect(await nearby.count()).toBeGreaterThanOrEqual(1);
      for (const link of await nearby.all()) {
        await expect(link).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
      }
    });

    test("the map is not a third-party frame until it is asked for", async ({ page }) => {
      await page.goto(`${home.base}location.html`);
      await expect(page.locator("iframe")).toHaveCount(0);
      await page.locator("[data-map-load]").click();
      const frame = page.locator("iframe.hm-map-frame");
      await expect(frame).toHaveAttribute("src", /^https:\/\/www\.openstreetmap\.org\/export\/embed\.html/);
      await expect(frame).toHaveAttribute("title", /Map of/);
    });

    test("the copy-address button reports the result", async ({ page, context }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.goto(`${home.base}location.html`);
      await page.locator("[data-copy-address]").click();
      await expect(page.locator("[data-copy-status]")).toHaveText(/Address copied|Copy this address/);
    });

    test("the inquiry link carries the property", async ({ page }) => {
      for (const path of pagesOf(home)) {
        await page.goto(path);
        const links = page.locator(`a[href="https://stay.mtcottages.com/?property=${home.id}"]`);
        expect(await links.count(), `${path} inquiry links`).toBeGreaterThanOrEqual(2);
        await expect(page.locator('a[href*="/apply.html"]')).toHaveCount(0);
      }
    });

    test("facts carry a status and unconfirmed ones say so", async ({ page }) => {
      await page.goto(home.base);
      const facts = page.locator(".hm-fact");
      expect(await facts.count()).toBeGreaterThanOrEqual(3);
      for (const fact of await facts.all()) {
        await expect(fact.locator(".hm-badge")).toHaveText(/^(Confirmed|Listed|In photos|Confirm on inquiry)$/);
      }
      for (const fact of await page.locator(".hm-fact--confirm").all()) {
        await expect(fact.locator(".hm-badge")).toHaveText("Confirm on inquiry");
      }
      await expect(page.locator(".hm-highlight")).not.toHaveCount(0);
      await expect(page.locator(".room-card")).not.toHaveCount(0);
    });

    test("the structured data has a full address and geo point and no price offer", async ({ page }) => {
      await page.goto(home.base);
      const schemas = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
      const stay = schemas.find((item) => item["@type"] === "Accommodation");
      expect(stay.address).toMatchObject({ "@type": "PostalAddress", streetAddress: home.street, addressCountry: "US" });
      expect(stay.address.postalCode).toMatch(/^26\d{3}$/);
      expect(stay.geo.latitude).toBeGreaterThan(38);
      expect(stay.geo.longitude).toBeLessThan(-81);
      expect(schemas.find((item) => item["@type"] === "Offer")).toBeUndefined();
    });

    test("the plan page has an SVG per floor and the concept labels", async ({ page }) => {
      await page.goto(`${home.base}plan.html`);
      const plans = page.locator("svg.hm-plan-svg");
      expect(await plans.count()).toBeGreaterThanOrEqual(1);
      for (const svg of await plans.all()) {
        await expect(svg).toHaveAttribute("role", "img");
        await expect(svg.locator("text").first()).toBeVisible();
      }
      const body = page.locator("main");
      await expect(body).toContainText(/concept illustrations? generated from the room list/i);
      await expect(body).toContainText(/not to scale/i);
      await expect(body).toContainText(/not a measured survey/i);
      for (const label of await page.locator(".hm-ai-label").all()) {
        await expect(label).toHaveText("AI-generated concept");
      }
      for (const image of await page.locator(".hm-shot--ai img").all()) {
        await expect(image).toHaveAttribute("alt", /^AI-generated concept/);
      }
    });

    test("the 3D model opens a canvas and responds to its controls", async ({ page }) => {
      await page.goto(`${home.base}plan.html`);
      await expect(page.locator("[data-model-stage]")).toBeHidden();
      await page.locator("[data-model-open]").click();
      const root = page.locator("[data-model-root]");
      await expect(root).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
      const canvas = root.locator("canvas");
      await expect(canvas).toBeVisible();
      const box = await canvas.boundingBox();
      expect(box.width).toBeGreaterThan(250);
      expect(box.height).toBeGreaterThan(150);
      const before = await canvas.evaluate((element) => element.toDataURL().length);
      await root.locator('[data-model-act="right"]').click();
      await root.locator('[data-model-act="in"]').click();
      await canvas.focus();
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("r");
      await expect(root.locator("[data-model-status]")).toContainText(/ready/i);
      expect(before).toBeGreaterThan(0);
    });

    test("the 3D model does not animate under reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`${home.base}plan.html`);
      await page.locator("[data-model-open]").click();
      await expect(page.locator("[data-model-root]")).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
      await expect(page.locator("[data-model-status]")).toContainText(/does not animate/i);
    });

    test("the lightbox opens from the tour and returns focus", async ({ page }) => {
      await page.goto(`${home.base}tour.html`);
      const thumbs = page.locator(".hm-shot img");
      expect(await thumbs.count()).toBeGreaterThanOrEqual(2);
      const first = thumbs.first();
      await first.scrollIntoViewIfNeeded();
      await first.click();
      const viewer = page.locator("dialog.site-lightbox");
      await expect(viewer).toBeVisible();
      await expect(viewer.locator("[data-lightbox-counter]")).toContainText(`1 / ${await thumbs.count()}`);
      await page.keyboard.press("ArrowRight");
      await expect(viewer.locator("[data-lightbox-counter]")).toContainText("2 /");
      await page.keyboard.press("Escape");
      await expect(viewer).toBeHidden();
      await expect(first).toBeFocused();
    });

    test("amenities are grouped with status badges", async ({ page }) => {
      await page.goto(`${home.base}amenities.html`);
      expect(await page.locator(".hm-amenity-group").count()).toBeGreaterThanOrEqual(1);
      for (const badge of await page.locator(".hm-amenity-group .hm-badge").all()) {
        await expect(badge).toHaveText(/^(Confirmed|Listed|In photos|Confirm on inquiry)$/);
      }
      await expect(page.locator(".hm-key")).toContainText("Confirm on inquiry");
    });

    test("axe finds no violations on any page", async ({ page }) => {
      test.setTimeout(240_000);
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const path of pagesOf(home)) {
        await page.goto(path);
        await settle(page);
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
        expect(results.violations, `${path}: ${results.violations.map((item) => item.id).join(", ")}`).toEqual([]);
      }
    });

    test("axe finds no violations once the 3D model and the map are open", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`${home.base}plan.html`);
      await page.locator("[data-model-open]").click();
      await expect(page.locator("[data-model-root]")).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
      await settle(page);
      let results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, results.violations.map((item) => item.id).join(", ")).toEqual([]);
      await page.goto(`${home.base}location.html`);
      await page.locator("[data-map-load]").click();
      await settle(page);
      results = await new AxeBuilder({ page }).exclude("iframe").analyze();
      expect(results.violations, results.violations.map((item) => item.id).join(", ")).toEqual([]);
    });

    test("there is no horizontal overflow at 390px wide", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      for (const path of pagesOf(home)) {
        await page.goto(path);
        await settle(page);
        const sizes = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
        expect(sizes.content, `${path} html overflows`).toBeLessThanOrEqual(sizes.viewport);
        expect(sizes.body, `${path} body overflows`).toBeLessThanOrEqual(sizes.viewport);
      }
      await page.goto(`${home.base}plan.html`);
      await page.locator("[data-model-open]").click();
      await expect(page.locator("[data-model-root]")).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
      const open = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(open.content, "plan page with the 3D model open overflows").toBeLessThanOrEqual(open.viewport);
    });

    test("only the three approved street addresses appear", async ({ request }) => {
      for (const path of pagesOf(home)) {
        const html = await (await request.get(path)).text();
        for (const banned of ["255 Court", "216 Sand", "287 Ridgeway"]) expect(html).not.toContain(banned);
        const streets = html.match(/\b\d{3,5} (?:Broad|Henrietta|Frederick) St\b/g) || [];
        for (const street of streets) expect(["200 Henrietta St", "2712 Broad St", "3113 Broad St", "125 Frederick St"]).toContain(street);
      }
    });
  });
}

test("the old summary pages redirect to the new microsites", async ({ page, request }) => {
  const moves = [
    ["/parkersburg/oak-cottage.html", "/parkersburg/oak-cottage/"],
    ["/ravenswood/henrietta-cottage.html", "/ravenswood/henrietta-cottage/"],
    ["/parkersburg/broad-cottage.html", "/parkersburg/broad-cottage/"],
  ];
  for (const [from, to] of moves) {
    const html = await (await request.get(from)).text();
    expect(html, from).toContain(`url=${to}`);
    expect(html, from).toContain('name="robots" content="noindex"');
    await page.goto(from);
    await page.waitForURL((url) => url.pathname.startsWith(to), { timeout: 10_000 });
  }
});

test("the family switcher on Frederick links to all three new homes", async ({ page }) => {
  await page.goto("/marietta/frederick/index.html");
  await expect(page.locator(".hm-family-card")).toHaveCount(4);
  await expect(page.locator('.hm-family-card[aria-current="page"]')).toContainText("Frederick Cottage");
  for (const home of homes) {
    await expect(page.locator(`.hm-family-card[href="${home.base}"]`)).toContainText(home.name);
  }
  await page.locator(`.hm-family-card[href="${homes[0].base}"]`).click();
  await expect(page).toHaveURL(new RegExp(`${homes[0].base}$`));
  await expect(page.locator("h1")).toHaveText("Henrietta Cottage");
});
