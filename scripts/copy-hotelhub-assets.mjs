import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(projectRoot, "dist");

if (!existsSync(outputDirectory)) {
  throw new Error("Astro did not create dist before the HotelHub asset copy step.");
}

for (const directory of ["assets", "venobox", "font"]) {
  const source = resolve(projectRoot, directory);
  if (!existsSync(source)) continue;

  const destination = resolve(outputDirectory, directory);
  mkdirSync(destination, { recursive: true });
  cpSync(source, destination, { recursive: true });
}
