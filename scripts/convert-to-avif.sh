#!/usr/bin/env bash
#
# convert-to-avif.sh
#
# Scans assets/images/cottages/ for JPG/PNG files and converts each to AVIF
# alongside the original, using avifenc at quality 65 (preferred) or
# ImageMagick convert as fallback.
#
# Idempotent: skips any source file whose corresponding .avif already exists.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COTTAGES_DIR="${PROJECT_ROOT}/assets/images/cottages"

if [ ! -d "$COTTAGES_DIR" ]; then
  echo "ERROR: $COTTAGES_DIR does not exist" >&2
  exit 1
fi

# Pick the best available encoder
ENCODER=""
if command -v avifenc &>/dev/null; then
  ENCODER="avifenc"
elif command -v convert &>/dev/null && convert -list format 2>/dev/null | grep -qi " AVIF "; then
  ENCODER="convert"
fi

if [ -z "$ENCODER" ]; then
  echo "ERROR: No AVIF encoder found. Install avifenc (libavif-bin) or ImageMagick with AVIF support." >&2
  exit 1
fi

echo "Using encoder: $ENCODER"

converted=0
skipped=0
failed=0

while IFS= read -r -d '' src; do
  dir="$(dirname "$src")"
  base="$(basename "$src")"
  name="${base%.*}"
  dst="${dir}/${name}.avif"

  if [ -f "$dst" ]; then
    echo "  SKIP $dst (already exists)"
    skipped=$((skipped + 1))
    continue
  fi

  echo "  CONVERT ${src} -> ${dst}"

  case "$ENCODER" in
    avifenc)
      if avifenc -q 65 -s 4 -j all --no-overwrite "$src" "$dst" 2>/dev/null; then
        converted=$((converted + 1))
      else
        echo "  FAILED: avifenc on $src" >&2
        failed=$((failed + 1))
      fi
      ;;
    convert)
      if convert "$src" -quality 65 "AVIF:${dst}" 2>/dev/null; then
        converted=$((converted + 1))
      else
        echo "  FAILED: convert on $src" >&2
        failed=$((failed + 1))
      fi
      ;;
  esac
done < <(find "$COTTAGES_DIR" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0)

echo ""
echo "Done. Converted: $converted | Skipped: $skipped | Failed: $failed"
