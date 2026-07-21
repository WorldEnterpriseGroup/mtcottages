#!/usr/bin/env bash
#
# convert-heic-to-jpg.sh
#
# Scans sharepoint-download-staging/ for HEIC/HEIF files (common on photos
# imported straight off an iPhone) and converts each to a same-basename JPG
# alongside the original, using ImageMagick's `magick`. The NIM analysis
# pipeline (scripts/analyze_photos_nim.py) only looks at .jpg/.jpeg/.png/
# .webp/.avif, so any HEIC left unconverted is silently skipped from
# analysis and the photo index.
#
# -auto-orient bakes in EXIF rotation so downstream tools that don't honor
# EXIF orientation (e.g. PIL-based resizing) don't produce sideways images.
#
# Idempotent: skips any source file whose same-basename .jpg or .jpeg
# already exists. Never deletes or moves the original .heic/.heif.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGING_DIR="${PROJECT_ROOT}/sharepoint-download-staging"

if [ ! -d "$STAGING_DIR" ]; then
  echo "ERROR: $STAGING_DIR does not exist" >&2
  exit 1
fi

if ! command -v magick &>/dev/null; then
  echo "ERROR: ImageMagick 'magick' command not found. Install ImageMagick with HEIC support." >&2
  exit 1
fi

if ! magick -list format 2>/dev/null | grep -qi '^ *HEIC'; then
  echo "ERROR: ImageMagick build has no HEIC read support." >&2
  exit 1
fi

converted=0
skipped=0
failed=0

while IFS= read -r -d '' src; do
  dir="$(dirname "$src")"
  base="$(basename "$src")"
  name="${base%.*}"
  dst="${dir}/${name}.jpg"
  dst_alt="${dir}/${name}.jpeg"

  if [ -f "$dst" ] || [ -f "$dst_alt" ]; then
    echo "  SKIP $src (JPG counterpart already exists)"
    skipped=$((skipped + 1))
    continue
  fi

  echo "  CONVERT ${src} -> ${dst}"

  if magick "$src" -auto-orient -quality 92 "$dst"; then
    converted=$((converted + 1))
  else
    echo "  FAILED: magick on $src" >&2
    failed=$((failed + 1))
  fi
done < <(find "$STAGING_DIR" -type f \( -iname '*.heic' -o -iname '*.heif' \) -print0)

echo ""
echo "Done. Converted: $converted | Skipped: $skipped | Failed: $failed"
