import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://mtcottages.com",
  output: "static",
  compressHTML: true,
  build: {
    format: "preserve",
    assets: "_astro"
  },
  image: {
    responsiveStyles: true,
    service: { entrypoint: "astro/assets/services/sharp" }
  },
  integrations: [sitemap({
    filter: (page) => !["/404", "/resident-portal", "/pay-rent", "/maintenance", "/emergency-maintenance"].some((route) => page.endsWith(route)),
    serialize(item) {
      const url = new URL(item.url);
      const locationGuides = new Set(["/grantsville", "/marietta", "/parkersburg", "/racine", "/ravenswood"]);
      if (url.pathname !== "/") {
        url.pathname = locationGuides.has(url.pathname) ? `${url.pathname}/index.html` : url.pathname.endsWith("/") ? `${url.pathname}index.html` : `${url.pathname}.html`;
      }
      return { ...item, url: url.toString() };
    }
  })]
});
