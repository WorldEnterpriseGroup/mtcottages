// #20: the sitewide "Check dates" CTA. Every inquiry link carries the page's home,
// audience or town and its source page, and the stay form turns those into the
// existing fields, ignoring anything that is not on its allow-lists.
//
// The stay form is served from the checked-in infra/azure/apply-proxy/index.html
// through page routing, so nothing reaches the live stay host and nothing is ever
// submitted.
const fs = require("node:fs");
const path = require("node:path");
const { test, expect } = require("@playwright/test");

const STAY = "https://stay.mtcottages.com/";
const formHtml = fs
  .readFileSync(path.join(__dirname, "../../infra/azure/apply-proxy/index.html"), "utf8")
  .replaceAll("__INLINE_SCRIPT_NONCE__", "e2e");

const serveStayForm = async (context) => {
  await context.route("https://stay.mtcottages.com/**", (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET" || url.pathname.startsWith("/api/")) {
      return route.fulfill({ status: 202, body: "" });
    }
    return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: formHtml });
  });
  await context.route("https://challenges.cloudflare.com/**", (route) => route.abort());
};

// Mirrors pageSlug() in src/data/stay-link.ts.
const pageSlug = (pathname) =>
  (pathname.toLowerCase().replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "home")
    .slice(0, 40)
    .replace(/-+$/, "");

const microsites = [
  ["frederick", "Frederick Cottage", "/marietta/frederick/", "marietta", "Marietta, OH", ["tour", "plan", "amenities", "location", "guide"]],
  ["broad", "Broad Cottage", "/parkersburg/broad-cottage/", "parkersburg", "Parkersburg, WV", ["tour", "plan", "amenities", "location"]],
  ["buck", "Buck Cottage", "/parkersburg/buck-cottage/", "parkersburg", "Parkersburg, WV", ["tour", "plan", "amenities", "location"]],
  ["oak", "Oak Cottage", "/parkersburg/oak-cottage/", "parkersburg", "Parkersburg, WV", ["tour", "plan", "amenities", "location"]],
  ["virginia", "Virginia Cottage", "/ravenswood/virginia-cottage/", "ravenswood", "Ravenswood, WV", ["tour", "plan", "amenities", "location"]],
  ["henrietta", "Henrietta Cottage", "/ravenswood/henrietta-cottage/", "ravenswood", "Ravenswood, WV", ["tour", "plan", "amenities", "location"]],
];
// Yellow and Walnut are parked (CEO decision 2026-11-14, #71): their old URLs are
// noindex redirects to the town page, checked in site.spec.js, with no inquiry links.

const stayHrefs = (page) =>
  page.locator(`a[href^="${STAY}"]`).evaluateAll((links) => links.map((link) => link.getAttribute("href")));
const ALLOWED_PARAMS = ["property", "audience", "location", "src"];

// `homes`: listed homes a page may also offer one by one (a town money page's
// "Ask about <home>" links); each such link carries that home instead of the town.
const expectEveryStayLink = async (page, pathname, expected, homes = []) => {
  const hrefs = await stayHrefs(page);
  expect(hrefs.length, `${pathname} stay links`).toBeGreaterThanOrEqual(4);
  const src = pageSlug(pathname);
  for (const href of hrefs) {
    const params = new URL(href).searchParams;
    expect([...params.keys()].every((key) => ALLOWED_PARAMS.includes(key)), `${pathname}: ${href}`).toBe(true);
    const actual = Object.fromEntries(params);
    // A home link names the home; on an audience hub it also keeps the audience (corporate-housing).
    const allowed = [{ ...expected, src }, ...homes.map((home) => (typeof home === "string" ? { property: home, src } : { property: home.id, ...home.params, src }))];
    expect(allowed, `${pathname}: ${href}`).toContainEqual(actual);
  }
};

test("every inquiry link on every home page carries that home and its source page", async ({ page }) => {
  test.setTimeout(180_000);
  for (const [id, , base, , , pages] of microsites) {
    for (const pathname of [base, ...pages.map((name) => `${base}${name}.html`)]) {
      await page.goto(pathname);
      await expectEveryStayLink(page, pathname, { property: id });
    }
  }
});

test("each home's hero says Check dates for that home and offers its distances", async ({ page }) => {
  for (const [id, name, base] of microsites) {
    await page.goto(base);
    const hero = page.locator('.hm-hero [data-cta="hero"]');
    await expect(hero.locator(`a[href^="${STAY}?property=${id}&"]`)).toHaveText(new RegExp(`Check dates for ${name}`, "i"));
    const distances = hero.getByRole("link", { name: /See distances/i });
    await expect(distances).toHaveAttribute("href", `${base}location.html#nearby`);
    await distances.click();
    await expect(page.locator("#nearby")).toBeVisible();
  }
});

test("clicking Check dates on any home opens the stay form with that home and town selected", async ({ page, context }) => {
  test.setTimeout(120_000);
  await serveStayForm(context);
  for (const [id, name, base, , town] of microsites) {
    await page.goto(base);
    await page.locator('.hm-hero [data-cta="hero"] a.button').click();
    await expect(page).toHaveURL(new RegExp(`^${STAY.replaceAll(".", "\\.")}\\?property=${id}&src=`));
    await expect(page.locator("[data-property-context]")).toBeVisible();
    await expect(page.locator("[data-property-name]")).toHaveText(name);
    await expect(page.locator('input[name="propertyId"]')).toHaveValue(id);
    await expect(page.locator('select[name="preferredLocation"]')).toHaveValue(town);
  }
});

test("the sticky mobile bar keeps the home, clears the content and opens the form with it", async ({ page, context }) => {
  await serveStayForm(context);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [id, name, base] of microsites) {
    await page.goto(base);
    const bar = page.locator(".mobile-action");
    await expect(bar).toBeVisible();
    await expect(bar).toContainText(name);
    const link = bar.getByRole("link", { name: /Check dates/i });
    await expect(link).toHaveAttribute("href", `${STAY}?property=${id}&src=${pageSlug(base)}`);
    const box = await bar.boundingBox();
    expect(box.y + box.height, `${base} bar sits inside the viewport`).toBeLessThanOrEqual(844 + 0.5);
    // Sticky, not fixed: at the end of the page the bar sits below the last content, never on top of it.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const overlap = await page.evaluate(() => {
      const main = document.querySelector("main").getBoundingClientRect();
      const barBox = document.querySelector(".mobile-action").getBoundingClientRect();
      return main.bottom - barBox.top;
    });
    expect(overlap, `${base} bar covers the end of the content`).toBeLessThanOrEqual(0.5);
  }
  await page.goto(microsites[0][2]);
  await page.locator(".mobile-action a").click();
  await expect(page.locator('input[name="propertyId"]')).toHaveValue("frederick");
  await expect(page.locator("[data-property-name]")).toHaveText("Frederick Cottage");
});

test("the mobile bar is hidden on a desktop viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(microsites[0][2]);
  await expect(page.locator(".mobile-action")).toBeHidden();
});

test("audience hubs and town pages carry their audience or town on every inquiry link", async ({ page }) => {
  const cases = [
    ["/travel-nurses/", { audience: "healthcare" }],
    ["/corporate-housing/", { audience: "crew" }, ["frederick", "broad", "buck", "oak", "virginia", "henrietta"].map((id) => ({ id, params: { audience: "crew" } }))],
    ["/insurance-housing/", { audience: "insurance" }],
    ["/family-stays.html", { audience: "visiting-family" }],
    ["/marietta/index.html", { location: "marietta" }, ["frederick"]],
    ["/parkersburg/index.html", { location: "parkersburg" }, ["broad", "buck", "oak"]],
    ["/ravenswood/index.html", { location: "ravenswood" }],
    ["/racine/index.html", { location: "racine" }],
    ["/grantsville/index.html", { location: "grantsville" }],
    ["/about/", {}],
  ];
  for (const [pathname, expected, homes] of cases) {
    await page.goto(pathname);
    await expectEveryStayLink(page, pathname, expected, homes);
  }
});

test("the stay form maps each audience to the reason for the stay, and explicit choices win", async ({ page, context }) => {
  await serveStayForm(context);
  // Mirrors `audiences` in src/data/stay-link.ts.
  const audienceReasons = {
    healthcare: "Travel or healthcare assignment",
    crew: "Work or relocation",
    insurance: "Insurance housing",
    relocation: "Work or relocation",
    "visiting-family": "Family or furnished stay",
    visitor: "Family or furnished stay",
    "long-term": "Personal transition",
  };
  for (const [audience, reason] of Object.entries(audienceReasons)) {
    await page.goto(`${STAY}?audience=${audience}&src=e2e`);
    await expect(page.locator('select[name="stayType"]'), audience).toHaveValue(reason);
  }
  await page.goto(`${STAY}?property=broad&audience=healthcare&stayType=insurance&location=marietta`);
  await expect(page.locator('select[name="stayType"]')).toHaveValue("Insurance housing");
  await expect(page.locator('select[name="preferredLocation"]')).toHaveValue("Marietta, OH");
  await expect(page.locator('input[name="propertyId"]')).toHaveValue("broad");
});

test("the stay form ignores unknown and tampered parameter values", async ({ page, context }) => {
  await serveStayForm(context);
  for (const query of [
    "?property=constructor&audience=__proto__",
    "?property=toString&audience=hasOwnProperty",
    "?property=%3Cscript%3E&audience=%22%3E%3Cimg",
    "?property=frederick%20&audience=nurse",
    "?property=apply&audience=crew-boss&location=nowhere",
  ]) {
    await page.goto(`${STAY}${query}`);
    const known = query.startsWith("?property=frederick%20");
    await expect(page.locator("[data-property-context]"), query).toBeVisible({ visible: known });
    await expect(page.locator('input[name="propertyId"]'), query).toHaveValue(known ? "frederick" : "");
    await expect(page.locator('select[name="stayType"]'), query).toHaveValue("");
    await expect(page.locator('select[name="preferredLocation"]'), query).toHaveValue(known ? "Marietta, OH" : "");
    await expect(page.locator("body"), query).not.toContainText("<script>");
  }
});
