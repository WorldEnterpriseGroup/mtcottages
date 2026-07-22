#!/usr/bin/env python3
"""Trim decorative photo grids and apply a one-source-per-render-slot plan."""

from __future__ import annotations

import argparse
import html
import importlib.util
import json
import os
import re
import sys
from collections import defaultdict, deque
from pathlib import Path

from PIL import Image, ImageOps
from PIL import UnidentifiedImageError


ROOT = Path(__file__).resolve().parents[1]
AUDIT_SCRIPT = ROOT / "scripts/audit-photo-uniqueness.py"

spec = importlib.util.spec_from_file_location("mtc_photo_audit", AUDIT_SCRIPT)
assert spec and spec.loader
audit = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = audit
spec.loader.exec_module(audit)

DIV_RE = re.compile(r"<div\b[^>]*>|</div\s*>", re.I)
CLASS_RE = re.compile(r"\bclass\s*=\s*(['\"])(.*?)\1", re.I | re.S)
ANCHOR_RE = re.compile(r"\s*<a\b[^>]*>.*?</a>\s*", re.I | re.S)
SIDEBAR_THUMB_RE = re.compile(
    r"\s*<div\s+class=['\"]col-lg-6 padding-0 pl-0 pr-0['\"]>\s*"
    r"<div\s+class=['\"]content-thumb-box['\"]>.*?</div>\s*</div>\s*",
    re.I | re.S,
)
IMG_RE = re.compile(
    r"<img\b(?P<before>[^>]*?\bsrc\s*=\s*['\"])(?P<url>[^'\"]*assets/images/cottages/[^'\"]+)(?P<after>['\"][^>]*)>",
    re.I | re.S,
)
STYLE_URL_RE = re.compile(
    r"(?P<prefix>url\(\s*['\"]?)(?P<url>(?:\.\./)*assets/images/cottages/[^)'\"\s]+)(?P<suffix>['\"]?\s*\))",
    re.I,
)
ALT_RE = re.compile(r"\balt\s*=\s*(['\"])(.*?)\1", re.I | re.S)


def div_blocks(text: str, class_name: str) -> list[tuple[int, int]]:
    stack: list[tuple[int, set[str]]] = []
    found = []
    for match in DIV_RE.finditer(text):
        token = match.group(0)
        if token.startswith("</"):
            if not stack:
                continue
            start, classes = stack.pop()
            if class_name in classes:
                found.append((start, match.end()))
        else:
            class_match = CLASS_RE.search(token)
            classes = set(class_match.group(2).split()) if class_match else set()
            stack.append((match.start(), classes))
    return sorted(found)


def trim_blocks(text: str) -> tuple[str, int]:
    removed = 0
    # Four photos retain HotelHub's responsive footer gallery without the old
    # eleven-image template payload.
    for start, end in reversed(div_blocks(text, "galary-section")):
        section = text[start:end]
        slides = div_blocks(section, "swiper-slide")
        for slide_start, slide_end in reversed(slides[4:]):
            section = section[:slide_start] + section[slide_end:]
            removed += 1
        text = text[:start] + section + text[end:]

    # The compact footer mosaic is decorative; two unique images are enough
    # to preserve its layout and release scarce reviewed sources for content.
    for start, end in reversed(div_blocks(text, "footer-recent")):
        block = text[start:end]
        anchors = list(ANCHOR_RE.finditer(block))
        for anchor in reversed(anchors[2:]):
            block = block[:anchor.start()] + block[anchor.end():]
            removed += 1
        text = text[:start] + block + text[end:]
    sidebar_thumbs = list(SIDEBAR_THUMB_RE.finditer(text))
    for thumb in reversed(sidebar_thumbs[2:]):
        text = text[:thumb.start()] + text[thumb.end():]
        removed += 1
    return text, removed


def trim_all_pages() -> int:
    removed = 0
    for page in audit.published_html():
        text = page.read_text(encoding="utf-8")
        updated, count = trim_blocks(text)
        if updated != text:
            page.write_text(updated, encoding="utf-8")
        removed += count
    return removed


def destination_for(assignment: dict) -> str:
    slot = assignment["slot"]
    width, height = assignment["dimensions"]
    page_slug = re.sub(r"[^a-z0-9]+", "-", slot["page"].removesuffix(".html").lower()).strip("-")
    identity = f"{slot['page']}:{slot['line']}:{slot['kind']}:{assignment['source']}"
    suffix = __import__("hashlib").sha256(identity.encode()).hexdigest()[:10]
    filename = f"{page_slug}-{slot['kind']}-{slot['line']}-{suffix}-{width}x{height}.avif"
    return f"assets/images/cottages/{assignment['source_house']}/unique/{filename}"


def build_asset(assignment: dict, destination: str) -> None:
    width, height = assignment["dimensions"]
    source = ROOT / "sharepoint-download-staging" / assignment["source_house"] / assignment["source_file"]
    target = ROOT / destination
    if target.is_file():
        try:
            with Image.open(target) as existing:
                if existing.size == (width, height):
                    return
        except (OSError, UnidentifiedImageError):
            target.unlink()
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        image = ImageOps.fit(
            image,
            (width, height),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
        image.save(target, format="AVIF", quality=52)


def relative_url(page: Path, destination: str) -> str:
    return Path(os.path.relpath(ROOT / destination, page.parent)).as_posix()


def rewrite_page(page: Path, assignments: list[dict]) -> int:
    queues: dict[tuple[str, str], deque] = defaultdict(deque)
    built = 0
    for assignment in assignments:
        slot = assignment["slot"]
        if assignment.get("reserved") or not assignment.get("source"):
            continue
        destination = destination_for(assignment)
        build_asset(assignment, destination)
        assignment["destination"] = destination
        queues[(slot["kind"], slot["url"])].append(assignment)
        built += 1

    text = page.read_text(encoding="utf-8")

    def replace_img(match: re.Match) -> str:
        url = match.group("url")
        queue = queues.get(("img", url))
        if not queue:
            return match.group(0)
        assignment = queue.popleft()
        destination = relative_url(page, assignment["destination"])
        tail = match.group("after")
        description = html.escape(assignment.get("description") or "Furnished cottage interior", quote=True)
        if ALT_RE.search(tail):
            tail = ALT_RE.sub(f'alt="{description}"', tail, count=1)
        else:
            tail += f' alt="{description}"'
        return f'<img{match.group("before")}{destination}{tail}>'

    text = IMG_RE.sub(replace_img, text)

    def replace_background(match: re.Match) -> str:
        url = match.group("url")
        queue = queues.get(("background", url))
        if not queue:
            return match.group(0)
        assignment = queue.popleft()
        destination = relative_url(page, assignment["destination"])
        return match.group("prefix") + destination + match.group("suffix")

    text = STYLE_URL_RE.sub(replace_background, text)
    leftovers = sum(len(queue) for queue in queues.values())
    if leftovers:
        raise RuntimeError(f"{page}: {leftovers} planned replacements were not found")
    page.write_text(text, encoding="utf-8")
    return built


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="perform the trim, crop, and HTML rewrite")
    parser.add_argument("--manifest-only", action="store_true", help="finalize provenance for the current rendered allocation")
    args = parser.parse_args()
    if args.manifest_only:
        plan = audit.allocation_plan()
        manifest_assets = {}
        for assignment in plan["assignments"]:
            slot = assignment["slot"]
            if "/unique/" not in slot["path"] or not assignment.get("source"):
                continue
            manifest_assets[slot["path"]] = {
                "source": assignment["source"],
                "house_id": assignment["source_house"],
                "page": slot["page"],
                "kind": slot["kind"],
                "dimensions": assignment["dimensions"],
            }
        (ROOT / "_data/photo-render-manifest.json").write_text(
            json.dumps(
                {
                    "version": 1,
                    "generator": "scripts/allocate-unique-photos.py --manifest-only",
                    "assets": dict(sorted(manifest_assets.items())),
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        stale = 0
        for unique_dir in (ROOT / "assets/images/cottages").glob("*/unique"):
            for asset in unique_dir.glob("*.avif"):
                if asset.relative_to(ROOT).as_posix() not in manifest_assets:
                    asset.unlink()
                    stale += 1
        print(f"recorded {len(manifest_assets)} rendered assets; removed {stale} stale crops")
        return 0
    if not args.apply:
        print("Pass --apply to perform the deterministic rewrite.")
        return 0

    removed = trim_all_pages()
    plan = audit.allocation_plan()
    if plan["shortage"]:
        raise RuntimeError(
            f"reviewed source shortage after trimming: {plan['shortage']} rendered slots"
        )
    by_page: dict[str, list[dict]] = defaultdict(list)
    for assignment in plan["assignments"]:
        page = assignment["slot"]["page"]
        if page.endswith(".html") and assignment["slot"]["kind"] != "hero-rotation":
            by_page[page].append(assignment)
    generated = 0
    for page_name, assignments in sorted(by_page.items()):
        generated += rewrite_page(ROOT / page_name, assignments)
        print(f"rewrote {page_name}: {len(assignments)} rendered photo slots")
    manifest_assets = {}
    for assignment in plan["assignments"]:
        destination = assignment.get("destination")
        if not destination:
            continue
        manifest_assets[destination] = {
            "source": assignment["source"],
            "house_id": assignment["source_house"],
            "page": assignment["slot"]["page"],
            "kind": assignment["slot"]["kind"],
            "dimensions": assignment["dimensions"],
        }
    (ROOT / "_data/photo-render-manifest.json").write_text(
        json.dumps(
            {
                "version": 1,
                "generator": "scripts/allocate-unique-photos.py",
                "assets": dict(sorted(manifest_assets.items())),
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    live_assets = set(manifest_assets)
    stale = 0
    for unique_dir in (ROOT / "assets/images/cottages").glob("*/unique"):
        for asset in unique_dir.glob("*.avif"):
            if asset.relative_to(ROOT).as_posix() not in live_assets:
                asset.unlink()
                stale += 1
    print(
        f"trimmed {removed} decorative slots; generated/assigned {generated} exact-size crops; "
        f"removed {stale} stale generated crops"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
