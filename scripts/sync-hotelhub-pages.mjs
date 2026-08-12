import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const astroPages = resolve(projectRoot, "src/pages");
const pageDirectories = ["grantsville", "marietta", "parkersburg", "racine", "ravenswood"];

const groups = {
  cottages: [
    ["Start here", [
      ["Find Your Place", "cottages.html"],
      ["Available Now", "available.html"],
      ["Cozy Places", "cozy-places.html"],
    ]],
    ["Room to settle", [
      ["Studios & 1-Bedroom", "cozy-places.html#studios-1-bedroom"],
      ["Room to Settle In", "room-to-settle.html"],
      ["2–4 Bedroom Homes", "room-to-settle.html#2-4-bedroom-homes"],
    ]],
  ],
  locations: [
    ["Communities", [
      ["Marietta, OH", "marietta/index.html"],
      ["Parkersburg, WV", "parkersburg/index.html"],
      ["Ravenswood, WV", "ravenswood/index.html"],
      ["Grantsville, WV", "grantsville/index.html"],
      ["Racine, OH", "racine/index.html"],
    ]],
  ],
  living: [
    ["Reasons to stay", [
      ["Health Professionals", "health-professionals.html"],
      ["Work & Relocation", "work-relocation.html"],
      ["Insurance Housing", "insurance-housing.html"],
      ["Family Stays", "family-stays.html"],
    ]],
  ],
  services: [
    ["A ready home", [
      ["Fully Furnished Homes", "fully-furnished-homes.html"],
      ["Home Amenities", "home-amenities.html"],
      ["Guest Services", "guest-services.html"],
    ]],
    ["Ongoing care", [
      ["Meal Preparation", "meal-preparation.html"],
      ["Property Care", "property-care.html"],
      ["Housekeeping", "housekeeping.html"],
    ]],
  ],
  residents: [
    ["Resident support", [
      ["Resident Portal", "resident-portal.html"],
      ["Pay Rent", "pay-rent.html"],
      ["Maintenance Requests", "maintenance.html"],
      ["Emergency Maintenance", "emergency-maintenance.html"],
    ]],
  ],
};

const megaCopy = {
  cottages: ["Choose your stay", "A home that fits the chapter.", "Browse by size, town, and length of stay.", "See all cottages", "cottages.html", "Not sure where to start?", "Tell us what would make the place work."],
  locations: ["Find your footing", "Five communities, one helpful start.", "Compare the practical rhythm of each Mid-Ohio Valley town.", "Explore locations", "locations.html", "Everyday fit matters", "Start with where your work and life take you."],
  living: ["A stay with a reason", "Room for the season ahead.", "Find a furnished base for work, care, relocation, insurance, or family.", "Explore living guides", "living.html", "Make the details easier", "Share your timing and we will help you think it through."],
  services: ["The helpful parts included", "Settle in with less friction.", "Explore the practical services that support a longer furnished stay.", "Explore services", "services.html", "Care continues after move-in", "A comfortable home depends on the details."],
  residents: ["For current residents", "Support for the stay you are in.", "Find the secure resident tools and the right path for home support.", "Open resident resources", "residents.html", "Need a hand?", "Use the path that matches your question."],
};

function href(prefix, path) {
  return `${prefix}${path}`;
}

function link(prefix, [label, path], className = "") {
  const classAttribute = className ? ` class="${className}"` : "";
  return `<a${classAttribute} href="${href(prefix, path)}">${label}</a>`;
}

function groupMarkup(prefix, [label, items]) {
  return `<section class="mtc-mega-group"><p class="mtc-mega-group-label">${label}</p><ul>${items.map((item) => `<li>${link(prefix, item)}</li>`).join("")}</ul></section>`;
}

function megaMarkup(prefix, key, label) {
  const [eyebrow, heading, description, introLabel, introPath, featureEyebrow, featureHeading] = megaCopy[key];
  return `<li class="mtc-mega-menu-item"><details data-mtc-mega-details><summary>${label}</summary><div class="mtc-mega-panel"><div class="mtc-mega-panel-inner"><div class="mtc-mega-intro"><p>${eyebrow}</p><h2>${heading}</h2><span>${description}</span><a class="mtc-mega-inline-link" href="${href(prefix, introPath)}">${introLabel} <span aria-hidden="true">↗</span></a></div><div class="mtc-mega-groups">${groups[key].map((group) => groupMarkup(prefix, group)).join("")}</div><div class="mtc-mega-feature"><p>${featureEyebrow}</p><h3>${featureHeading}</h3><span>Start with a simple conversation about dates, community, household, and what a place needs to make sense.</span><a href="https://stay.mtcottages.com/">Start a stay inquiry <span aria-hidden="true">↗</span></a></div></div></div></details></li>`;
}

function mobileGroupMarkup(prefix, [label, items]) {
  return `<li><details><summary>${label}</summary><ul>${items.map((item) => `<li>${link(prefix, item)}</li>`).join("")}</ul></details></li>`;
}

function navigationMarkup(prefix, isHome) {
  const headerClass = isHome ? "hotelhub_nav_manu style_four mtc-site-header" : "hotelhub_nav_manu two inner_page mtc-site-header";
  const simpleLinks = `<li>${link(prefix, ["About", "about.html"])}</li><li>${link(prefix, ["Contact", "contact.html"])}</li>`;
  const desktop = `<div id="sticky-header" class="${headerClass}"><div class="container-fluid"><div class="row align-items-center"><div class="col-lg-3"><div class="logo"><a class="logo_img" href="${href(prefix, "index.html")}" title="Mt Cottages"><img src="${href(prefix, "assets/images/logo-mtcottages.svg")}" alt="Mt Cottages" /></a></div></div><div class="col-lg-9"><nav class="meedy_menu" aria-label="Primary navigation"><ul class="nav_scroll mtc-primary-nav">${megaMarkup(prefix, "cottages", "Cottages")}${megaMarkup(prefix, "locations", "Locations")}${megaMarkup(prefix, "living", "Living")}${megaMarkup(prefix, "services", "Services")}${simpleLinks}${megaMarkup(prefix, "residents", "Residents")}</ul><div class="hotelhub-right-side"><div class="header-button"><a href="https://stay.mtcottages.com/">Stay with Us <i class="flaticon flaticon-right-arrow" aria-hidden="true"></i></a></div></div></nav></div></div></div></div>`;
  const mobile = `<div class="mtc-mobile-menu"><div class="mtc-mobile-bar"><a href="${href(prefix, "index.html")}" aria-label="Mt Cottages home"><img src="${href(prefix, "assets/images/logo-mtcottages.svg")}" alt="Mt Cottages" /></a><button class="mtc-mobile-toggle" type="button" data-mtc-mobile-toggle aria-expanded="false" aria-controls="mtc-mobile-nav">Menu</button></div><nav class="mtc-mobile-nav" id="mtc-mobile-nav" data-mtc-mobile-drawer aria-label="Mobile primary navigation"><ul>${mobileGroupMarkup(prefix, ["Cottages", groups.cottages[0][1].concat(groups.cottages[1][1])])}${mobileGroupMarkup(prefix, ["Locations", groups.locations[0][1]])}${mobileGroupMarkup(prefix, ["Living", groups.living[0][1]])}${mobileGroupMarkup(prefix, ["Services", groups.services[0][1].concat(groups.services[1][1])])}<li>${link(prefix, ["About", "about.html"])}</li>${mobileGroupMarkup(prefix, ["Residents", groups.residents[0][1]])}<li>${link(prefix, ["Contact", "contact.html"])}</li></ul><a class="mtc-mobile-cta" href="https://stay.mtcottages.com/">Start a stay inquiry <span aria-hidden="true">↗</span></a></nav></div>`;
  return `<a class="mtc-skip-link" href="#main-content">Skip to content</a>${desktop}${mobile}`;
}

function findMatchingDivEnd(html, start) {
  const token = /<!--[^]*?-->|<div\b[^>]*>|<\/div\s*>/gi;
  token.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = token.exec(html))) {
    if (match[0].startsWith("<!--")) continue;
    if (match[0].startsWith("</")) depth -= 1;
    else depth += 1;
    if (depth === 0) return token.lastIndex;
  }
  throw new Error(`Could not find the end of the navigation block at offset ${start}`);
}

function addNavigationAssets(html, prefix) {
  const css = `<link rel="stylesheet" href="${href(prefix, "assets/css/mtcottages-nav.css")}" />`;
  const script = `<script src="${href(prefix, "assets/js/mtcottages-nav.js")}" defer></script>`;
  if (!html.includes("mtcottages-nav.css")) html = html.replace("</head>", `${css}</head>`);
  if (!html.includes("mtcottages-nav.js")) html = html.replace("</body>", `${script}</body>`);
  return html;
}

function addMainTarget(html) {
  if (html.includes('id="main-content"')) return html;
  if (/<main\b/i.test(html)) return html.replace(/<main\b/i, '<main id="main-content"');
  for (const marker of [
    '<div class="banner_area_4',
    '<div class="breatcome-section',
    '<div class="service_inner_page',
    '<div class="rooms-section',
    '<div class="contact-section',
  ]) {
    if (html.includes(marker)) return html.replace(marker, `<div id="main-content" ${marker.slice(5)}`);
  }
  return html;
}

function transformPage(source, destination) {
  const relativePage = relative(projectRoot, source).replaceAll("\\", "/");
  const prefix = relativePage.includes("/") ? "../" : "";
  const sourceText = readFileSync(source, "utf8").replace(/[ \t]+$/gm, "");
  const desktopMarker = /<div\s+id="sticky-header"/i;
  const desktopMatch = desktopMarker.exec(sourceText);
  const desktopStart = desktopMatch ? desktopMatch.index : -1;
  const mobileStart = sourceText.indexOf('<div class="mobile-menu-area', desktopStart);
  if (desktopStart === -1 || mobileStart === -1) {
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, sourceText);
    return;
  }
  const mobileEnd = findMatchingDivEnd(sourceText, mobileStart);
  const isHome = relativePage === "index.html";
  let page = `${sourceText.slice(0, desktopStart)}${navigationMarkup(prefix, isHome)}${sourceText.slice(mobileEnd)}`;
  page = addMainTarget(page);
  page = addNavigationAssets(page, prefix);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, page);
}

function syncPagesIn(directory) {
  for (const entry of readdirSync(directory)) {
    const source = resolve(directory, entry);
    if (!entry.endsWith(".html") || !statSync(source).isFile()) continue;
    const relativePage = relative(projectRoot, source);
    transformPage(source, resolve(astroPages, relativePage));
  }
}

syncPagesIn(projectRoot);
for (const directory of pageDirectories) syncPagesIn(resolve(projectRoot, directory));
