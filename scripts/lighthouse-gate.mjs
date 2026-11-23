#!/usr/bin/env node
// Lighthouse gate for the home page and every home microsite.
// Runs Lighthouse (mobile emulation, the default) on the home page and on each
// microsite's overview, photo tour, location and resident guide page, and fails when a category drops below its threshold. The pages come
// from the built sitemap, so a new home is gated the day it ships.
// Run from the e2e folder so its dependencies resolve:
//   BASE_URL=https://mtcottages.com npm --prefix e2e run perf
// Chrome comes from CHROME_PATH, or from the Playwright Chromium install.
// LH_REPORT=<file> also writes every page's scores as JSON (CI keeps it as an artifact).
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(path.join(path.dirname(fileURLToPath(import.meta.url)), "../e2e/package.json"));
const lighthouse = (await import(require.resolve("lighthouse"))).default;
const chromeLauncher = await import(require.resolve("chrome-launcher"));

const base = (process.env.BASE_URL || "https://mtcottages.com").replace(/\/+$/, "");
const minimum = (name, fallback) => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${name} must be a score between 0 and 1, got ${process.env[name]}`);
  return value;
};
const thresholds = {
  performance: minimum("LH_PERFORMANCE_MIN", 0.95),
  accessibility: minimum("LH_ACCESSIBILITY_MIN", 0.95),
  "best-practices": minimum("LH_BEST_PRACTICES_MIN", 0.95),
  seo: minimum("LH_SEO_MIN", 0.95),
};
// Best of three: a busy CI runner can add a few hundred ms of blocking time to one run.
const attempts = Number(process.env.LH_ATTEMPTS || 3);

/**
 * The town landing (money) pages from Growth M1 (#24, #28) and the travel-nurse
 * hub with its hospital landings (#29, #33, #45), the corporate and crew hub (#34), the accessibility statement (#75) and the book-safely page (#62) are gated alongside the microsites.
 */
const townLandingPages = ["/parkersburg/index.html", "/marietta/index.html", "/ravenswood/index.html", "/travel-nurses/", "/travel-nurses/memorial-health-marietta/", "/travel-nurses/jackson-general/", "/corporate-housing/", "/corporate-housing/washington-works/", "/corporate-housing/constellium-ravenswood/", "/insurance-housing/", "/accessibility/", "/book-safely/"];

/** Microsite roots are the sitemap's two-level directory URLs with a tour page, e.g. /marietta/frederick/. */
async function micrositePages() {
  if (process.env.LH_PAGES) return process.env.LH_PAGES.split(",").map((page) => page.trim()).filter(Boolean);
  const sitemapUrl = `${base}/sitemap.xml`;
  let xml;
  try {
    const response = await fetch(sitemapUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    xml = await response.text();
  } catch (error) {
    throw new Error(`Could not read ${sitemapUrl} to find the microsites: ${error.message}`);
  }
  const paths = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname));
  // A two-level directory is a home microsite only when its tour page is listed
  // too: /travel-nurses/memorial-health-marietta/ and /guides/<slug>/ have the same shape but no tour.
  const roots = [...paths]
    .filter((pathname) => /^\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(pathname) && paths.has(`${pathname}tour.html`))
    .sort();
  if (roots.length === 0) throw new Error(`${sitemapUrl} lists no home microsites`);
  // Guides (#47): the index and every guide, since each carries charts and diagrams.
  const guidePages = [...paths].filter((pathname) => pathname === "/guides/" || /^\/guides\/[a-z0-9-]+\/$/.test(pathname)).sort();
  if (!guidePages.includes("/guides/")) throw new Error(`${sitemapUrl} does not list /guides/`);
  // The home page (#21) is the most visited page, so it is gated with the microsites.
  // The location page carries the drive-time chart and table (#25); the town
  // landing (money) pages are gated too (#24, #28). A home's resident guide is
  // gated whenever the sitemap lists it (#89).
  const homePages = (root) => [root, `${root}tour.html`, `${root}location.html`, ...(paths.has(`${root}guide.html`) ? [`${root}guide.html`] : [])];
  return ["/", ...roots.flatMap(homePages), ...townLandingPages, ...guidePages];
}

if (!process.env.CHROME_PATH) {
  try {
    const { chromium } = require("@playwright/test");
    process.env.CHROME_PATH = chromium.executablePath();
  } catch (error) {
    console.warn(`Playwright Chromium not found (${error.message}); chrome-launcher will look for a system Chrome.`);
  }
}

const pages = await micrositePages();
console.log(`Lighthouse gate: ${pages.length} pages, minimums ${JSON.stringify(thresholds)}`);
const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"] });
const failures = [];
const report = [];
try {
  for (const route of pages) {
    const url = `${base}${route}`;
    let best;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const result = await lighthouse(url, { port: chrome.port, output: "json", logLevel: "error", onlyCategories: Object.keys(thresholds) });
      if (!result?.lhr) throw new Error(`Lighthouse returned no result for ${url}`);
      if (result.lhr.runtimeError) throw new Error(`Lighthouse could not load ${url}: ${result.lhr.runtimeError.message}`);
      const scores = Object.fromEntries(Object.entries(result.lhr.categories).map(([id, category]) => [id, category.score]));
      const lcp = result.lhr.audits["largest-contentful-paint"]?.displayValue ?? "n/a";
      const cls = result.lhr.audits["cumulative-layout-shift"]?.displayValue ?? "n/a";
      // Name what moved when a page shifts, so a CLS regression is a one-run diagnosis.
      const shifted = result.lhr.audits["layout-shift-elements"]?.details?.items ?? [];
      if (Number.parseFloat(cls) > 0.05 && shifted.length > 0) {
        console.log(`  layout shift on ${route}: ${shifted.map((item) => `${item.node?.selector ?? "?"} (${(item.score ?? 0).toFixed(3)})`).join(", ")}`);
      }
      const ok = Object.entries(thresholds).every(([id, min]) => scores[id] >= min);
      const total = Object.values(scores).reduce((sum, score) => sum + (score ?? 0), 0);
      if (!best || ok || total > best.total) best = { scores, lcp, cls, ok, total };
      if (ok) break;
    }
    const line = Object.entries(best.scores).map(([id, score]) => `${id} ${Math.round((score ?? 0) * 100)}`).join("  ");
    console.log(`${best.ok ? "PASS" : "FAIL"} ${route}  ${line}  LCP ${best.lcp}  CLS ${best.cls}`);
    report.push({ page: route, ...best.scores, lcp: best.lcp, cls: best.cls, pass: best.ok });
    for (const [id, min] of Object.entries(thresholds)) {
      if (!(best.scores[id] >= min)) failures.push(`${url} ${id} ${best.scores[id]} < ${min}`);
    }
  }
} finally {
  await chrome.kill();
  if (process.env.LH_REPORT) {
    await writeFile(process.env.LH_REPORT, `${JSON.stringify({ base, thresholds, pages: report }, null, 2)}\n`);
    console.log(`Scores written to ${process.env.LH_REPORT}`);
  }
}
if (failures.length) {
  console.error(`\nLighthouse gate failed:\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("\nLighthouse gate passed.");
