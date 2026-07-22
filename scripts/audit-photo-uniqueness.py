#!/usr/bin/env python3
"""Audit and deterministically plan unique property photography site-wide.

Only rendered cottage photography counts: ``img``/``source`` elements, inline
or stylesheet backgrounds, and the explicit homepage hero rotation. A
lightbox ``href`` paired with its one rendered crop is intentionally not a
second slot. HotelHub logos, icons, and decorative assets are out of scope.

The audit resolves generated crop filenames back to their isolated original,
so two differently named crops of one photograph are still reported as a
repeat. It also calculates a small decoded-pixel fingerprint to catch copies
that were transcoded or renamed without a source-manifest entry.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import posixpath
import re
import sys
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from functools import lru_cache
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
COTTAGE_MARKER = "assets/images/cottages/"
EXCLUDED_PARTS = {
    ".git",
    ".github",
    ".claude",
    ".playwright-mcp",
    ".ruff_cache",
    ".venv",
    "e2e",
    "infra",
    "sharepoint-download-staging",
    "template",
}
PROFILE_NAMES = (
    "mountain-testimonial-bg",
    "mountain-hotel-tall",
    "mountain-hotel-wide",
    "mountain-testimonial",
    "mountain-service",
    "mountain-hero",
    "mountain-about",
    "mountain-blog",
    "service-inner",
    "portrait-card",
    "listing-card",
    "gallery-strip",
    "gallery-card",
    "breadcrumb",
    "sidebar",
)

# User-rejected sources are excluded at the original level, not merely at the
# rejected crop filename. Frederick's old hero is the pond photograph.
REJECTED_SOURCES = {
    "assets/images/cottages/marietta-01/hero.avif",
    "assets/images/cottages/parkersburg-02/photo-23.avif",
    "assets/images/cottages/ravenswood-01/photo-01.avif",
}
UNSUITABLE_DESCRIPTION_TERMS = {
    "breaker",
    "construction",
    "damage",
    "debris",
    "electrical box",
    "electrical panel",
    "fuse",
    "hole in",
    "maintenance",
    "pvc pipe",
    "utility meter",
}

HOMEPAGE_RESERVATIONS = {
    "assets/images/cottages/marietta-01/homepage-hero-frederick.avif":
        "assets/images/cottages/marietta-01/exterior.avif",
    "assets/images/cottages/parkersburg-03/homepage-hero-yellow.avif":
        "assets/images/cottages/parkersburg-03/photo-145.avif",
    "assets/images/cottages/parkersburg-04/homepage-hero-oak.avif":
        "assets/images/cottages/parkersburg-04/photo-01.avif",
    "assets/images/cottages/parkersburg-04/homepage-hero-oak-dining.avif":
        "assets/images/cottages/parkersburg-04/photo-35.avif",
    "assets/images/cottages/ravenswood-03/homepage-hero-henrietta-kitchen.avif":
        "assets/images/cottages/ravenswood-03/photo-31.avif",
}
RESERVED_SOURCES = set(HOMEPAGE_RESERVATIONS.values())

PROPERTY_PAGE_HOUSES = {
    "marietta/frederick-cottage.html": "marietta-01",
    "parkersburg/broad-cottage.html": "parkersburg-01",
    "parkersburg/buck-apartment-1.html": "parkersburg-02",
    "parkersburg/oak-cottage.html": "parkersburg-04",
    "parkersburg/yellow-cottage.html": "parkersburg-03",
    "ravenswood/gallatin-cottage.html": "ravenswood-04",
    "ravenswood/henrietta-cottage.html": "ravenswood-03",
    "ravenswood/sand-cottage.html": "ravenswood-05",
    "ravenswood/virginia-cottage.html": "ravenswood-02",
    "ravenswood/white-cottage.html": "ravenswood-01",
}
PROPERTY_CONTEXT_MARKERS = (
    ("broad street house", "parkersburg-04"),
    ("oak cottage", "parkersburg-04"),
    ("parkersburg/oak-cottage", "parkersburg-04"),
    ("parkersburg-04.html", "parkersburg-04"),
    ("broad street cottage", "parkersburg-01"),
    ("parkersburg/broad-cottage", "parkersburg-01"),
    ("parkersburg-01.html", "parkersburg-01"),
    ("buck cottage", "parkersburg-02"),
    ("45th street house", "parkersburg-02"),
    ("parkersburg/buck-apartment-1", "parkersburg-02"),
    ("parkersburg-02.html", "parkersburg-02"),
    ("yellow cottage", "parkersburg-03"),
    ("32nd street cottage", "parkersburg-03"),
    ("parkersburg/yellow-cottage", "parkersburg-03"),
    ("parkersburg-03.html", "parkersburg-03"),
    ("frederick house", "marietta-01"),
    ("frederick cottage", "marietta-01"),
    ("marietta/frederick-cottage", "marietta-01"),
    ("marietta-01.html", "marietta-01"),
    ("white cottage", "ravenswood-01"),
    ("walnut cottage", "ravenswood-01"),
    ("ravenswood/white-cottage", "ravenswood-01"),
    ("ravenswood-01.html", "ravenswood-01"),
    ("virginia cottage", "ravenswood-02"),
    ("virginia street house", "ravenswood-02"),
    ("ravenswood/virginia-cottage", "ravenswood-02"),
    ("ravenswood-02.html", "ravenswood-02"),
    ("henrietta cottage", "ravenswood-03"),
    ("ravenswood/henrietta-cottage", "ravenswood-03"),
    ("ravenswood-03.html", "ravenswood-03"),
)

# Older hand-named HotelHub crops cannot be inferred from their basename.
# Keeping this public-safe provenance map lets the audit catch reuse across
# different geometries without exposing SharePoint paths or street addresses.
SPECIAL_SOURCE_ALIASES = {
    **HOMEPAGE_RESERVATIONS,
    "assets/images/cottages/marietta-01/theme-mountain-card-kitchen.avif": "assets/images/cottages/marietta-01/gallery-01.avif",
    "assets/images/cottages/marietta-01/theme-mountain-service-kitchen.avif": "assets/images/cottages/marietta-01/gallery-01.avif",
    "assets/images/cottages/marietta-01/theme-mountain-hotel-wide.avif": "assets/images/cottages/marietta-01/photo-27.avif",
    "assets/images/cottages/marietta-01/theme-mountain-blog-bedroom.avif": "assets/images/cottages/marietta-01/photo-36.avif",
    "assets/images/cottages/parkersburg-01/theme-mountain-card-living.avif": "assets/images/cottages/parkersburg-01/photo-44.avif",
    "assets/images/cottages/parkersburg-02/theme-mountain-card-living.avif": "assets/images/cottages/parkersburg-02/photo-49.avif",
    "assets/images/cottages/parkersburg-02/theme-mountain-service-living.avif": "assets/images/cottages/parkersburg-02/photo-49.avif",
    "assets/images/cottages/parkersburg-04/theme-mountain-about.avif": "assets/images/cottages/parkersburg-04/photo-01.avif",
    "assets/images/cottages/parkersburg-04/theme-mountain-hotel-tall.avif": "assets/images/cottages/parkersburg-04/photo-01.avif",
    "assets/images/cottages/parkersburg-04/theme-mountain-card-bedroom.avif": "assets/images/cottages/parkersburg-04/photo-07.avif",
    "assets/images/cottages/parkersburg-04/theme-mountain-testimonial.avif": "assets/images/cottages/parkersburg-04/photo-05.avif",
    "assets/images/cottages/parkersburg-04/theme-mountain-blog-kitchen.avif": "assets/images/cottages/parkersburg-04/photo-08.avif",
    "assets/images/cottages/ravenswood-01/theme-mountain-hero.avif": "assets/images/cottages/ravenswood-01/photo-01.avif",
    "assets/images/cottages/ravenswood-01/theme-mountain-testimonial-bg.avif": "assets/images/cottages/ravenswood-01/photo-01.avif",
    "assets/images/cottages/ravenswood-03/theme-mountain-card-dining.avif": "assets/images/cottages/ravenswood-03/photo-17.avif",
    "assets/images/cottages/ravenswood-03/theme-mountain-blog-dining.avif": "assets/images/cottages/ravenswood-03/photo-17.avif",
    "assets/images/cottages/ravenswood-03/theme-mountain-service-kitchen.avif": "assets/images/cottages/ravenswood-03/photo-31.avif",
}
RENDER_MANIFEST = ROOT / "_data/photo-render-manifest.json"

URL_RE = re.compile(r"url\(\s*['\"]?([^)'\"\s]+)['\"]?\s*\)", re.I)
HERO_PATH_RE = re.compile(
    r"['\"]((?:\.\./)*assets/images/cottages/[^'\"]*homepage-hero-[^'\"]+\.avif)['\"]"
)


@dataclass(frozen=True)
class RenderRef:
    page: str
    kind: str
    url: str
    path: str
    line: int
    tag: str = ""
    classes: str = ""


class CottageHTMLParser(HTMLParser):
    def __init__(self, page: Path) -> None:
        super().__init__(convert_charrefs=True)
        self.page = page
        self.refs: list[RenderRef] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        line = self.getpos()[0]
        classes = values.get("class", "")
        if tag == "img" and values.get("src"):
            self._append(values["src"], "img", line, tag, classes)
        elif tag == "source":
            for item in values.get("srcset", "").split(","):
                candidate = item.strip().split(" ", 1)[0]
                if candidate:
                    self._append(candidate, "source", line, tag, classes)
        for url in URL_RE.findall(values.get("style", "")):
            self._append(url, "background", line, tag, classes)

    def _append(self, url: str, kind: str, line: int, tag: str, classes: str) -> None:
        path = normalize_url(self.page, url)
        if path:
            self.refs.append(
                RenderRef(relative(self.page), kind, url, path, line, tag, classes)
            )


def relative(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def normalize_url(owner: Path, url: str) -> str | None:
    clean = url.split("?", 1)[0].split("#", 1)[0].strip()
    if COTTAGE_MARKER not in clean or clean.startswith(("http://", "https://", "//")):
        return None
    candidate = (owner.parent / clean).resolve()
    try:
        return candidate.relative_to(ROOT).as_posix()
    except ValueError:
        return None


def published_html() -> list[Path]:
    pages = []
    for path in ROOT.rglob("*.html"):
        if any(part in EXCLUDED_PARTS for part in path.relative_to(ROOT).parts):
            continue
        pages.append(path)
    return sorted(pages)


def rendered_refs() -> list[RenderRef]:
    refs: list[RenderRef] = []
    for page in published_html():
        text = page.read_text(encoding="utf-8")
        parser = CottageHTMLParser(page)
        parser.feed(text)
        refs.extend(parser.refs)
        known = {(ref.path, ref.kind) for ref in parser.refs}
        for match in HERO_PATH_RE.finditer(text):
            path = normalize_url(page, match.group(1))
            if path and (path, "hero-rotation") not in known:
                line = text.count("\n", 0, match.start()) + 1
                refs.append(
                    RenderRef(relative(page), "hero-rotation", match.group(1), path, line)
                )

    for stylesheet in sorted((ROOT / "assets/css").glob("*.css")):
        text = stylesheet.read_text(encoding="utf-8")
        for match in URL_RE.finditer(text):
            path = normalize_url(stylesheet, match.group(1))
            if path:
                line = text.count("\n", 0, match.start()) + 1
                refs.append(
                    RenderRef(relative(stylesheet), "css-background", match.group(1), path, line)
                )
    # The CSS URL is the no-JavaScript fallback for the same homepage rotation
    # slot, not a second rendered use of the Frederick source.
    return [
        ref
        for ref in refs
        if not (ref.kind == "css-background" and ref.path in HOMEPAGE_RESERVATIONS)
    ]


@lru_cache(maxsize=1)
def render_aliases() -> dict[str, str]:
    if RENDER_MANIFEST.is_file():
        try:
            rendered = json.loads(RENDER_MANIFEST.read_text(encoding="utf-8"))
            return {
                path: entry["source"]
                for path, entry in rendered.get("assets", {}).items()
                if entry.get("source")
            }
        except (OSError, json.JSONDecodeError):
            pass
    return {}


def source_for(path: str) -> str:
    if path in render_aliases():
        return render_aliases()[path]
    if path in SPECIAL_SOURCE_ALIASES:
        return SPECIAL_SOURCE_ALIASES[path]
    file_path = Path(path)
    name = file_path.name
    if name.startswith("theme-"):
        remainder = name.removeprefix("theme-")
        for profile in PROFILE_NAMES:
            prefix = profile + "-"
            if remainder.startswith(prefix):
                original = file_path.with_name(remainder.removeprefix(prefix))
                if (ROOT / original).is_file():
                    return original.as_posix()
    return path


def decoded_fingerprint(path: str) -> str | None:
    image_path = ROOT / path
    if not image_path.is_file():
        return None
    try:
        with Image.open(image_path) as image:
            image = ImageOps.exif_transpose(image).convert("L").resize((16, 16))
            getter = getattr(image, "get_flattened_data", image.getdata)
            pixels = list(getter())
        average = sum(pixels) / len(pixels)
        bits = "".join("1" if value >= average else "0" for value in pixels)
        return f"{int(bits, 2):064x}"
    except Exception:
        return None


@lru_cache(maxsize=None)
def image_dimensions(path: str) -> tuple[int, int] | None:
    try:
        with Image.open(ROOT / path) as image:
            return image.size
    except Exception:
        return None


def eligible_inventory(allow_adequate: bool = False) -> dict[str, list[dict]]:
    index = json.loads((ROOT / "_data/photo-index.json").read_text(encoding="utf-8"))
    qualities = {"excellent", "good"}
    if allow_adequate:
        qualities.add("adequate")
    inventory: dict[str, list[dict]] = {}
    for house_id, house in sorted(index.get("staging", {}).items()):
        candidates = []
        seen_bytes: set[str] = set()
        for filename, data in sorted(house.get("photos", {}).items()):
            public_source = f"assets/images/cottages/{house_id}/{Path(filename).stem}.avif"
            if public_source in REJECTED_SOURCES:
                continue
            if data.get("nim_quality") not in qualities:
                continue
            if data.get("nim_has_people") or data.get("nim_best_for") == "skip":
                continue
            if data.get("nim_error") or not data.get("nim_room_type"):
                continue
            review_text = " ".join(
                [
                    str(data.get("nim_description", "")),
                    str(data.get("nim_features", "")),
                    " ".join(data.get("nim_tags", []) or []),
                ]
            ).lower()
            if any(term in review_text for term in UNSUITABLE_DESCRIPTION_TERMS):
                continue
            staging_path = ROOT / "sharepoint-download-staging" / house_id / filename
            if not staging_path.is_file():
                continue
            digest = hashlib.sha256(staging_path.read_bytes()).hexdigest()
            if digest in seen_bytes:
                continue
            seen_bytes.add(digest)
            candidates.append(
                {
                    "house_id": house_id,
                    "file": filename,
                    "source": public_source,
                    "quality": data.get("nim_quality"),
                    "room_type": data.get("nim_room_type"),
                    "best_for": data.get("nim_best_for"),
                    "description": data.get("nim_description", ""),
                    "width": data.get("width"),
                    "height": data.get("height"),
                    "reserved": public_source in RESERVED_SOURCES,
                }
            )
        inventory[house_id] = candidates
    return inventory


def audit_payload(allow_adequate: bool = False) -> dict:
    refs = rendered_refs()
    by_source: dict[str, list[RenderRef]] = defaultdict(list)
    missing = []
    for ref in refs:
        by_source[source_for(ref.path)].append(ref)
        if not (ROOT / ref.path).is_file():
            missing.append(asdict(ref))

    path_fingerprints: dict[str, str] = {}
    for path in sorted({ref.path for ref in refs}):
        fingerprint = decoded_fingerprint(path)
        if fingerprint:
            path_fingerprints[path] = fingerprint
    by_fingerprint: dict[str, list[str]] = defaultdict(list)
    for path, fingerprint in path_fingerprints.items():
        by_fingerprint[fingerprint].append(path)

    inventory = eligible_inventory(allow_adequate=allow_adequate)
    duplicate_sources = {
        source: [asdict(ref) for ref in source_refs]
        for source, source_refs in sorted(by_source.items())
        if len(source_refs) > 1
    }
    pixel_aliases = {
        fingerprint: paths
        for fingerprint, paths in sorted(by_fingerprint.items())
        if len(paths) > 1 and len({source_for(path) for path in paths}) > 1
    }
    return {
        "published_pages": [relative(path) for path in published_html()],
        "rendered_slot_count": len(refs),
        "rendered_path_count": len({ref.path for ref in refs}),
        "visual_source_count": len(by_source),
        "duplicate_source_count": len(duplicate_sources),
        "duplicate_sources": duplicate_sources,
        "decoded_pixel_aliases": pixel_aliases,
        "missing": missing,
        "rejected_render_refs": [
            asdict(ref) for ref in refs if source_for(ref.path) in REJECTED_SOURCES
        ],
        "inventory_counts": {house: len(items) for house, items in inventory.items()},
        "inventory_total": sum(len(items) for items in inventory.values()),
        "reserved_homepage_sources": sorted(RESERVED_SOURCES),
    }


def allocation_plan(allow_adequate: bool = False) -> dict:
    refs = rendered_refs()
    inventory = eligible_inventory(allow_adequate=allow_adequate)
    candidates_by_house = {
        house: [item for item in items if not item["reserved"]]
        for house, items in inventory.items()
    }
    all_candidates = [
        item for house in sorted(candidates_by_house) for item in candidates_by_house[house]
    ]
    used_sources = set(RESERVED_SOURCES)
    planned: dict[int, dict | None] = {}

    page_lines = {
        relative(page): page.read_text(encoding="utf-8").lower().splitlines()
        for page in published_html()
    }

    def contextual_house(ref: RenderRef) -> str | None:
        if ref.page in PROPERTY_PAGE_HOUSES:
            return PROPERTY_PAGE_HOUSES[ref.page]
        if ref.kind != "img":
            return None
        lines = page_lines.get(ref.page, [])
        start = max(0, ref.line - 2)
        context = "\n".join(lines[start : ref.line + 28])
        matches = [
            (context.index(marker), house_id)
            for marker, house_id in PROPERTY_CONTEXT_MARKERS
            if marker in context
        ]
        return min(matches)[1] if matches else None

    def source_rank(item: dict, ref: RenderRef) -> tuple:
        target = image_dimensions(ref.path)
        target_aspect = target[0] / target[1] if target and target[1] else 1.0
        width, height = item.get("width") or 1, item.get("height") or 1
        source_aspect = width / height
        is_banner = ref.kind in {"background", "css-background"}
        room = str(item.get("room_type", "")).lower()
        return (
            0 if (not is_banner or item.get("best_for") == "hero") else 1,
            0 if (not is_banner or source_aspect >= 1.35) else 1,
            0 if (not is_banner or room in {"exterior", "living room", "kitchen", "dining"}) else 1,
            abs(source_aspect - target_aspect),
            0 if item.get("quality") == "excellent" else 1,
            item["house_id"],
            item["file"],
        )

    def choose(options: list[dict], ref: RenderRef) -> dict | None:
        unused = [item for item in options if item["source"] not in used_sources]
        return min(unused, key=lambda item: source_rank(item, ref)) if unused else None

    # Property pages are allocated first and may only draw from their exact
    # isolated house directory. This prevents generic pages from consuming a
    # scarce house's inventory before its own detail page is planned.
    for index, ref in enumerate(refs):
        house_id = contextual_house(ref)
        if not house_id or ref.kind == "hero-rotation":
            continue
        options = candidates_by_house.get(house_id, [])
        choice = choose(options, ref)
        planned[index] = choice
        if choice:
            used_sources.add(choice["source"])

    for index, ref in enumerate(refs):
        if index in planned or ref.kind == "hero-rotation":
            continue
        choice = choose(all_candidates, ref)
        planned[index] = choice
        if choice:
            used_sources.add(choice["source"])

    assignments = []
    for index, ref in enumerate(refs):
        # Homepage rotation sources are pre-reserved and already exact-size.
        if ref.kind == "hero-rotation" and ref.path in HOMEPAGE_RESERVATIONS:
            source = HOMEPAGE_RESERVATIONS[ref.path]
            assignments.append(
                {
                    "slot": asdict(ref),
                    "source": source,
                    "destination": ref.path,
                    "dimensions": image_dimensions(ref.path),
                    "reserved": True,
                }
            )
            continue
        source = planned.get(index)
        assignments.append(
            {
                "slot": asdict(ref),
                "source": source["source"] if source else None,
                "source_file": source["file"] if source else None,
                "source_house": source["house_id"] if source else None,
                "description": source["description"] if source else None,
                "room_type": source["room_type"] if source else None,
                "dimensions": image_dimensions(ref.path),
                "reserved": False,
            }
        )
    shortage = sum(1 for assignment in assignments if assignment["source"] is None)
    return {
        "strategy": "one eligible isolated source per rendered slot; homepage sources reserved",
        "slot_count": len(refs),
        "candidate_count": len(all_candidates) + len(RESERVED_SOURCES),
        "shortage": shortage,
        "assignments": assignments,
    }


def print_summary(payload: dict) -> None:
    print(f"Published pages: {len(payload['published_pages'])}")
    print(f"Rendered cottage-photo slots: {payload['rendered_slot_count']}")
    print(f"Distinct paths: {payload['rendered_path_count']}")
    print(f"Distinct visual sources: {payload['visual_source_count']}")
    print(f"Repeated visual sources: {payload['duplicate_source_count']}")
    print(f"Decoded-pixel alias groups: {len(payload['decoded_pixel_aliases'])}")
    print(f"Missing rendered assets: {len(payload['missing'])}")
    print(f"Rejected rendered refs: {len(payload['rejected_render_refs'])}")
    print(f"Eligible isolated inventory: {payload['inventory_total']}")
    for house, count in payload["inventory_counts"].items():
        print(f"  {house}: {count}")
    if payload["duplicate_sources"]:
        print("Most-repeated sources:")
        repeated = sorted(
            payload["duplicate_sources"].items(), key=lambda item: (-len(item[1]), item[0])
        )
        for source, refs in repeated[:12]:
            pages = len({ref["page"] for ref in refs})
            print(f"  {len(refs):>3} refs / {pages:>2} pages  {source}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allow-adequate", action="store_true")
    parser.add_argument("--json", type=Path, help="write the complete audit JSON")
    parser.add_argument("--plan", type=Path, help="write a deterministic allocation plan JSON")
    parser.add_argument("--check", action="store_true", help="fail if any repeat/missing/rejected ref remains")
    args = parser.parse_args()

    payload = audit_payload(allow_adequate=args.allow_adequate)
    print_summary(payload)
    if args.json:
        args.json.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    if args.plan:
        plan = allocation_plan(allow_adequate=args.allow_adequate)
        args.plan.write_text(json.dumps(plan, indent=2) + "\n", encoding="utf-8")
        print(f"Allocation shortage at current markup: {plan['shortage']}")
    if args.check and (
        payload["duplicate_source_count"]
        or payload["decoded_pixel_aliases"]
        or payload["missing"]
        or payload["rejected_render_refs"]
    ):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
