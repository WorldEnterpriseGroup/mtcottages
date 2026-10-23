#!/usr/bin/env node
// Performance gate for the four home microsite index pages.
// Runs Lighthouse (mobile emulation, the default) and fails when a category
// drops below its threshold. Run from the e2e folder so its dependencies resolve:
//   BASE_URL=https://mtcottages.com npm --prefix e2e run perf
// Chrome comes from CHROME_PATH, or from the Playwright Chromium install.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(path.join(path.dirname(fileURLToPath(import.meta.url)), "../e2e/package.json"));
const lighthouse = (await import(require.resolve("lighthouse"))).default;
const chromeLauncher = await import(require.resolve("chrome-launcher"));

const base = (process.env.BASE_URL || "https://mtcottages.com").replace(/\/+$/, "");
const pages = [
  "/marietta/frederick/index.html",
  "/ravenswood/henrietta-cottage/",
  "/parkersburg/oak-cottage/",
  "/parkersburg/broad-cottage/",
];
const thresholds = {
  performance: Number(process.env.LH_PERFORMANCE_MIN || 0.85),
  accessibility: 0.95,
  "best-practices": 0.9,
  seo: 0.9,
};
const attempts = Number(process.env.LH_ATTEMPTS || 2);

if (!process.env.CHROME_PATH) {
  try {
    const { chromium } = require("@playwright/test");
    process.env.CHROME_PATH = chromium.executablePath();
  } catch {
    /* chrome-launcher falls back to a system Chrome */
  }
}

const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"] });
const failures = [];
try {
  for (const route of pages) {
    const url = `${base}${route}`;
    let best;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const result = await lighthouse(url, { port: chrome.port, output: "json", logLevel: "error", onlyCategories: Object.keys(thresholds) });
      const scores = Object.fromEntries(Object.entries(result.lhr.categories).map(([id, category]) => [id, category.score]));
      const lcp = result.lhr.audits["largest-contentful-paint"].displayValue;
      const ok = Object.entries(thresholds).every(([id, min]) => scores[id] >= min);
      best = { scores, lcp, ok };
      if (ok) break;
    }
    const line = Object.entries(best.scores).map(([id, score]) => `${id} ${Math.round(score * 100)}`).join("  ");
    console.log(`${best.ok ? "PASS" : "FAIL"} ${url}  ${line}  LCP ${best.lcp}`);
    for (const [id, min] of Object.entries(thresholds)) {
      if (best.scores[id] < min) failures.push(`${url} ${id} ${best.scores[id]} < ${min}`);
    }
  }
} finally {
  await chrome.kill();
}
if (failures.length) {
  console.error(`\nLighthouse gate failed:\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("\nLighthouse gate passed.");
