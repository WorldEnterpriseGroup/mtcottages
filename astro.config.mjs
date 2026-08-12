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
    responsiveStyles: true
  },
  integrations: [sitemap()]
});
