#!/usr/bin/env python3
"""
Select hero and gallery photos for each house using NIM vision metadata.

Reads _data/photo-index.json (staging + published sections) and outputs
_data/photo-selections.json with the best photo choices per property.

Selection priorities:
  Hero:   best_for=hero + quality>=good + room_type=exterior
          → best_for=hero + quality>=good
          → best quality exterior or living room
  Gallery: best_for=gallery + quality>=good, diverse room_types, max 8
"""
import json, os, sys
from pathlib import Path

REPO_DIR = Path(__file__).parent.parent
INDEX_FILE = REPO_DIR / "_data/photo-index.json"
SELECTIONS_FILE = REPO_DIR / "_data/photo-selections.json"

QUALITY_RANK = {"excellent": 0, "good": 1, "adequate": 2, "poor": 3}
BEST_FOR_PREF = {"hero": 0, "gallery": 1, "thumbnail": 2, "skip": 3}

# Gallery target: one per room type, prioritized in this order
GALLERY_ROOM_ORDER = [
    "living room", "kitchen", "bedroom", "bathroom", "dining",
    "exterior", "hallway", "other",
]


def score_photo(p, prefer_exterior=False):
    """Score a photo for hero candidacy (lower = better)."""
    room = p.get("nim_room_type", "").lower().strip()
    quality = QUALITY_RANK.get(p.get("nim_quality", ""), 99)
    best_for = BEST_FOR_PREF.get(p.get("nim_best_for", ""), 99)
    features = str(p.get("nim_features", ""))
    has_people = bool(p.get("nim_has_people", False))

    score = 0
    # People penalty
    if has_people:
        score += 1000

    # Exterior bonus
    if prefer_exterior and room == "exterior":
        score -= 10
    elif prefer_exterior and room == "outdoor_space":
        score -= 5

    # Best_for matters
    score += best_for * 3
    # Quality matters
    score += quality * 5
    # Prefer photos with feature descriptions (more content = better photo)
    if len(features) < 10:
        score += 20

    return score


def select_hero(photos):
    """Select the best hero photo. Returns (filename, label)."""
    candidates = []
    for fname, p in photos.items():
        if "nim_error" in p or "nim_room_type" not in p:
            continue
        # Skip people photos
        if p.get("nim_has_people"):
            continue

        room = p.get("nim_room_type", "").lower().strip()
        best_for = p.get("nim_best_for", "")
        quality = QUALITY_RANK.get(p.get("nim_quality", ""), 99)
        desc = p.get("nim_description", "") or room

        # Try #1: exterior hero
        if best_for == "hero" and quality <= 1 and room in ("exterior", "outdoor_space"):
            candidates.append((0, fname, desc))

        # Try #2: any hero
        if best_for == "hero" and quality <= 1:
            candidates.append((1, fname, desc))

        # Try #3: exterior
        if quality <= 1 and room in ("exterior", "outdoor_space"):
            candidates.append((2, fname, desc))

        # Try #4: living room with best_for=hero
        if best_for == "hero" and quality <= 1 and room == "living room":
            candidates.append((3, fname, desc))

    if candidates:
        candidates.sort()
        _, fname, desc = candidates[0]
        return fname, desc

    # Fallback: lowest-scored photo
    scored = [(score_photo(p, prefer_exterior=True), f, p.get("nim_description", ""))
              for f, p in photos.items()
              if "nim_room_type" in p and "nim_error" not in p]
    if scored:
        scored.sort()
        return scored[0][1], scored[0][2]

    return None, ""


def select_gallery(photos, hero_file=None, max_count=8):
    """Select gallery photos with diverse room types. Returns [(filename, label)]. """
    candidates = []
    for fname, p in photos.items():
        if "nim_error" in p or "nim_room_type" not in p:
            continue
        if p.get("nim_has_people"):
            continue
        if hero_file and fname == hero_file:
            continue

        room = p.get("nim_room_type", "").lower().strip()
        quality = QUALITY_RANK.get(p.get("nim_quality", ""), 99)
        best_for = p.get("nim_best_for", "")
        desc = p.get("nim_description", "") or room

        # Skip poor quality and skip-tagged photos
        if quality >= 3 or best_for == "skip":
            continue

        candidates.append({
            "file": fname,
            "label": desc,
            "room_type": room,
            "quality": quality,
            "best_for": BEST_FOR_PREF.get(best_for, 99),
        })

    # Phase 1: pick one per room type in GALLERY_ROOM_ORDER
    selected = []
    used_rooms = set()
    for room in GALLERY_ROOM_ORDER:
        room_candidates = [c for c in candidates
                           if c["room_type"] == room
                           and c["file"] not in {s["file"] for s in selected}]
        if not room_candidates:
            continue
        # Within room type, prefer best_for=gallery then best quality
        room_candidates.sort(key=lambda c: (c["best_for"], c["quality"]))
        best = room_candidates[0]
        selected.append(best)
        used_rooms.add(room)
        if len(selected) >= max_count:
            break

    # Phase 2: fill remaining slots with best remaining photos
    selected_set = {s["file"] for s in selected}
    remaining = [c for c in candidates
                 if c["file"] not in selected_set]
    remaining.sort(key=lambda c: (c["best_for"], c["quality"]))
    for c in remaining:
        if len(selected) >= max_count:
            break
        selected.append(c)

    return [(s["file"], s["label"]) for s in selected[:max_count]]


def main():
    if not INDEX_FILE.exists():
        print(f"ERROR: {INDEX_FILE} not found")
        sys.exit(1)

    index = json.loads(INDEX_FILE.read_text())
    staging = index.get("staging", {})
    houses = index.get("houses", {})

    selections = {}

    # Process all houses in staging
    for house_id in sorted(staging.keys()):
        house_data = staging[house_id]
        photos = house_data.get("photos", {})
        name = house_data.get("name", house_id)
        town = house_data.get("town", "")

        if not photos:
            print(f"{house_id} ({name}): No staging photos, skipping")
            selections[house_id] = {"hero": None, "gallery": [], "card": None}
            continue

        hero_file, hero_label = select_hero(photos)
        gallery = select_gallery(photos, hero_file=hero_file, max_count=8)
        card_file = hero_file

        # If hero is interior but a good exterior exists, use that for card
        if hero_file:
            hero_room = photos.get(hero_file, {}).get("nim_room_type", "")
            if hero_room != "exterior":
                for f, p in photos.items():
                    if "nim_room_type" not in p or "nim_error" in p:
                        continue
                    if p["nim_room_type"].lower().strip() == "exterior" and \
                            QUALITY_RANK.get(p.get("nim_quality", ""), 99) <= 1:
                        card_file = f
                        break

        selections[house_id] = {
            "hero": {"file": hero_file, "label": hero_label} if hero_file else None,
            "gallery": [{"file": f, "label": l} for f, l in gallery],
            "card": {"file": card_file} if card_file else None,
            "name": name,
            "town": town,
        }

        print(f"{house_id} ({name}): hero={hero_file} ({hero_label[:50] if hero_label else 'none'}), "
              f"gallery={len(gallery)} photos, card={card_file}")

    # For houses with published AVIFs (like parkersburg-02), augment with
    # published-section metadata for the final hero/gallery reference.
    for house_id, sel in selections.items():
        if house_id not in houses:
            continue
        house_published = houses[house_id].get("photos", {})
        if not house_published:
            continue

        # Map published AVIF filenames back to staging filenames via source path
        source_map = {}
        for avif_fname, pdata in house_published.items():
            src = pdata.get("source", "")
            if src:
                src_base = os.path.basename(src) if src else ""
                if src_base:
                    source_map[src_base] = avif_fname

        # If hero is staged file, find its published AVIF counterpart
        if sel.get("hero") and sel["hero"]["file"] in source_map:
            sel["hero"]["published_file"] = source_map[sel["hero"]["file"]]

        for g in sel.get("gallery", []):
            if g["file"] in source_map:
                g["published_file"] = source_map[g["file"]]

        if sel.get("card") and sel["card"]["file"] in source_map:
            sel["card"]["published_file"] = source_map[sel["card"]["file"]]

        # Constrain gallery to only photos with published AVIFs for houses
        # that already have AVIFs on disk. This avoids selecting staging
        # photos that have no published counterpart.
        if source_map and any(g.get("published_file") for g in sel.get("gallery", [])):
            orig_count = len(sel.get("gallery", []))
            sel["gallery"] = [g for g in sel.get("gallery", []) if g.get("published_file")]
            # If we lost too many, refill from published AVIFs not yet selected
            if len(sel["gallery"]) < 4:
                selected_files = {g["published_file"] for g in sel["gallery"]}
                if sel.get("hero") and sel["hero"].get("published_file"):
                    selected_files.add(sel["hero"]["published_file"])
                # Find best published AVIFs not yet in gallery
                remaining = sorted([
                    (pdata.get("best_for", "z"), QUALITY_RANK.get(pdata.get("quality", ""), 99), fname, pdata.get("scene", ""))
                    for fname, pdata in house_published.items()
                    if fname not in selected_files
                ])
                for bf, q, fname, scene in remaining:
                    if len(sel["gallery"]) >= 8:
                        break
                    sel["gallery"].append({"file": "", "label": scene, "published_file": fname})
            print(f"  -> {house_id}: gallery constrained {orig_count}→{len(sel['gallery'])} (mapped {len(source_map)} AVIFs)")
        else:
            print(f"  -> {house_id}: mapped {len(source_map)} published AVIFs")

    # Also add entries for houses with published AVIFs but no staging (e.g., coming-soon houses)
    for house_id in houses:
        if house_id not in selections:
            selections[house_id] = {
                "hero": None,
                "gallery": [],
                "card": None,
                "name": houses[house_id].get("name", house_id),
                "town": houses[house_id].get("town", ""),
            }

    # Write selections
    SELECTIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
    SELECTIONS_FILE.write_text(json.dumps(selections, indent=2) + "\n")
    print(f"\nSelections written to {SELECTIONS_FILE}")

    # Summary
    with_hero = sum(1 for s in selections.values() if s.get("hero"))
    total_gallery = sum(len(s.get("gallery", [])) for s in selections.values())
    print(f"Summary: {with_hero} houses with hero, {total_gallery} gallery photos selected")


if __name__ == "__main__":
    main()
