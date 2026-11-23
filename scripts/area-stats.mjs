#!/usr/bin/env node
// Refresh the official figures in _data/area-stats.json (#48).
//
// Reads public files from the Census Bureau, HUD and the Bureau of Economic
// Analysis and rewrites the "population", "fairMarketRent" and
// "priceParities" (#58) sections of _data/area-stats.json; everything else in
// the file (the employer list, which has no machine-readable source) is kept
// as it is. Safe to re-run:
// the same source files give the same output.
//
//   node scripts/area-stats.mjs [--check]
//
// --check exits 1 when the file differs from what the sources give now, without
// writing. Uses only Node's standard library (fetch, zlib), so the HUD
// spreadsheet is read straight from its zip container.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";
import { isDeepStrictEqual } from "node:util";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = join(ROOT, "_data", "area-stats.json");
// HUD answers a bare tool name with a bot-check page, so name the script in a standard browser-compatible form.
const USER_AGENT = "Mozilla/5.0 (compatible; mtcottages-area-stats/1.0; +https://mtcottages.com/)";

const POPULATION_URL = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_54.csv";
const POPULATION_PAGE = "https://www.census.gov/data/tables/time-series/demo/popest/2020s-total-cities-and-towns.html";
const VINTAGE = 2025;
// [id, label, SUMLEV, COUNTY, PLACE] in the Census subcounty file.
const PLACES = [
  ["parkersburg", "Parkersburg (city)", "162", "000", "62140"],
  ["vienna", "Vienna (city)", "162", "000", "83500"],
  ["williamstown", "Williamstown (city)", "162", "000", "87556"],
  ["wood-county", "Wood County", "050", "107", "00000"],
];

const FMR_URL = "https://www.huduser.gov/portal/datasets/fmr/fmr2027/FY27_FMRs.xlsx";
const FMR_PAGE = "https://www.huduser.gov/portal/datasets/fmr.html";
const FISCAL_YEAR = 2027;
// [id, label, state, county name, expected HUD area name]
const FMR_AREAS = [
  ["parkersburg-vienna", "Parkersburg-Vienna metro (Wood and Wirt counties, WV)", "WV", "Wood County", "Parkersburg-Vienna, WV MSA"],
  ["washington-county-oh", "Washington County, OH (Marietta)", "OH", "Washington County", "Washington County, OH"],
  ["jackson-county-wv", "Jackson County, WV (Ravenswood)", "WV", "Jackson County", "Jackson County, WV"],
];

// Regional Price Parities (#58): price levels against the US average (100).
// Parkersburg is in the Parkersburg-Vienna metro area. Washington County, OH
// (Marietta) and Jackson County, WV (Ravenswood) are in no metro area (OMB
// bulletin 23-01), so BEA's nearest figure is the nonmetropolitan portion of
// their state, which includes micropolitan counties.
const RPP_PAGE = "https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area";
const RPP_METRO_URL = "https://apps.bea.gov/regional/zip/MARPP.zip";
const RPP_PORTION_URL = "https://apps.bea.gov/regional/zip/PARPP.zip";
// [id, label, file URL, GeoFIPS, expected GeoName]
const RPP_AREAS = [
  ["parkersburg-vienna", "Parkersburg-Vienna metro, WV (Parkersburg)", RPP_METRO_URL, "37620", "Parkersburg-Vienna, WV (Metropolitan Statistical Area)"],
  ["ohio-nonmetro", "Nonmetro Ohio (Marietta, Washington County)", RPP_PORTION_URL, "39999", "Ohio (Nonmetropolitan Portion)"],
  ["west-virginia-nonmetro", "Nonmetro West Virginia (Ravenswood, Jackson County)", RPP_PORTION_URL, "54999", "West Virginia (Nonmetropolitan Portion)"],
];
// LineCode in the BEA tables -> our category id.
const RPP_LINES = { 1: "all", 2: "goods", 3: "housing", 4: "utilities", 5: "other" };

function fail(message) {
  console.error(message);
  process.exit(2);
}

async function download(url) {
  let response;
  try {
    response = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(120_000) });
  } catch (error) {
    fail(`cannot download ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!response.ok) fail(`cannot download ${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

/** Splits one CSV line, honouring double-quoted fields. */
function csvFields(line) {
  const fields = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { fields.push(field); field = ""; }
    else field += char;
  }
  fields.push(field);
  return fields;
}

async function population() {
  const lines = (await download(POPULATION_URL)).toString("latin1").split(/\r?\n/).filter(Boolean);
  const header = csvFields(lines[0]);
  const rows = lines.slice(1).map((line) => Object.fromEntries(csvFields(line).map((value, i) => [header[i], value])));
  const places = PLACES.map(([id, label, sumlev, county, place]) => {
    const match = rows.filter((row) => row.SUMLEV === sumlev && row.COUNTY === county && row.PLACE === place);
    if (match.length !== 1) fail(`${POPULATION_URL}: expected one row for ${label}, found ${match.length}`);
    return { id, label, base2020: Number.parseInt(match[0].ESTIMATESBASE2020, 10), estimate: Number.parseInt(match[0][`POPESTIMATE${VINTAGE}`], 10) };
  });
  return {
    vintage: VINTAGE,
    estimateDate: `${VINTAGE}-07-01`,
    baseDate: "2020-04-01",
    source: { label: `U.S. Census Bureau, Vintage ${VINTAGE} population estimates for cities and towns`, url: POPULATION_PAGE, file: POPULATION_URL },
    places,
  };
}

/** The files of a zip archive, by name, read from its central directory. */
function unzip(data, url) {
  const end = data.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) fail(`${url}: the file has no zip directory`);
  const count = data.readUInt16LE(end + 10);
  let offset = data.readUInt32LE(end + 16);
  const files = new Map();
  for (let i = 0; i < count; i += 1) {
    if (data.readUInt32LE(offset) !== 0x02014b50) fail(`${url}: a damaged zip directory entry`);
    const method = data.readUInt16LE(offset + 10);
    const size = data.readUInt32LE(offset + 20);
    const nameLength = data.readUInt16LE(offset + 28);
    const extraLength = data.readUInt16LE(offset + 30);
    const commentLength = data.readUInt16LE(offset + 32);
    const local = data.readUInt32LE(offset + 42);
    const name = data.toString("utf8", offset + 46, offset + 46 + nameLength);
    const start = local + 30 + data.readUInt16LE(local + 26) + data.readUInt16LE(local + 28);
    const raw = data.subarray(start, start + size);
    if (method !== 0 && method !== 8) fail(`${url}: ${name} uses zip method ${method}`);
    files.set(name, () => (method === 8 ? inflateRawSync(raw) : raw).toString("utf8"));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

const unescapeXml = (text) => text.replace(/&(lt|gt|quot|apos|amp|#\d+|#x[0-9a-f]+);/gi, (_, entity) => {
  const named = { lt: "<", gt: ">", quot: '"', apos: "'", amp: "&" }[entity.toLowerCase()];
  if (named) return named;
  return String.fromCodePoint(entity[1].toLowerCase() === "x" ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10));
});
const textOf = (xml) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((match) => unescapeXml(match[1])).join("");
/** Zero-based column index of a cell reference such as "AB12". */
const columnOf = (ref) => [...ref.replace(/\d+$/, "")].reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;

function xlsxRows(data) {
  if (data.subarray(0, 2).toString() !== "PK") fail(`${FMR_URL}: the server did not return a spreadsheet (got ${JSON.stringify(data.subarray(0, 60).toString())}); open the link in a browser and retry`);
  const files = unzip(data, FMR_URL);
  const sharedXml = files.get("xl/sharedStrings.xml")?.() ?? "";
  const shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) => textOf(match[1]));
  const sheets = [...files.keys()].filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort();
  for (const name of sheets) {
    const rows = [...files.get(name)().matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((row) => {
      const values = [];
      for (const cell of row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attributes = cell[1];
        const ref = attributes.match(/\br="([A-Z]+\d+)"/)?.[1];
        const kind = attributes.match(/\bt="(\w+)"/)?.[1];
        const body = cell[2] ?? "";
        const value = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
        const text = kind === "inlineStr" ? textOf(body) : value === undefined ? "" : kind === "s" ? shared[Number(value)] : unescapeXml(value);
        values[ref ? columnOf(ref) : values.length] = text;
      }
      return Array.from(values, (value) => value ?? "");
    });
    if (rows.length > 0 && rows[0].includes("fmr_2")) return rows;
  }
  fail(`${FMR_URL}: no sheet with an fmr_2 column`);
}

async function fairMarketRent() {
  const rows = xlsxRows(await download(FMR_URL));
  const header = rows[0];
  const col = Object.fromEntries(["stusps", "countyname", "hud_area_name", "fmr_0", "fmr_1", "fmr_2", "fmr_3", "fmr_4"].map((name) => {
    const index = header.indexOf(name);
    if (index < 0) fail(`${FMR_URL}: no ${name} column`);
    return [name, index];
  }));
  const areas = FMR_AREAS.map(([id, label, state, county, hudArea]) => {
    const match = rows.slice(1).filter((row) => row[col.stusps] === state && row[col.countyname] === county);
    if (match.length !== 1) fail(`${FMR_URL}: expected one row for ${county}, ${state}, found ${match.length}`);
    const row = match[0];
    if (row[col.hud_area_name] !== hudArea) fail(`${FMR_URL}: ${county}, ${state} is in ${JSON.stringify(row[col.hud_area_name])}, expected ${JSON.stringify(hudArea)}`);
    return { id, label, hudArea, rents: [0, 1, 2, 3, 4].map((size) => Math.trunc(Number(row[col[`fmr_${size}`]]))) };
  });
  return {
    fiscalYear: FISCAL_YEAR,
    source: { label: `HUD Fair Market Rents, FY${FISCAL_YEAR}`, url: FMR_PAGE, file: FMR_URL },
    areas,
  };
}

/** One BEA regional table (a zip holding `<TABLE>_*.csv`): its rows, data years and last-updated date. */
async function beaTable(url) {
  const data = await download(url);
  if (data.subarray(0, 2).toString() !== "PK") fail(`${url}: the server did not return a zip file`);
  const files = unzip(data, url);
  const csvName = [...files.keys()].find((name) => /^[A-Z]+RPP_[A-Z]+_\d{4}_\d{4}\.csv$/.test(name));
  const notesName = [...files.keys()].find((name) => /RPP__Footnotes\.html$/.test(name));
  if (!csvName || !notesName) fail(`${url}: expected an RPP csv and its footnotes, found ${[...files.keys()].join(", ")}`);
  const lines = files.get(csvName)().split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('"Note') && !line.startsWith("Note"));
  const header = csvFields(lines[0]).map((field) => field.trim());
  const years = header.filter((field) => /^\d{4}$/.test(field));
  const rows = lines.slice(1).map((line) => Object.fromEntries(csvFields(line).map((value, i) => [header[i], value.trim()])));
  const updated = files.get(notesName)().match(/Last updated:\s*([A-Z][a-z]+ \d{1,2}, \d{4})/)?.[1];
  if (!updated) fail(`${url}: no "Last updated" date in ${notesName}`);
  const iso = new Date(`${updated} 12:00 UTC`).toISOString().slice(0, 10);
  return { rows, years, updated: iso };
}

async function priceParities() {
  const tables = new Map();
  for (const url of new Set(RPP_AREAS.map((area) => area[2]))) tables.set(url, await beaTable(url));
  const year = [...tables.values()].map((table) => table.years.at(-1)).reduce((a, b) => (a === b ? a : fail(`BEA tables end in different years: ${a} and ${b}`)));
  const released = [...tables.values()].map((table) => table.updated).sort().at(-1);
  const areas = RPP_AREAS.map(([id, label, url, fips, geoName]) => {
    const rows = tables.get(url).rows.filter((row) => row.GeoFIPS === fips);
    if (rows.length === 0) fail(`${url}: no rows for GeoFIPS ${fips}`);
    if (rows[0].GeoName !== geoName) fail(`${url}: GeoFIPS ${fips} is ${JSON.stringify(rows[0].GeoName)}, expected ${JSON.stringify(geoName)}`);
    const index = {};
    for (const [line, category] of Object.entries(RPP_LINES)) {
      const match = rows.filter((row) => row.LineCode === line);
      const value = Number.parseFloat(match[0]?.[year]);
      if (match.length !== 1 || !Number.isFinite(value)) fail(`${url}: no ${year} value for ${geoName}, line ${line}`);
      index[category] = Math.round(value * 10) / 10;
    }
    return { id, label, index };
  });
  return {
    year: Number(year),
    released,
    source: { label: `U.S. Bureau of Economic Analysis, Regional Price Parities for ${year}, released ${released}`, url: RPP_PAGE, file: RPP_METRO_URL },
    portionFile: RPP_PORTION_URL,
    areas,
  };
}

const check = process.argv.includes("--check");
let current = {};
if (existsSync(TARGET)) {
  try {
    current = JSON.parse(readFileSync(TARGET, "utf8"));
  } catch (error) {
    fail(`cannot read ${TARGET}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
const fresh = { ...current, population: await population(), fairMarketRent: await fairMarketRent(), priceParities: await priceParities() };
const same = ["population", "fairMarketRent", "priceParities"].every((key) => isDeepStrictEqual(current[key], fresh[key]));
const shown = relative(ROOT, TARGET);
if (check) {
  console.log(same ? "area-stats.json matches its sources" : "area-stats.json differs from its sources; run node scripts/area-stats.mjs");
  process.exit(same ? 0 : 1);
}
if (!same) fresh.retrieved = new Date().toISOString().slice(0, 10);
writeFileSync(TARGET, `${JSON.stringify(fresh, null, 2)}\n`);
console.log(same ? `${shown} already matches its sources` : `wrote ${shown}`);
