#!/usr/bin/env python3
"""Build the comprehensive photo metadata index _data/photo-index.json."""

import json
import os
import re
from pathlib import Path
from PIL import Image

REPO = Path(__file__).resolve().parent.parent
PUBLISHED = REPO / "assets" / "images" / "cottages"
STAGING = REPO / "sharepoint-download-staging"
GENERATE = REPO / "scripts" / "generate-house-pages.py"
OUTPUT = REPO / "_data" / "photo-index.json"

# ── Known entity data ──────────────────────────────────────
HOUSE_INFO = {
    "marietta-01": {"name": "Frederick Cottage", "town": "Marietta, OH", "public_route": "marietta/frederick-cottage.html"},
    "parkersburg-01": {"name": "Broad Cottage", "town": "Parkersburg, WV", "public_route": "parkersburg/broad-cottage.html"},
    "parkersburg-02": {"name": "Buck Cottage", "town": "Parkersburg, WV", "public_route": "parkersburg/buck-apartment-1.html"},
    "parkersburg-03": {"name": "Yellow Cottage", "town": "Parkersburg, WV", "public_route": "parkersburg/yellow-cottage.html"},
    "parkersburg-04": {"name": "Oak Cottage", "town": "Parkersburg, WV", "public_route": "parkersburg/oak-cottage.html"},
    "ravenswood-01": {"name": "White Cottage", "town": "Ravenswood, WV", "public_route": "ravenswood/white-cottage.html"},
    "ravenswood-02": {"name": "Virginia Cottage", "town": "Ravenswood, WV", "public_route": "ravenswood/virginia-cottage.html"},
    "ravenswood-03": {"name": "Henrietta Cottage", "town": "Ravenswood, WV", "public_route": "ravenswood/henrietta-cottage.html"},
    "ravenswood-04": {"name": "Gallatin Cottage", "town": "Ravenswood, WV", "public_route": None},
    "ravenswood-05": {"name": "Sand", "town": "Ravenswood, WV", "public_route": None},
}

with open(REPO / "_data" / "photo-selections.json") as selections_file:
    TRACKED_SELECTIONS = json.load(selections_file)


def selected_photos(house_id):
    """Return the current published hero/gallery in this script's old shape."""
    selection = TRACKED_SELECTIONS.get(house_id, {})
    hero = selection.get("hero")
    hero_path = None
    if hero:
        hero_file = hero.get("published_file") or hero.get("file")
        hero_path = f"{house_id}/{hero_file}"
    gallery = []
    for item in selection.get("gallery", []):
        filename = item.get("published_file") or item.get("file")
        if filename:
            gallery.append((f"{house_id}/{filename}", item.get("label", "")))
    return {"hero": hero_path, "gallery": gallery}


PHOTOS_DICT = {house_id: selected_photos(house_id) for house_id in HOUSE_INFO}

# ── NIM analysis results (per-staging-photo) ──────────────

NIM = {}

NIM["marietta-01"] = {
    "photo-01.jpg": {
        "desc": "Room under construction, unfinished walls/floors, window, door, wooden cabinet, blue/red tape.",
        "quality": "good quality", "section": "general interior"
    },
    "photo-02.jpg": {
        "desc": "Kitchen with cabinets, granite countertop, pull-out shelf, wine rack. Well-lit.",
        "quality": "good quality", "section": "kitchen"
    },
    "photo-03.jpg": {
        "desc": "Partially constructed room with light wood paneling, white window, green door panel, white appliance mounted on wall.",
        "quality": "good quality", "section": "general interior"
    },
    "photo-04.jpg": {
        "desc": "Home office/study with white sink, black leather chair, wooden desk with magazine, hardwood floor with tape markings.",
        "quality": "good quality", "section": "general interior"
    },
    "photo-05.jpg": {
        "desc": "Backyard of cottage with lush grass, white exterior with blue shutters, small shed, fire pit.",
        "quality": "adequate quality", "section": "exterior"
    },
    "photo-06.jpg": {
        "desc": "Exterior corner of cottage with window, AC unit, lattice skirt, small garden bed with plants and stones.",
        "quality": "good quality", "section": "exterior"
    },
    "photo-07.jpg": {
        "desc": "Exterior of one-story cottage, white stucco wall with window featuring green shutters.",
        "quality": "good quality", "section": "exterior"
    },
    "photo-08.jpg": {
        "desc": "Corner room with window, white blinds, green door, ceiling light fixture. Slightly blurry.",
        "quality": "poor quality", "section": "general interior"
    },
}

NIM["parkersburg-01"] = {
    "photo-01.jpg": {
        "desc": "Bedroom with plush red carpet, white walls, dark wood-framed bed with red comforter and varied pillows, flat-screen TV on wall.",
        "quality": "poor quality", "section": "bedroom"
    },
    "photo-02.jpg": {
        "desc": "Living room with plush sectional sofa, wooden coffee table on vibrant red carpet, wood paneling, large window with natural light.",
        "quality": "good quality", "section": "living room"
    },
    "photo-03.jpg": {
        "desc": "Bedroom with bed (wooden frame, red comforter), desk with chair, window with white curtain. Clear and well-lit.",
        "quality": "good quality", "section": "bedroom"
    },
    "photo-04.jpg": {
        "desc": "Bedroom with comfortable bed, flat-screen TV, mirror, wooden bed frame with red/black bedding, red carpeting.",
        "quality": "adequate quality", "section": "bedroom"
    },
    "photo-05.jpg": {
        "desc": "Bedroom with red/blue comforter on bed, desk with chair, window. Slightly blurry with soft focus.",
        "quality": "poor quality", "section": "bedroom"
    },
    "photo-06.jpg": {
        "desc": "Living room with plush red carpet, wood paneling, large flat-screen TV mounted above wooden entertainment center, doorway to outside.",
        "quality": "good quality", "section": "living room"
    },
    "photo-07.jpg": {
        "desc": "Living room with plush L-shaped couch (abstract pattern), glass coffee table, wall clock and framed artworks, wood paneling.",
        "quality": "good quality", "section": "living room"
    },
    "photo-08.jpg": {
        "desc": "Living room with large TV mounted on wall, comfortable couch, coffee table with flowers, wood paneling, red shag carpet.",
        "quality": "good quality", "section": "living room"
    },
}

NIM["parkersburg-02"] = {
    "photo-01.jpeg": {
        "desc": "Corner of bedroom with desk, chair, bed. Deep blue walls, two large windows with white blinds, small dresser, laptop on desk.",
        "quality": "good quality", "section": "bedroom"
    },
    "photo-02.jpeg": {
        "desc": "Bedroom with wooden dresser, mirror above it, small chair, framed mirror, doll, stack of books. Dark blue wall backdrop.",
        "quality": "poor quality", "section": "bedroom"
    },
    "photo-03.jpeg": {
        "desc": "Blurry image of woman looking out window at sunset overlooking small town. Low quality, soft focus.",
        "quality": "poor quality", "section": "exterior"
    },
    "photo-04.jpg": {
        "desc": "View from deck/patio overlooking street with parked cars and houses. Low angle, distorted perspective, blurry.",
        "quality": "poor quality", "section": "exterior"
    },
    "photo-05.jpg": {
        "desc": "Exterior of cottage with front porch, white railing, brown wood slats, lawn, red shed, cars. Slightly blurry.",
        "quality": "poor quality", "section": "exterior"
    },
    "photo-06.jpg": {
        "desc": "Exterior of cottage with sunset sky, porch with rocking chair, potted plants, lawn, cars. Slightly blurry.",
        "quality": "poor quality", "section": "exterior"
    },
    "photo-07.jpg": {
        "desc": "View from porch/deck of front yard and street, large tree, white car parked, red vehicle in driveway. Slightly distorted.",
        "quality": "good quality", "section": "exterior"
    },
    "photo-08.jpg": {
        "desc": "Exterior of cottage at sunset, bird's-eye view of front yard, manicured lawn, parked cars. Grainy, low-resolution.",
        "quality": "poor quality", "section": "exterior"
    },
}

NIM["parkersburg-04"] = {
    "photo-01.jpg": {
        "desc": "Bedroom with large bed, white linens, natural light from window, TV mounted on wall, wooden TV stand, mirror above bed, forest painting. Slightly blurry.",
        "quality": "poor quality", "section": "bedroom"
    },
    "photo-02.jpg": {
        "desc": "View from top of wooden staircase with white railings leading to front yard, bags of soil/mulch, paved walkway, street with car.",
        "quality": "adequate quality", "section": "exterior"
    },
    "photo-03.jpg": {
        "desc": "Bedroom with bed on left, TV on stand on right, doorway to kitchen in background. Wood floor, white walls, natural light through window.",
        "quality": "poor quality", "section": "bedroom"
    },
    "photo-04.jpg": {
        "desc": "View from top of outdoor staircase leading to yard with tree, sidewalk, parked car. Wooden steps, white railing posts. Good quality.",
        "quality": "good quality", "section": "exterior"
    },
    "photo-05.jpg": {
        "desc": "Cozy porch with comfortable seating, two chairs, small table, gray carpet with white grid pattern, enclosed by railing.",
        "quality": "good quality", "section": "exterior"
    },
    "photo-06.jpg": {
        "desc": "Bedroom with double bed, gray comforter, white pillows, folded towel, two lamps, large clock, mirror. High-quality lighting.",
        "quality": "adequate quality", "section": "bedroom"
    },
    "photo-07.jpg": {
        "desc": "Queen bedroom with gray upholstered headboard, white comforter with black designs, black/white pillows, nightstand with lamp and terrarium, wooden dresser, tall plant.",
        "quality": "good quality", "section": "bedroom"
    },
    "photo-08.jpg": {
        "desc": "Compact kitchen with wooden cabinets and countertops, sink, refrigerator, stove, microwave, doorway to adjacent room.",
        "quality": "adequate quality", "section": "kitchen"
    },
}

NIM["ravenswood-03"] = {
    "photo-01.png": {
        "desc": "Bedroom with light blue comforter and white pillows on bed, dark wood headboard and nightstands, lamps with yellow shades, striped wall, clock, window with sheer curtain. Pixelated mosaic effect.",
        "quality": "poor quality", "section": "bedroom"
    },
    "photo-02.jpg": {
        "desc": "Bathroom with toilet, bathtub with shower curtain, shelving units, marble wall, white door, wooden coat rack. Average quality with visible grain.",
        "quality": "good quality", "section": "bathroom"
    },
    "photo-03.jpg": {
        "desc": "Doorway into bathroom with red plank wall, hanging hat, Welcome sign. Bathroom painted white/blue with toilet, sink, shower. High quality, well-lit.",
        "quality": "good quality", "section": "bathroom"
    },
    "photo-04.jpg": {
        "desc": "Bathroom with toilet, bathtub with shower curtain, built-in shelving. Good quality, clear and well-lit.",
        "quality": "good quality", "section": "bathroom"
    },
    "photo-05.jpg": {
        "desc": "Dining room with wooden table with glass top, six chairs (one blue, two wood), striped walls, three-light fixture. Good quality.",
        "quality": "good quality", "section": "dining area"
    },
    "photo-06.jpg": {
        "desc": "Dining room with wooden table and chairs, striped wallpaper, window with yellow door in background. Natural light, warm atmosphere.",
        "quality": "good quality", "section": "dining area"
    },
    "photo-07.jpg": {
        "desc": "Dining room with wooden table and chairs, striped wallpaper, window with white frame. Bright and well-lit.",
        "quality": "good quality", "section": "dining area"
    },
    "photo-08.jpg": {
        "desc": "Dining room with green/cream striped wallpaper, round wooden table, variety of wooden chairs (one teal), chandelier, bookshelf in background.",
        "quality": "good quality", "section": "dining area"
    },
}


def img_info(path):
    ext = os.path.splitext(path)[1].lower()
    try:
        with Image.open(path) as img:
            w, h = img.size
    except Exception:
        w, h = None, None
    return {
        "path": str(path.relative_to(REPO)),
        "format": ext.lstrip(".").replace("jpeg", "jpg"),
        "width": w,
        "height": h,
        "filesize_bytes": os.path.getsize(path),
    }


def find_staging_source(pub_fname, staging_photos):
    """Try to find the staging source photo for a published AVIF.
    Strategy: numeric suffix matching. E.g. photo-03.avif -> photo-03.jpg
    For marietta-01: gallery-NN.avif -> photo-NN.jpg, hero.avif -> photo-01.jpg (first exterior)
    """
    pub_stem = os.path.splitext(pub_fname)[0]
    pub_num = re.search(r"(\d+)", pub_stem)

    # Special case: marietta-01 hero is the front exterior
    if pub_fname == "hero.avif":
        for sname in sorted(staging_photos):
            if "hero" not in sname:
                continue
            return staging_photos[sname]["path"]

    # Direct numeric match first
    if pub_num:
        for sname, sinfo in sorted(staging_photos.items()):
            s_stem = os.path.splitext(sname)[0]
            s_num = re.search(r"(\d+)", s_stem)
            if s_num and s_num.group(1) == pub_num.group(1):
                return sinfo["path"]

    # For marietta-01 gallery-NN, try NN direct match
    for sname, sinfo in sorted(staging_photos.items()):
        s_stem = os.path.splitext(sname)[0]
        s_num = re.search(r"(\d+)", s_stem)
        pub_stem_clean = pub_stem.replace("gallery-", "").replace("hero-", "")
        if s_num and s_num.group(1) == pub_stem_clean:
            return sinfo["path"]

    return None


def build_index():
    os.chdir(REPO)
    all_ids = sorted(set(
        list(HOUSE_INFO.keys())
        + [d.name for d in PUBLISHED.iterdir() if d.is_dir() and d.name != ".gitkeep"]
        + [d.name for d in STAGING.iterdir() if d.is_dir() and d.name != ".gitkeep"]
    ))

    houses_data = {}
    staging_data = {}
    houses_with_photos = 0
    houses_coming_soon = 0
    orphan_dirs = []

    # ── Catalog staging photos ──
    for hid in all_ids:
        sdir = STAGING / hid
        if not sdir.is_dir():
            continue
        photos = {}
        for fname in sorted(os.listdir(sdir)):
            fpath = sdir / fname
            if not os.path.isfile(fpath):
                continue
            ext = os.path.splitext(fname)[1].lower()
            if ext not in (".jpg", ".jpeg", ".png"):
                continue
            info = img_info(fpath)
            entry = {
                "path": info["path"],
                "format": info["format"],
                "width": info["width"],
                "height": info["height"],
                "filesize_bytes": info["filesize_bytes"],
            }
            # Attach NIM analysis
            house_nim = NIM.get(hid, {})
            if fname in house_nim:
                n = house_nim[fname]
                entry["nim_description"] = n["desc"]
                entry["nim_quality"] = n["quality"]
                entry["nim_section"] = n["section"]
            photos[fname] = entry
        if photos:
            hi = HOUSE_INFO.get(hid, {"name": hid, "town": ""})
            staging_data[hid] = {
                "name": hi["name"],
                "town": hi["town"],
                "public_route": hi.get("public_route"),
                "photos": photos,
            }

    # ── Explicit source overrides for houses with non-standard naming ──
    SOURCE_OVERRIDE = {
        "marietta-01": {
            "hero.avif": ("photo-07.jpg", NIM["marietta-01"]["photo-07.jpg"]),
            "gallery-01.avif": ("photo-01.jpg", NIM["marietta-01"]["photo-01.jpg"]),
            "gallery-02.avif": ("photo-02.jpg", NIM["marietta-01"]["photo-02.jpg"]),
            "gallery-03.avif": ("photo-03.jpg", NIM["marietta-01"]["photo-03.jpg"]),
            "gallery-04.avif": ("photo-04.jpg", NIM["marietta-01"]["photo-04.jpg"]),
            "gallery-05.avif": ("photo-05.jpg", NIM["marietta-01"]["photo-05.jpg"]),
        },
    }

    def get_nim_from_source(hid, src_fname):
        """Return NIM entry dict or None."""
        hn = NIM.get(hid, {})
        return hn.get(src_fname)

    # ── Catalog published photos ──
    for hid in all_ids:
        pdir = PUBLISHED / hid
        hi = HOUSE_INFO.get(hid, {"name": hid, "town": ""})

        published = {}
        if pdir.is_dir():
            # Only AVIF files count as published
            for fname in sorted(os.listdir(pdir)):
                if not fname.lower().endswith(".avif"):
                    continue
                fpath = pdir / fname
                if not fpath.is_file():
                    continue
                info = img_info(fpath)

                tags = ["published"]

                # Determine selection status from PHOTOS dict
                house_sel = PHOTOS_DICT.get(hid, {})
                hero_file = house_sel.get("hero")
                gallery_list = house_sel.get("gallery", [])

                role = "available"
                label = None

                if hero_file and os.path.basename(hero_file) == fname:
                    role = "hero"
                for g_item in gallery_list:
                    g_file = os.path.basename(g_item[0]) if isinstance(g_item, (list, tuple)) else ""
                    if g_file == fname:
                        role = "gallery" if role != "hero" else "hero+gallery"
                        label = g_item[1] if isinstance(g_item, (list, tuple)) and len(g_item) > 1 else None
                        break

                tags.append(role)

                # Find corresponding staging source
                staging_photos = staging_data.get(hid, {}).get("photos", {})

                # Check override first
                override = SOURCE_OVERRIDE.get(hid, {}).get(fname)
                if override:
                    src_fname, nim_entry = override
                    source_path = staging_photos.get(src_fname, {}).get("path")
                    if not source_path:
                        source_path = f"sharepoint-download-staging/{hid}/{src_fname}"
                else:
                    source_path = find_staging_source(fname, staging_photos)
                    nim_entry = None
                    if source_path:
                        src_fname = os.path.basename(source_path)
                        nim_entry = get_nim_from_source(hid, src_fname)

                scene = label or ""
                quality = "unknown"

                if nim_entry:
                    scene = scene or nim_entry["desc"]
                    quality = nim_entry["quality"]
                    tags.append(nim_entry["section"])

                pub_entry = {
                    "path": info["path"],
                    "format": info["format"],
                    "width": info["width"],
                    "height": info["height"],
                    "filesize_bytes": info["filesize_bytes"],
                    "source": source_path,
                    "tags": sorted(set(tags)),
                    "scene": scene,
                    "quality": quality,
                }
                if label:
                    pub_entry["page_label"] = label

                published[fname] = pub_entry

        # Build selection summary (even if no published dir)
        sel = {"hero": None, "gallery": [], "available_not_selected": []}
        house_sel = PHOTOS_DICT.get(hid, {})
        if house_sel.get("hero"):
            sel["hero"] = os.path.basename(house_sel["hero"])
        selected_set = {sel["hero"]} if sel["hero"] else set()
        for g_item in house_sel.get("gallery", []):
            if isinstance(g_item, (list, tuple)):
                gname = os.path.basename(g_item[0])
                glabel = g_item[1] if len(g_item) > 1 else ""
                sel["gallery"].append({"file": gname, "label": glabel})
                selected_set.add(gname)
        for fname in published:
            if fname not in selected_set:
                sel["available_not_selected"].append(fname)

        has_selection = sel["hero"] is not None or sel["gallery"]
        has_photos = bool(published)

        if has_photos:
            houses_with_photos += 1
        if not has_selection:
            houses_coming_soon += 1
        if hid not in HOUSE_INFO and not has_photos:
            orphan_dirs.append(hid)

        houses_data[hid] = {
            "name": hi["name"],
            "town": hi["town"],
            "public_route": hi.get("public_route"),
            "photos": published,
            "selection": sel,
            "status": "published" if has_selection else "coming_soon",
        }

    # ── Template stock counts ──
    template_dirs = [
        "assets/images/resource",
        "assets/images/main-home",
        "assets/images/home-two",
        "assets/images/home-three",
        "assets/images/home-four",
        "assets/images/home-five",
        "assets/images/slider",
    ]
    template_counts = {}
    template_total = 0
    for d in template_dirs:
        dp = REPO / d
        if dp.is_dir():
            count = sum(
                1 for f in os.listdir(dp)
                if os.path.isfile(dp / f)
                and os.path.splitext(f)[1].lower() in (".jpg", ".jpeg", ".png", ".gif", ".svg", ".ico", ".webp")
            )
            template_counts[d] = count
            template_total += count
        else:
            template_counts[d] = 0

    # ── Assemble index ──
    index = {
        "version": 1,
        "generated": "2026-07-20",
        "generator": "scripts/build-photo-index.py",
        "houses": houses_data,
        "staging": staging_data,
        "template_stock": {
            "hotelhub": {
                "count": template_total,
                "directories": {d: {"count": c} for d, c in template_counts.items()},
            }
        },
        "coverage": {
            "total_houses": len(all_ids),
            "houses_with_published_photos": houses_with_photos,
            "houses_coming_soon": houses_coming_soon,
            "orphan_directories": sorted(orphan_dirs) if orphan_dirs else [],
            "total_published_avif_files": sum(
                len(h["photos"]) for h in houses_data.values()
            ),
            "total_staging_originals": sum(
                len(s["photos"]) for s in staging_data.values()
            ),
            "total_template_stock_photos": template_total,
        },
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Photo index written to {OUTPUT}")
    print(f"  Houses: {len(all_ids)} total, {houses_with_photos} with published photos, {houses_coming_soon} coming soon")
    print(f"  Published AVIF files: {sum(len(h['photos']) for h in houses_data.values())}")
    print(f"  Staging originals: {sum(len(s['photos']) for s in staging_data.values())}")
    print(f"  Template stock photos: {template_total}")


if __name__ == "__main__":
    build_index()
