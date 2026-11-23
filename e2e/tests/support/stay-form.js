const fs = require("node:fs");
const path = require("node:path");
const { expect } = require("@playwright/test");

// The stay form, hermetic (#85, #76): the real
// infra/azure/apply-proxy/index.html is served from disk at the production
// URL, Cloudflare's api.js is replaced by a stub that issues numbered tokens,
// and /api/apply is answered by the test. Nothing leaves the browser.
const FORM = fs.readFileSync(path.join(__dirname, "../../../infra/azure/apply-proxy/index.html"), "utf8")
  .replace("<!-- TURNSTILE_SCRIPT -->", '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>')
  .replace("__TURNSTILE_SITE_KEY__", "0x4AAAAAAAstub")
  .replace(/ nonce="__INLINE_SCRIPT_NONCE__"/g, "");

// Each render or reset issues "token-N" and calls the widget's data-callback,
// the way the real widget does.
const TURNSTILE_STUB = `
  (() => {
    let issued = 0;
    const issue = () => {
      const widget = document.querySelector(".cf-turnstile");
      let field = widget.querySelector('[name="cf-turnstile-response"]');
      if (!field) {
        field = document.createElement("input");
        field.type = "hidden";
        field.name = "cf-turnstile-response";
        widget.appendChild(field);
      }
      field.value = "";
      setTimeout(() => {
        issued += 1;
        field.value = "token-" + issued;
        const callback = window[widget.dataset.callback];
        if (typeof callback === "function") callback(field.value);
      }, 50);
    };
    window.turnstile = { reset: issue };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", issue);
    else issue();
  })();
`;

// `query` opens the form the way a home page links to it, e.g. "?property=frederick".
async function openForm(page, answers, { query = "" } = {}) {
  const posted = [];
  // Every request to the proxy, in order: "health" for the warm-up, "apply" for a send.
  const requests = [];
  posted.requests = requests;
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({ contentType: "text/javascript", body: TURNSTILE_STUB }));
  await page.route("https://stay.mtcottages.com/api/collect", (route) => route.fulfill({ status: 204, body: "" }));
  await page.route("https://stay.mtcottages.com/api/health", (route) => {
    requests.push("health");
    // The warm-up is the request that meets the idle origin's 502.
    return route.fulfill({ status: 502, contentType: "text/html", body: "<h1>Bad Gateway</h1>" });
  });
  await page.route("https://stay.mtcottages.com/api/apply", (route) => {
    requests.push("apply");
    const body = new URLSearchParams(route.request().postData() || "");
    posted.push({ token: body.get("cf-turnstile-response"), submissionId: body.get("submissionId") });
    const answer = answers[Math.min(posted.length - 1, answers.length - 1)];
    if (answer.abort) return route.abort("connectionreset");
    return route.fulfill({ status: answer.status, contentType: answer.html ? "text/html" : "application/json", body: answer.html || JSON.stringify(answer.body) });
  });
  await page.route((url) => url.origin === "https://stay.mtcottages.com" && url.pathname === "/", (route) => route.fulfill({ contentType: "text/html", body: FORM }));
  await page.goto(`https://stay.mtcottages.com/${query}`);
  await expect(page.locator('[name="cf-turnstile-response"]')).toHaveValue("token-1");
  return posted;
}

async function fillInquiry(page) {
  await page.fill('[name="firstName"]', "Test");
  await page.fill('[name="lastName"]', "Stub");
  await page.fill('[name="email"]', "stub@example.invalid");
  await page.fill('[name="phone"]', "304 555 0100");
  await page.fill('[name="moveInDate"]', "2027-01-15");
  await page.selectOption('[name="duration"]', "Flexible / not sure");
  await page.fill('[name="occupants"]', "1");
  await page.selectOption('[name="preferredLocation"]', "Open to options");
  await page.selectOption('[name="stayType"]', "Something else");
  await page.fill('[name="message"]', "Stubbed browser test; never sent anywhere.");
  await page.check('[name="termsAccepted"]');
}

module.exports = { openForm, fillInquiry };
