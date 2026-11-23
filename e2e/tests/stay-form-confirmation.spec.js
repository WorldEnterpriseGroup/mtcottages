const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { openForm, fillInquiry } = require("./support/stay-form");

// Same as stay-form-token.spec.js: the form scrolls smoothly unless the visitor
// prefers reduced motion, and a click mid-scroll can miss its target.
test.use({ contextOptions: { reducedMotion: "reduce" } });

// #76: after a sent inquiry the guest sees what was received and what happens
// next. Hermetic (support/stay-form.js): /api/apply is answered by the test, so
// no application is ever submitted.
const accepted = { status: 200, body: { success: true, message: "ok" } };
const refused = { status: 400, body: { success: false, message: "Please provide a valid email", stage: "validation" } };

test("a sent inquiry turns the panel into a confirmation with the guest's details and next steps", async ({ page }) => {
  const posted = await openForm(page, [accepted], { query: "?property=frederick" });
  await fillInquiry(page);
  await page.click('[type="submit"]');

  const confirmation = page.locator("[data-confirmation]");
  await expect(confirmation).toBeVisible();
  await expect(page.locator("[data-application-form]")).toBeHidden();
  const heading = confirmation.getByRole("heading", { level: 2 });
  await expect(heading).toHaveText("Thank you, Test. Your inquiry is with Mt Cottages.");
  await expect(heading).toBeFocused();

  const summary = confirmation.locator("[data-confirmation-summary]");
  await expect(summary.locator("dt")).toHaveText(["Reply to", "Home", "Community", "Move-in", "Length of stay", "Occupants", "What brings you"]);
  await expect(summary.locator("dd")).toHaveText([
    "stub@example.invalid · 304 555 0100",
    "Frederick Cottage",
    "Open to options",
    "January 15, 2027",
    "Flexible / not sure",
    "1",
    "Something else",
  ]);
  await expect(confirmation.locator(".confirmation-steps li")).toHaveCount(3);
  // No response time is promised until the owner approves one.
  await expect(confirmation).not.toContainText(/within \d|hours?\b|business day/i);
  await expect(confirmation.locator("[data-confirmation-home]")).toHaveAttribute("href", "https://mtcottages.com/marietta/frederick/");
  expect(posted).toHaveLength(1);

  const axe = await new AxeBuilder({ page }).include("[data-confirmation]").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations).toEqual([]);
});

test("send another inquiry brings the form back, ready to send with a new submission id", async ({ page }) => {
  const posted = await openForm(page, [accepted, accepted]);
  await fillInquiry(page);
  await page.click('[type="submit"]');
  await expect(page.locator("[data-confirmation]")).toBeVisible();
  await expect(page.locator("[data-confirmation-home]")).toHaveText("Browse the cottages");

  await page.click("[data-confirmation-again]");
  await expect(page.locator("[data-confirmation]")).toBeHidden();
  await expect(page.locator("[data-application-form]")).toBeVisible();
  await expect(page.locator('[name="message"]')).toBeFocused();
  await expect(page.locator('[type="submit"]')).toBeEnabled();
  await expect(page.locator("[data-form-status]")).toHaveText("");

  await page.click('[type="submit"]');
  await expect(page.locator("[data-confirmation]")).toBeVisible();
  expect(posted).toHaveLength(2);
  expect(posted[1].submissionId).not.toBe(posted[0].submissionId);
});

test("a refused inquiry keeps the form and shows no confirmation", async ({ page }) => {
  await openForm(page, [refused]);
  await fillInquiry(page);
  await page.click('[type="submit"]');
  await expect(page.locator("[data-form-status]")).toHaveAttribute("data-state", "error");
  await expect(page.locator("[data-form-status]")).toHaveText("Please provide a valid email");
  await expect(page.locator("[data-confirmation]")).toBeHidden();
  await expect(page.locator("[data-application-form]")).toBeVisible();
});

test("on a phone, a keyboard send lands on a visibly focused confirmation that fits the screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openForm(page, [accepted], { query: "?property=frederick" });
  await fillInquiry(page);
  // A keyboard send: focus-visible applies to the heading the script focuses.
  await page.focus('[type="submit"]');
  await page.keyboard.press("Enter");

  const confirmation = page.locator("[data-confirmation]");
  const heading = confirmation.getByRole("heading", { level: 2 });
  await expect(heading).toBeFocused();
  // The ring needs a defined colour token; an undefined var() drops the outline.
  const ring = await heading.evaluate((el) => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(ring.style).not.toBe("none");
  expect(ring.width).toBeGreaterThanOrEqual(2);

  // No sideways scrolling at 390px, and the actions meet the 24px target size (WCAG 2.5.8).
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  for (const action of [confirmation.locator("[data-confirmation-home]"), confirmation.locator("[data-confirmation-again]")]) {
    const box = await action.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(24);
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }

  // Keyboard path from the heading: the email link, the home, then send another.
  await page.keyboard.press("Tab");
  await expect(confirmation.locator('a[href="mailto:stay@mtcottages.com"]')).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(confirmation.locator("[data-confirmation-home]")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(confirmation.locator("[data-confirmation-again]")).toBeFocused();

  const axe = await new AxeBuilder({ page }).include("[data-confirmation]").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations).toEqual([]);
});
