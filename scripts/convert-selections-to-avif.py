#!/usr/bin/env python3
"""
Convert selected staging photos to AVIF for web publishing.

Reads _data/photo-selections.json and converts all selected hero + gallery
photos from staging originals into assets/images/cottages/{house-id}/.
"""
import json, os, sys
from pathlib import Path
from PIL import Image

REPO_DIR = Path(__file__).parent.parent
STAGING_DIR = REPO_DIR / "sharepoint-download-staging"
PUBLISHED_DIR = REPO_DIR / "assets/images/cottages"
SELECTIONS_FILE = REPO_DIR / "_data/photo-selections.json"
AVIF_QUALITY = 40
TARGET_MAX_WIDTH = 1920


def convert_to_avif(src_path, dst_avif, dst_jpg, max_width=TARGET_MAX_WIDTH):
    """Resize source photo and save as AVIF + JPG."""
    img = Image.open(src_path)
    img = img.convert("RGB")

    w, h = img.size
    if w > max_width:
        ratio = max_width / w
        img = img.resize((max_width, int(h * ratio)), Image.LANCZOS)

    # Ensure output directory exists
    dst_avif.parent.mkdir(parents=True, exist_ok=True)

    # Save AVIF
    img.save(str(dst_avif), format="AVIF", quality=AVIF_QUALITY)
    avif_size = dst_avif.stat().st_size

    # Save JPG fallback
    img.save(str(dst_jpg), format="JPEG", quality=85)
    jpg_size = dst_jpg.stat().st_size

    return avif_size, jpg_size


def main():
    if not SELECTIONS_FILE.exists():
        print(f"ERROR: {SELECTIONS_FILE} not found. Run select-photos.py first.")
        sys.exit(1)

    selections = json.loads(SELECTIONS_FILE.read_text())
    total = 0
    skipped = 0

    for house_id, sel in sorted(selections.items()):
        if not sel.get("hero") and not sel.get("gallery"):
            continue

        house_pub_dir = PUBLISHED_DIR / house_id

        # Skip if AVIFs already exist for this house
        if house_pub_dir.is_dir() and list(house_pub_dir.glob("*.avif")):
            print(f"{house_id}: AVIFs already exist, skipping")
            skipped += 1
            continue

        # Collect all unique source photo filenames needed
        needed = set()
        if sel.get("hero") and sel["hero"].get("file"):
            needed.add(sel["hero"]["file"])
        for g in sel.get("gallery", []):
            if g.get("file"):
                needed.add(g["file"])
        if sel.get("card") and sel["card"].get("file"):
            needed.add(sel["card"]["file"])

        if not needed:
            continue

        house_staging_dir = STAGING_DIR / house_id
        count = 0

        print(f"\n=== {house_id} ({sel.get('name', '')}) ===")

        for stem in sorted(needed):
            # Find the source file (handle .jpg, .jpeg, .png variants)
            src_path = None
            stem_no_ext = Path(stem).stem
            for ext in [".jpg", ".jpeg", ".png"]:
                candidate = house_staging_dir / f"{stem_no_ext}{ext}"
                if candidate.is_file():
                    src_path = candidate
                    break

            if src_path is None:
                # Try glob fallback
                matches = list(house_staging_dir.glob(f"{stem_no_ext}.*"))
                if matches:
                    src_path = matches[0]
                else:
                    print(f"  WARNING: {stem} not found in staging")
                    continue

            # Output: same stem with .avif extension
            dst_avif = house_pub_dir / f"{stem_no_ext}.avif"
            dst_jpg = house_pub_dir / f"{stem_no_ext}.jpg"

            print(f"  {stem_no_ext}.avif ... ", end="", flush=True)
            try:
                avif_sz, jpg_sz = convert_to_avif(src_path, dst_avif, dst_jpg)
                print(f"OK ({avif_sz // 1024}KB AVIF + {jpg_sz // 1024}KB JPG)")
                count += 1
                total += 1
            except Exception as e:
                print(f"FAILED: {e}")

        print(f"  -> {count} photos generated")

    print(f"\n=== Done: {total} AVIFs generated, {skipped} houses skipped ===")


if __name__ == "__main__":
    main()
