import type { APIRoute } from "astro";
import { hubHref } from "../data/insuranceHub";

// The generic /insurance-housing.html guide was deepened and re-targeted as the
// insurance and ALE hub (#42, groomed 2026-11-15: one page, not two competing
// ones). The old URL stays reachable for existing links and bookmarks as a small
// noindex meta-refresh page that canonicalises to the hub, so it never enters the
// sitemap. Same stub shape as src/pages/health-professionals.html.ts.
export const GET: APIRoute = () => {
  const html = `<!doctype html><html lang="en-US"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Insurance housing has moved</title><meta http-equiv="refresh" content="0;url=${hubHref}"><meta name="robots" content="noindex"><link rel="canonical" href="https://mtcottages.com${hubHref}"></head><body><p><a href="${hubHref}">Insurance housing has moved to its own page</a></p></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
};
