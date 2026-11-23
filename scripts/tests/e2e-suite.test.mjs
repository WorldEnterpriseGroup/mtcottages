// Every Playwright spec runs in CI (WorldEnterpriseGroup/mtcottages#76).
// site-check runs `npm --prefix e2e test`, a fixed list of spec files, so a new
// spec left off that list never runs: #76's confirmation spec and #79's
// cottage-browser spec both shipped that way. A spec is either on the list or
// named below with the CI job that runs it instead.
// Run: node --test scripts/tests/e2e-suite.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

// Specs that run in their own job against a live or synthetic target (.gitlab-ci.yml).
const OWN_JOB = new Map([
  ["live.spec.js", "site-check (microsite grep) and the post-deploy live smoke"],
  ["live-turnstile.spec.js", "the post-deploy live smoke (headed, worker-scoped launch)"],
  ["live-turnstile-age.spec.js", "probe:turnstile-age"],
  ["synthetic-inquiry.spec.js", "synthetic:inquiry"],
]);

const script = JSON.parse(read("e2e/package.json")).scripts.test;
const listed = [...script.matchAll(/tests\/([\w.-]+\.spec\.js)/g)].map((match) => match[1]);
const onDisk = readdirSync(new URL("../../e2e/tests/", import.meta.url)).filter((name) => name.endsWith(".spec.js"));

test("the e2e suite lists spec files", () => {
  assert.ok(listed.length >= 10, `found ${listed.length} specs in e2e/package.json`);
  assert.equal(new Set(listed).size, listed.length, "a spec is listed twice");
});

test("every spec on disk runs in CI", () => {
  const missing = onDisk.filter((name) => !listed.includes(name) && !OWN_JOB.has(name));
  assert.deepEqual(missing, [], "add these to the test script in e2e/package.json, or to OWN_JOB with the job that runs them");
});

test("every listed or own-job spec exists", () => {
  for (const name of [...listed, ...OWN_JOB.keys()]) assert.ok(onDisk.includes(name), `${name} is named but not in e2e/tests`);
});

test("own-job specs are not also in the site-check list", () => {
  for (const name of OWN_JOB.keys()) assert.ok(!listed.includes(name), name);
});
