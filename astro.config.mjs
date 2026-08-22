import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const broadCottagePath = "/parkersburg/broad-cottage";
const broadCottageIndexableSections = new Set(["gallery", "living-room", "bedroom", "bathroom", "laundry", "amenities", "availability"]);

const shouldIncludeInSitemap = (page) => {
  const pathname = new URL(page).pathname.replace(/\/+$/, "");
  if (pathname === broadCottagePath) return true;
  if (pathname.startsWith(`${broadCottagePath}/`)) {
    return broadCottageIndexableSections.has(pathname.slice(`${broadCottagePath}/`.length));
  }
  return true;
};

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
    filter: (page) => shouldIncludeInSitemap(page) && !["/404", "/resident-portal", "/pay-rent", "/maintenance", "/emergency-maintenance", "/parkersburg/broad-cottage.html"].some((route) => page.endsWith(route)),
    serialize(item) {
      const url = new URL(item.url);
      const micrositeRoot = broadCottagePath;
      if (url.pathname === micrositeRoot || url.pathname.startsWith(`${micrositeRoot}/`)) {
        url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
        return { ...item, url: url.toString() };
      }
      const locationGuides = new Set(["/grantsville", "/marietta", "/parkersburg", "/racine", "/ravenswood"]);
      if (url.pathname !== "/") {
        url.pathname = locationGuides.has(url.pathname) ? `${url.pathname}/index.html` : url.pathname.endsWith("/") ? `${url.pathname}index.html` : `${url.pathname}.html`;
      }
      return { ...item, url: url.toString() };
    }
  })]
});
