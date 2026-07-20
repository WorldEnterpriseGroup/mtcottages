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
    .toContain("Stay with Us");
}

test("stay.mtcottages.com serves the themed application page", async ({ page, request }) => {
  await waitForPublishedApplication(request);
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  expect(response.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Stay with Us/);
  await expect(page.locator('link[href*="assets/css/style.css"]')).toHaveCount(1);
  await expect(page.locator('form[data-application-form]')).toHaveCount(1);
  await expect(page.locator('form[data-application-form]')).toHaveAttribute(
    "action",
    "https://stay.mtcottages.com/api/apply"
  );
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

test("both application host redirects enforce HTTPS and canonical stay", async ({ request }) => {
  const stayHttp = await request.get("http://stay.mtcottages.com/", { maxRedirects: 0 });
  expect(stayHttp.status()).toBe(307);
  expect(stayHttp.headers().location).toBe("https://stay.mtcottages.com/");

  const legacyApply = await request.get("https://apply.mtcottages.com/", { maxRedirects: 0 });
  expect(legacyApply.status()).toBe(301);
  expect(legacyApply.headers().location).toBe("https://stay.mtcottages.com/");
});
