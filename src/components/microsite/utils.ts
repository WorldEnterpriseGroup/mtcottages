export function micrositeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

export function micrositeHeadingId(prefix: string, value: string): string {
  return `${micrositeSlug(prefix)}-${micrositeSlug(value)}`;
}
