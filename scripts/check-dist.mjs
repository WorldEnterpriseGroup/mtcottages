#!/usr/bin/env node
// Validates the built Astro site in dist/ before it is published.
// Shared by GitHub Actions (.github/workflows/ci-cd.yml) and the GitLab
// merge-request pipeline (.gitlab-ci.yml), so both gate on the same rules.
// Usage: node scripts/check-dist.mjs [distDir]
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

// Every page counts: 6 home microsites x 5 template pages, a resident guide
// for each of the six homes (#89),
// the microsite redirects (old .html summaries, Frederick's 10 old pages,
// Broad's 23 old sections, /parkersburg/furnished-rentals/,
// /marietta/furnished-rentals/ and /ravenswood/furnished-rentals/, #41), the travel-nurse hub and its Camden Clark (#32), Memorial Health (#33) and Jackson General (#45) pages,
// the corporate and crew hub (#34) and its Washington Works (#44) and Constellium Ravenswood (#43) pages, the /health-professionals.html, /work-relocation.html and /insurance-housing.html redirect stubs,
// the insurance housing hub and its adjuster summary (#42),
// /guides/ and its articles (#47; the Sternwheel Festival guide, #52, the Blennerhassett Island guide, #50, moving to Parkersburg, #48, things to do in Marietta, #51, where to eat, #57, the cost of living, #58, the Vienna and Williamstown town guides, #55, the county schools guides, #53, the Parkersburg neighborhoods guide, #54, the Belpre and Ripley guides, #56, and moving to Marietta, #49), the accessibility statement (#75), the long-term stays hub (/stays/long-term/, #46), the monthly stays hub (#64), the about page (/about/, #38), the stay policies page (#36),
// the book-safely page (#62), five resident guides (#89) and the rest of the site. Update it whenever a home, page or
// redirect is added or removed.
const EXPECTED_PAGES = 147;
const MAX_DIST_MB = 70;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const LEGACY_MARKERS = ["jquery", "bootstrap", "modernizr", "swiper", "owl.carousel", "venobox", "gsap", "hotelhub"];

const dist = process.argv[2] ?? "dist";

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    throw new Error(`cannot read ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (!existsSync(dist) || !statSync(dist).isDirectory()) {
  console.error(`${dist} does not exist; run npm run build first`);
  process.exit(1);
}

const errors = [];
const files = walk(dist);
const pages = files.filter((file) => file.endsWith(".html")).sort();

const cnamePath = join(dist, "CNAME");
if (!existsSync(cnamePath) || read(cnamePath).trim() !== "mtcottages.com") {
  errors.push("CNAME must remain mtcottages.com");
}
if (!existsSync(join(dist, ".nojekyll"))) errors.push(".nojekyll is missing");
if (existsSync(join(dist, "apply.html"))) errors.push(`${dist}/apply.html is a removed legacy application route`);
// The sitemap feeds search engines and the Lighthouse gate, which finds each home microsite there.
// integrations/canonical-sitemap.mjs writes it; this re-checks the result independently: every URL
// is built, indexable, carries lastmod, and is exactly that page's canonical; every microsite index
// is listed as a directory URL; robots.txt points crawlers at it.
const isNoindex = (markup) => /<meta[^>]+name="robots"[^>]+noindex/i.test(markup);
const canonicalsOf = (markup) => [...markup.matchAll(/<link[^>]+rel="canonical"[^>]*>/gi)].map((tag) => tag[0].match(/href="([^"]+)"/i)?.[1]);
const sitemapPaths = new Set();
const sitemapFile = join(dist, "sitemap.xml");
if (!existsSync(sitemapFile)) {
  errors.push("dist/sitemap.xml is missing");
} else {
  const xml = read(sitemapFile);
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) errors.push("sitemap.xml is not a sitemaps.org urlset");
  if (xml.includes("apply.html")) errors.push("sitemap.xml advertises the removed apply route");
  for (const entry of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = entry[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) {
      errors.push("sitemap.xml has a <url> without <loc>");
      continue;
    }
    if (!/<lastmod>\d{4}-\d{2}-\d{2}T[^<]+<\/lastmod>/.test(entry[1])) errors.push(`sitemap.xml lists ${loc} without a W3C lastmod`);
    let pathname;
    try {
      const url = new URL(loc);
      if (url.origin !== "https://mtcottages.com") errors.push(`sitemap.xml lists ${loc}, which is not on https://mtcottages.com`);
      pathname = decodeURIComponent(url.pathname);
    } catch (error) {
      errors.push(`sitemap.xml lists an invalid URL ${loc}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    if (sitemapPaths.has(pathname)) errors.push(`sitemap.xml lists ${pathname} twice`);
    sitemapPaths.add(pathname);
    const file = join(dist, pathname.endsWith("/") ? `${pathname}index.html` : pathname);
    if (!existsSync(file)) {
      errors.push(`sitemap.xml lists ${pathname}, which was not built`);
      continue;
    }
    const markup = read(file);
    if (isNoindex(markup)) errors.push(`sitemap.xml lists ${pathname}, a redirect or noindex page`);
    const canonicals = canonicalsOf(markup);
    if (canonicals.length !== 1 || canonicals[0] !== loc) errors.push(`sitemap.xml lists ${loc}, but the page's canonical is ${JSON.stringify(canonicals)}`);
  }
}
if (sitemapPaths.size === 0) errors.push("sitemap.xml lists no page");
const robotsFile = join(dist, "robots.txt");
if (!existsSync(robotsFile)) errors.push("dist/robots.txt is missing");
else {
  const robots = read(robotsFile);
  if (!/^Sitemap: https:\/\/mtcottages\.com\/sitemap\.xml$/m.test(robots)) errors.push("robots.txt must reference https://mtcottages.com/sitemap.xml");
  if (/^Disallow:\s*\/\s*$/m.test(robots)) errors.push("robots.txt blocks the whole site");
}
for (const page of pages) {
  const microsite = relative(dist, page).split(sep).join("/").match(/^([a-z0-9-]+\/[a-z0-9-]+)\/index\.html$/);
  if (microsite && !isNoindex(read(page)) && !sitemapPaths.has(`/${microsite[1]}/`)) {
    errors.push(`the sitemap does not list the /${microsite[1]}/ microsite; its canonical must be the directory URL`);
  }
}

if (pages.length !== EXPECTED_PAGES) {
  errors.push(`expected ${EXPECTED_PAGES} generated HTML pages, found ${pages.length}`);
}

for (const page of pages) {
  const markup = read(page).toLowerCase();
  if (markup.includes("/apply.html") || markup.includes("apply.mtcottages.com")) {
    errors.push(`${page} contains a removed application alias`);
  }
  if (markup.includes("255 court st")) errors.push(`${page} contains private/non-public inventory`);
  // AI-generated room concepts are allowed only when visibly labelled.
  if ((markup.includes("dollhouse") || markup.includes("data-photo3d")) && !markup.includes("ai-generated concept")) {
    errors.push(`${page} shows an AI concept image without an AI-generated concept label`);
  }
  if (LEGACY_MARKERS.some((marker) => markup.includes(marker))) errors.push(`${page} contains a legacy runtime marker`);
  // An array passed to class= (instead of class:list) renders as "a,b", so no CSS rule matches it (#34).
  const joinedClass = markup.match(/\sclass="[^"]*,[^"]*"/);
  if (joinedClass) errors.push(`${page} has a comma-joined class attribute (${joinedClass[0].trim()}); use class:list`);
  const canonicalCount = (markup.match(/<link[^>]+rel="canonical"/g) ?? []).length;
  if (canonicalCount !== 1) errors.push(`${page} has ${canonicalCount} canonical links; every page needs exactly one`);
  const sources = [...markup.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]);
  if (sources.some((source) => !source.includes("/_astro/logo-mtcottages")) && !markup.includes("srcset=")) {
    errors.push(`${page} contains an unresponsive content image`);
  }
  if (markup.includes("assets/images/cottages/")) {
    errors.push(`${page} leaks a source asset path instead of an optimized Astro asset`);
  }
}

// integrations/build-stamp.mjs names the built commit; the post-deploy gate
// (scripts/check-live-build.py) reads it from the live site (#19).
const buildStampFile = join(dist, "build.json");
if (!existsSync(buildStampFile)) {
  errors.push("dist/build.json is missing; the live-build gate cannot tell which commit is published");
} else {
  try {
    const stamp = JSON.parse(read(buildStampFile));
    if (typeof stamp.commit !== "string" || !/^[0-9a-f]{40}$/.test(stamp.commit)) {
      errors.push(`build.json commit ${JSON.stringify(stamp.commit)} is not a 40-character commit SHA`);
    }
  } catch (error) {
    errors.push(`build.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

let totalBytes = 0;
for (const file of files) {
  const { size } = statSync(file);
  totalBytes += size;
  if (size > MAX_FILE_BYTES) errors.push(`${file} is larger than 2 MB`);
}
const totalMb = Math.ceil(totalBytes / (1024 * 1024));
if (totalMb > MAX_DIST_MB) errors.push(`${dist} is ${totalMb} MB; the limit is ${MAX_DIST_MB} MB`);

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Validated ${pages.length} Astro HTML pages (${totalMb} MB)`);