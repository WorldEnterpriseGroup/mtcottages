const { test, expect } = require("@playwright/test");
const { openForm, fillInquiry } = require("./support/stay-form");

// The form sets html{scroll-behavior:smooth}; Playwright's scroll-into-view then
// races the animation and a click can land mid-scroll ("element is outside of the
// viewport", then a click that misses the checkbox). The form honours
// prefers-reduced-motion, so emulate it. reducedMotion is a context option, not
// a Playwright Test option (see accessibility.spec.js).
test.use({ contextOptions: { reducedMotion: "reduce" } });

// #85: the stay form must send a live Turnstile token. The form is served
// hermetically (support/stay-form.js); nothing leaves the browser.
const accepted = { status: 200, body: { success: true, message: "ok" } };
const spent = {
  status: 400,
  body: { success: false, message: "Please complete the human verification", stage: "verification", reason: "rejected:timeout-or-duplicate" },
};

const badGateway = { status: 502, html: "<h1>Bad Gateway</h1>" };
const dropped = { abort: true };

test("a fresh token is sent as is, after one origin warm-up", async ({ page }) => {
  const posted = await openForm(page, [accepted]);
  await fillInquiry(page);
  await page.click('[type="submit"]');
  await expect(page.locator("[data-form-status]")).toHaveAttribute("data-state", "success");
  expect(posted.map((entry) => entry.token)).toEqual(["token-1"]);
  // The warm-up's own 502 is ignored and lands before the inquiry.
  expect(posted.requests).toEqual(["health", "apply"]);
});

test("a gateway 502 on the inquiry is sent again with the same submission id", async ({ page }) => {
  const posted = await openForm(page, [badGateway, accepted]);
  await fillInquiry(page);
  await page.click('[type="submit"]');
  await expect(page.locator("[data-form-status]")).toHaveAttribute("data-state", "success", { timeout: 15_000 });
  expect(posted).toHaveLength(2);
  expect(posted[1].submissionId).toBe(posted[0].submissionId);
  expect(posted[1].token).toBe(posted[0].token);
});

test("a dropped connection is sent again", async ({ page }) => {
  const posted = await openForm(page, [dropped, accepted]);
  await fillInquiry(page);
  await page.click('[type="submit"]');
  await expect(page.locator("[data-form-status]")).toHaveAttribute("data-state", "success", { timeout: 15_000 });
  expect(posted).toHaveLength(2);
  expect(posted[1].submissionId).toBe(posted[0].submissionId);
});

test("a gateway that keeps failing stops after three sends and lets the guest try again", async ({ page }) => {
  const posted = await openForm(page, [badGateway]);
  await fillInquiry(page);
  await page.click('[type="submit"]');
  await expect(page.locator("[data-form-status]")).toHaveAttribute("data-state", "error", { timeout: 15_000 });
  expect(posted).toHaveLength(3);
  await expect(page.locator('[type="submit"]')).toBeEnabled();
});

test("a 502 whose send spent the token falls through to a fresh token", async ({ page }) => {
  const posted = await openForm(page, [badGateway, spent, accepted]);
  await fillInquiry(page);
  await page.click('[type="submit"]');
  await expect(page.locator("[data-form-status]")).toHaveAttribute("data-state", "success", { timeout: 15_000 });
  expect(posted.map((entry) => entry.token)).toEqual(["token-1", "token-1", "token-2"]);
  expect(new Set(posted.map((entry) => entry.submissionId)).size).toBe(1);
});

test("a token older than four minutes is replaced before sending", async ({ page }) => {
  await page.clock.install();
  const posted = await openForm(page, [accepted]);
  await fillInquiry(page);
  // The guest took six minutes, or the phone froze the tab and its timers.
  await page.clock.fastForward("06:00");
  await page.click('[type="submit"]');
  await page.clock.runFor(1_000);
  await expect(page.locator("[data-form-status]")).toHaveAttribute("data-state", "success");
  expect(posted.map((entry) => entry.token)).toEqual(["token-2"]);
});

test("an expired-or-duplicate refusal is retried once with a new token and the same submission id", async ({ page }) => {
  const posted = await openForm(page, [spent, accepted]);
  await fillInquiry(page);
  await page.click('[type="submit"]');
  await expect(page.locator("[data-form-status]")).toHaveAttribute("data-state", "success");
  expect(posted.map((entry) => entry.token)).toEqual(["token-1", "token-2"]);
  expect(posted[1].submissionId).toBe(posted[0].submissionId);
});

test("a second refusal is shown to the guest, not retried forever", async ({ page }) => {
  const posted = await openForm(page, [spent, spent]);
  await fillInquiry(page);
  await page.click('[type="submit"]');
  await expect(page.locator("[data-form-status]")).toHaveAttribute("data-state", "error");
  await expect(page.locator("[data-form-status]")).toHaveText("Please complete the human verification");
  expect(posted).toHaveLength(2);
  await expect(page.locator('[type="submit"]')).toBeEnabled();
});
