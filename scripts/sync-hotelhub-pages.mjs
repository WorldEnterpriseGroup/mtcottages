import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const astroPages = resolve(projectRoot, "src/pages");
const pageDirectories = ["grantsville", "marietta", "parkersburg", "racine", "ravenswood"];

function syncPage(source, destination) {
  mkdirSync(dirname(destination), { recursive: true });
  const sourceText = readFileSync(source, "utf8").replace(/[ \t]+$/gm, "");
  writeFileSync(destination, sourceText);
}

for (const entry of readdirSync(projectRoot)) {
  const source = resolve(projectRoot, entry);
  if (entry.endsWith(".html") && statSync(source).isFile()) {
    syncPage(source, resolve(astroPages, entry));
  }
}

for (const directory of pageDirectories) {
  const sourceDirectory = resolve(projectRoot, directory);
  for (const entry of readdirSync(sourceDirectory)) {
    const source = resolve(sourceDirectory, entry);
    if (entry.endsWith(".html") && statSync(source).isFile()) {
      syncPage(source, resolve(astroPages, directory, entry));
    }
  }
}
