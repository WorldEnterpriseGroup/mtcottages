#!/usr/bin/env python3
"""Build focal-point crops that match HotelHub's original image geometry.

The untouched property photos remain available for lightboxes.  Images shown
inside HotelHub cards are separate AVIF derivatives with the same pixel size
and aspect ratio as the placeholder used by the purchased theme.
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PROFILES = {
    "breadcrumb": (1920, 586),
    "gallery-card": (648, 470),
    "listing-card": (648, 470),
    "portrait-card": (421, 540),
    "gallery-strip": (240, 240),
    "service-inner": (760, 588),
    "sidebar": (424, 330),
    "mountain-hero": (1920, 820),
    "mountain-about": (551, 596),
    "mountain-hotel-tall": (960, 1105),
    "mountain-hotel-wide": (880, 569),
    "mountain-service": (600, 450),
    "mountain-testimonial": (600, 440),
    "mountain-testimonial-bg": (1920, 660),
    "mountain-blog": (424, 330),
}

# Normalized focal points.  These were chosen from contact-sheet review so a
# crop retains the house/room feature that makes each photograph useful.
FOCAL_POINTS = {
    "assets/images/cottages/marietta-01/exterior.avif": (0.50, 0.48),
    "assets/images/cottages/marietta-01/hero.avif": (0.53, 0.48),
    "assets/images/cottages/marietta-01/gallery-01.avif": (0.50, 0.48),
    "assets/images/cottages/marietta-01/photo-27.avif": (0.46, 0.56),
    "assets/images/cottages/marietta-01/photo-36.avif": (0.58, 0.52),
    "assets/images/cottages/parkersburg-01/photo-01.avif": (0.55, 0.52),
    "assets/images/cottages/parkersburg-01/photo-06.avif": (0.52, 0.50),
    "assets/images/cottages/parkersburg-01/photo-44.avif": (0.51, 0.53),
    "assets/images/cottages/parkersburg-02/photo-09.avif": (0.55, 0.52),
    "assets/images/cottages/parkersburg-02/photo-23.avif": (0.51, 0.55),
    "assets/images/cottages/parkersburg-02/photo-41.avif": (0.50, 0.53),
    "assets/images/cottages/parkersburg-02/photo-49.avif": (0.57, 0.52),
    "assets/images/cottages/parkersburg-03/photo-07.avif": (0.53, 0.33),
    "assets/images/cottages/parkersburg-03/photo-145.avif": (0.58, 0.48),
    "assets/images/cottages/parkersburg-03/photo-448.avif": (0.50, 0.57),
    "assets/images/cottages/parkersburg-03/photo-468.avif": (0.50, 0.42),
    "assets/images/cottages/parkersburg-04/photo-01.avif": (0.52, 0.48),
    "assets/images/cottages/parkersburg-04/photo-05.avif": (0.54, 0.49),
    "assets/images/cottages/parkersburg-04/photo-07.avif": (0.52, 0.48),
    "assets/images/cottages/parkersburg-04/photo-08.avif": (0.56, 0.52),
    "assets/images/cottages/parkersburg-04/photo-23.avif": (0.57, 0.54),
    "assets/images/cottages/ravenswood-01/photo-01.avif": (0.34, 0.48),
    "assets/images/cottages/ravenswood-01/photo-03.avif": (0.47, 0.35),
    "assets/images/cottages/ravenswood-01/photo-165.avif": (0.52, 0.48),
    "assets/images/cottages/ravenswood-01/photo-374.avif": (0.52, 0.55),
    "assets/images/cottages/ravenswood-02/photo-117.avif": (0.54, 0.52),
    "assets/images/cottages/ravenswood-02/photo-55.avif": (0.57, 0.53),
    "assets/images/cottages/ravenswood-03/photo-17.avif": (0.52, 0.54),
    "assets/images/cottages/ravenswood-03/photo-31.avif": (0.55, 0.53),
}


# Homepage roles are explicit because several photographs appear in more than
# one geometry.  Keeping the role in the filename prevents accidental reuse of
# a landscape crop in a portrait HotelHub slot.
HOME_CROPS = [
    # Five visually reviewed homepage hero sources. Each source is reserved for
    # this rotation and must not be allocated to another rendered site slot.
    ("assets/images/cottages/marietta-01/exterior.avif", "mountain-hero", "assets/images/cottages/marietta-01/homepage-hero-frederick.avif"),
    ("assets/images/cottages/parkersburg-04/photo-35.avif", "mountain-hero", "assets/images/cottages/parkersburg-04/homepage-hero-oak-dining.avif"),
    ("assets/images/cottages/parkersburg-03/photo-145.avif", "mountain-hero", "assets/images/cottages/parkersburg-03/homepage-hero-yellow.avif"),
    ("assets/images/cottages/parkersburg-04/photo-01.avif", "mountain-hero", "assets/images/cottages/parkersburg-04/homepage-hero-oak.avif"),
    ("assets/images/cottages/ravenswood-03/photo-31.avif", "mountain-hero", "assets/images/cottages/ravenswood-03/homepage-hero-henrietta-kitchen.avif"),
    ("assets/images/cottages/parkersburg-04/photo-01.avif", "mountain-about", "assets/images/cottages/parkersburg-04/theme-mountain-about.avif"),
    ("assets/images/cottages/marietta-01/gallery-01.avif", "portrait-card", "assets/images/cottages/marietta-01/theme-mountain-card-kitchen.avif"),
    ("assets/images/cottages/parkersburg-04/photo-07.avif", "portrait-card", "assets/images/cottages/parkersburg-04/theme-mountain-card-bedroom.avif"),
    ("assets/images/cottages/parkersburg-02/photo-49.avif", "portrait-card", "assets/images/cottages/parkersburg-02/theme-mountain-card-living.avif"),
    ("assets/images/cottages/ravenswood-03/photo-17.avif", "portrait-card", "assets/images/cottages/ravenswood-03/theme-mountain-card-dining.avif"),
    ("assets/images/cottages/parkersburg-01/photo-44.avif", "portrait-card", "assets/images/cottages/parkersburg-01/theme-mountain-card-living.avif"),
    ("assets/images/cottages/parkersburg-04/photo-01.avif", "mountain-hotel-tall", "assets/images/cottages/parkersburg-04/theme-mountain-hotel-tall.avif"),
    ("assets/images/cottages/marietta-01/photo-27.avif", "mountain-hotel-wide", "assets/images/cottages/marietta-01/theme-mountain-hotel-wide.avif"),
    ("assets/images/cottages/ravenswood-03/photo-31.avif", "mountain-service", "assets/images/cottages/ravenswood-03/theme-mountain-service-kitchen.avif"),
    ("assets/images/cottages/parkersburg-02/photo-49.avif", "mountain-service", "assets/images/cottages/parkersburg-02/theme-mountain-service-living.avif"),
    ("assets/images/cottages/marietta-01/gallery-01.avif", "mountain-service", "assets/images/cottages/marietta-01/theme-mountain-service-kitchen.avif"),
    ("assets/images/cottages/parkersburg-04/photo-05.avif", "mountain-testimonial", "assets/images/cottages/parkersburg-04/theme-mountain-testimonial.avif"),
    ("assets/images/cottages/ravenswood-01/photo-01.avif", "mountain-testimonial-bg", "assets/images/cottages/ravenswood-01/theme-mountain-testimonial-bg.avif"),
    ("assets/images/cottages/marietta-01/photo-36.avif", "mountain-blog", "assets/images/cottages/marietta-01/theme-mountain-blog-bedroom.avif"),
    ("assets/images/cottages/parkersburg-04/photo-08.avif", "mountain-blog", "assets/images/cottages/parkersburg-04/theme-mountain-blog-kitchen.avif"),
    ("assets/images/cottages/ravenswood-03/photo-17.avif", "mountain-blog", "assets/images/cottages/ravenswood-03/theme-mountain-blog-dining.avif"),
]

# Named property crops keep long-lived public URLs stable while allowing a
# reviewed, house-isolated source to replace a previously misidentified image.
# Frederick Cottage's old ``hero.avif`` is a lake, so none of its house-facing
# cards or breadcrumbs should be derived from that source.
PROPERTY_CROPS = [
    ("assets/images/cottages/marietta-01/exterior.avif", "breadcrumb", "assets/images/cottages/marietta-01/theme-breadcrumb-hero.avif"),
    ("assets/images/cottages/marietta-01/exterior.avif", "gallery-card", "assets/images/cottages/marietta-01/theme-gallery-card-hero.avif"),
    ("assets/images/cottages/marietta-01/exterior.avif", "portrait-card", "assets/images/cottages/marietta-01/theme-portrait-card-hero.avif"),
    ("assets/images/cottages/parkersburg-02/photo-38.avif", "gallery-strip", "assets/images/cottages/parkersburg-02/theme-gallery-strip-photo-38.avif"),
]


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def crop_path(source: Path, profile: str) -> Path:
    return source.with_name(f"theme-{profile}-{source.stem}.avif")


def build_crop(source: Path, destination: Path, profile: str) -> None:
    width, height = PROFILES[profile]
    source_key = relative(source)
    focal = FOCAL_POINTS.get(source_key, (0.5, 0.5))
    if destination.is_file() and destination.stat().st_mtime >= source.stat().st_mtime:
        return

    horizontal = "West" if focal[0] < 0.4 else "East" if focal[0] > 0.6 else "Center"
    vertical = "North" if focal[1] < 0.4 else "South" if focal[1] > 0.6 else "Center"
    gravity = vertical + horizontal if horizontal != "Center" and vertical != "Center" else horizontal if vertical == "Center" else vertical
    destination.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "magick",
            str(source),
            "-auto-orient",
            "-resize",
            f"{width}x{height}^",
            "-gravity",
            gravity,
            "-extent",
            f"{width}x{height}",
            "-quality",
            "52",
            str(destination),
        ],
        check=True,
    )


def themed_source(source_text: str, profile: str) -> str:
    if Path(source_text).name.startswith("theme-"):
        return source_text
    source = ROOT / source_text
    if not source.is_file():
        raise FileNotFoundError(source)
    destination = crop_path(source, profile)
    build_crop(source, destination, profile)
    return relative(destination)


def replace_image_context(text: str, class_name: str, profile: str) -> str:
    pattern = re.compile(
        rf'(<div\s+class="[^"]*\b{re.escape(class_name)}\b[^"]*">\s*'
        rf'(?:<a\b[^>]*>\s*)?<img\b[^>]*?src=")'
        r'(assets/images/cottages/[^"?]+)',
        re.S,
    )
    return pattern.sub(lambda match: match.group(1) + themed_source(match.group(2), profile), text)


def rewrite_pages() -> int:
    changed = 0
    for page in sorted(ROOT.glob("*.html")):
        text = page.read_text(encoding="utf-8")
        updated = text
        updated = replace_image_context(updated, "choose-single-thumb", "portrait-card")
        updated = replace_image_context(updated, "choose-single-thumbs", "gallery-card")
        updated = replace_image_context(updated, "galary-img", "gallery-strip")
        updated = replace_image_context(updated, "service_inner_thumb", "service-inner")
        updated = replace_image_context(updated, "content-thumb-box", "sidebar")

        # Breadcrumb photography is a 1920x586 HotelHub slot.  This deliberately
        # excludes CSS backgrounds and the Mountain homepage's 1920x820 hero.
        background = re.compile(
            r"(<div\s+class=\"[^\"]*\bbreatcome-section\b[^\"]*\"[^>]*?"
            r"background-image:\s*url\(['\"]?)"
            r"(assets/images/cottages/[^)'\"]+)"
            r"(['\"]?\)[^>]*>)",
            re.S,
        )
        updated = background.sub(
            lambda match: match.group(1)
            + themed_source(match.group(2), "breadcrumb")
            + match.group(3),
            updated,
        )

        # The original rooms template relies on its 648x470 source ratio.  Old
        # inline 280px overrides flattened that geometry and are no longer used.
        updated = updated.replace(
            ' style="width:100%;height:280px;object-fit:cover;"', ""
        )
        if updated != text:
            page.write_text(updated, encoding="utf-8")
            changed += 1
    return changed


def main() -> None:
    for source_text, profile, destination_text in HOME_CROPS + PROPERTY_CROPS:
        build_crop(ROOT / source_text, ROOT / destination_text, profile)
    changed = rewrite_pages()
    print(f"Built HotelHub crops and updated {changed} HTML files.")


if __name__ == "__main__":
    main()
