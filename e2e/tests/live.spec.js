const { test, expect } = require("@playwright/test");

async function waitForPublishedApplication(request) {
  await expect
    .poll(
      async () => {
        try {
          const response = await request.get("/", { maxRedirects: 5 });
          if (!response.ok()) return "";
          return await response.text();
        } catch {
          return "";
        }
      },
      { timeout: 180_000, intervals: [5_000, 10_000] }
    )
    .toContain("Find a cottage that feels like home.");
}

test("stay.mtcottages.com serves the cottage application page", async ({ page, request }) => {
  await waitForPublishedApplication(request);
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  expect(response.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Find Your Mt Cottages Stay/);
  await expect(page.locator(".hero h1")).toHaveText("Find a cottage that feels like home.");
  await expect(page.locator("[data-human-verification], .human-check")).toHaveCount(1);
  await expect(page.locator(".cf-turnstile")).toHaveCount(1);
  await expect(page.locator('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]')).toHaveCount(1);
  await expect(page.locator(".cf-turnstile")).toHaveAttribute("data-sitekey", /.+/);
  await expect(page.locator(".cf-turnstile")).not.toHaveAttribute("data-sitekey", "__TURNSTILE_SITE_KEY__");
  await expect(page.locator('[data-turnstile-unavailable], .human-check__unavailable, [data-turnstile-config-required], [data-turnstile-state="configuration-required"]')).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("__TURNSTILE_SITE_KEY__");
  await expect(page.locator('form[data-application-form]')).toHaveCount(1);
  await expect(page.locator('form[data-application-form]')).toHaveAttribute(
    "action",
    "https://stay.mtcottages.com/api/apply"
  );
});

test("stay query parameters prefill the canonical inquiry context", async ({ page, request }) => {
  await waitForPublishedApplication(request);
  await page.goto("/?property=frederick&stayType=family&location=Marietta");
  await expect(page.locator("[data-property-context]")).toBeVisible();
  await expect(page.locator("[data-property-name]")).toHaveText("Frederick Cottage");
  await expect(page.locator('input[name="propertyId"]')).toHaveValue("frederick");
  await expect(page.locator('select[name="stayType"]')).toHaveValue("Family or furnished stay");
  await expect(page.locator('select[name="preferredLocation"]')).toHaveValue("Marietta, OH");
});

test("the application API is healthy and safely rejects a bot probe", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  await expect(health.json()).resolves.toMatchObject({ status: "ok" });

  const rejected = await request.post("/api/apply", {
    form: { website: "ci-probe" }
  });
  expect(rejected.status()).toBe(400);
  await expect(rejected.json()).resolves.toMatchObject({
    success: false,
    message: "Invalid submission"
  });
});

test("the canonical stay host redirects HTTP to HTTPS", async ({ request }) => {
  const stayHttp = await request.get("http://stay.mtcottages.com/", { maxRedirects: 0 });
  expect(stayHttp.status()).toBe(307);
  expect(stayHttp.headers().location).toBe("https://stay.mtcottages.com/");
});
