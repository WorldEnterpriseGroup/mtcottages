#!/usr/bin/env python3
"""
Batch Nvidia NIM vision analysis for all staging photos.
Resizes to 1200px max dimension before sending.
"""
import argparse, json, os, sys, base64, io, time, hashlib, subprocess
from pathlib import Path
from PIL import Image
import urllib.request, urllib.parse

REPO_DIR = Path(__file__).parent.parent
STAGING_DIR = REPO_DIR / "sharepoint-download-staging"
PUBLISHED_DIR = REPO_DIR / "assets/images/cottages"
HOUSE_MAP_FILE = REPO_DIR / "sharepoint-house-map.json"
INDEX_FILE = REPO_DIR / "_data/photo-index.json"

NIM_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions"
NIM_MODEL = "meta/llama-3.2-11b-vision-instruct"

# Valid enum values, called out separately from the example JSON below so the
# model has somewhere to read them without them sitting inside copyable fields.
ROOM_TYPES = "exterior, living room, kitchen, bedroom, bathroom, dining, detail, outdoor_space, hallway, other"
QUALITIES = "excellent, good, adequate, poor"
COMPOSITIONS = "professional, smartphone, snapshot"
BEST_FORS = "hero, gallery, thumbnail, skip"

NIM_PROMPT = f"""Look at this real estate photo and describe what you actually see in it.

Return ONLY valid JSON (no markdown, no explanation, no code fences).
Every value below must be about THIS photo. Do not copy the sample values shown
in the example — they are illustrations of the shape only, not filler text to repeat.

Valid room_type values: {ROOM_TYPES}
Valid quality values: {QUALITIES}
Valid composition values: {COMPOSITIONS}
Valid best_for values: {BEST_FORS}

Keep "features" and "tags" short and concrete (at most 8 items/words each) — do not
repeat words or ramble.

Example of the JSON shape (write your own values for this photo, not these):
{{
  "room_type": "bedroom",
  "quality": "good",
  "composition": "smartphone",
  "features": "queen bed, nightstand, hardwood floor, large window",
  "description": "A bright bedroom with a queen bed and a large window.",
  "best_for": "gallery",
  "has_people": false,
  "tags": ["bedroom", "cozy", "natural light"]
}}"""

def get_nim_key():
    """Get NIM API key from Azure Key Vault"""
    try:
        result = subprocess.run(
            ["az", "keyvault", "secret", "show", "--vault-name", "omlab-secrets",
             "--name", "nvidia-api-key", "--query", "value", "-o", "tsv"],
            capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except Exception as e:
        print(f"Failed to get NIM key: {e}")
        return os.environ.get("NIM_KEY")

def resize_image_to_max(image_path, max_dim=1200):
    """Resize image so max dimension is max_dim"""
    img = Image.open(image_path)
    img = img.convert("RGB")
    w, h = img.size
    if w > max_dim or h > max_dim:
        ratio = max_dim / max(w, h)
        new_w = int(w * ratio)
        new_h = int(h * ratio)
        img = img.resize((new_w, new_h), Image.LANCZOS)
    return img

def image_to_base64(img):
    """Convert PIL Image to base64 JPEG"""
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

def analyze_with_nim(api_key, image_path, model=NIM_MODEL):
    """Send an image to Nvidia NIM for analysis"""
    try:
        img = resize_image_to_max(image_path)
        b64 = image_to_base64(img)

        payload = json.dumps({
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a JSON API. Return ONLY valid JSON. Never include markdown formatting, code fences, or explanatory text."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": NIM_PROMPT},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
                    ]
                }
            ],
            "max_tokens": 512,
            "temperature": 0.1
        }).encode()

        req = urllib.request.Request(
            NIM_ENDPOINT,
            data=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
        )

        resp = urllib.request.urlopen(req, timeout=180)
        result = json.loads(resp.read())

        content = result["choices"][0]["message"]["content"].strip()
        assert content, "Empty response from NIM"

        # Find JSON object boundaries directly
        json_str = content
        start = json_str.find("{")
        end = json_str.rfind("}") + 1
        if start >= 0 and end > start:
            json_str = json_str[start:end]

        return json.loads(json_str)
    except Exception as e:
        return {"error": str(e), "from": str(image_path)}

def get_image_dimensions(image_path):
    """Get image width, height, format, file size"""
    try:
        img = Image.open(image_path)
        fmt = os.path.splitext(image_path)[1].lower().lstrip(".")
        if fmt == "jpeg":
            fmt = "jpg"
        return {
            "width": img.width,
            "height": img.height,
            "format": fmt,
            "filesize_bytes": os.path.getsize(image_path)
        }
    except Exception as e:
        return {"error": str(e)}

# Literal placeholder/enum text that the 11b vision model has been observed to
# echo back verbatim instead of following the prompt. If any of these show up
# in a stored result, the analysis is junk even though it looks "complete".
_PLACEHOLDER_DESCRIPTIONS = {"one sentence scene description", "one sentence"}
_PLACEHOLDER_FEATURES = {"comma-separated visible features", "comma-separated features"}
_PLACEHOLDER_TAG_TOKENS = {"relevant", "tags", "here", "tag1", "tag2"}


def is_placeholder_result(photo_data):
    """True if a previously-analyzed photo's NIM fields look like echoed
    prompt/example text rather than a real analysis of the image."""
    if "nim_room_type" not in photo_data:
        return False
    description = str(photo_data.get("nim_description", ""))
    features = str(photo_data.get("nim_features", ""))
    room_type = str(photo_data.get("nim_room_type", ""))
    quality = photo_data.get("nim_quality")
    tags = photo_data.get("nim_tags") or []
    if description in _PLACEHOLDER_DESCRIPTIONS:
        return True
    if features in _PLACEHOLDER_FEATURES:
        return True
    if "|" in room_type:
        return True
    if quality is None:
        return True
    if any(str(t).lower() in _PLACEHOLDER_TAG_TOKENS for t in tags):
        return True
    return False


def needs_analysis(existing_photo_data, retry_failed):
    """Decide whether a staging photo needs a NIM call this run."""
    if existing_photo_data is None:
        return True
    if "nim_room_type" not in existing_photo_data:
        # Never successfully analyzed (includes prior nim_error entries)
        return True
    if retry_failed and is_placeholder_result(existing_photo_data):
        return True
    return False


def process_staging_photos(api_key, index_data, model=NIM_MODEL, retry_failed=False):
    """Process all photos in staging that haven't been analyzed yet
    (or, with retry_failed, that were previously analyzed but returned
    placeholder/echoed junk instead of real values)."""
    houses = json.loads(HOUSE_MAP_FILE.read_text())
    house_map = {h["id"]: h for h in houses}

    # Track what's been analyzed
    analyzed_count = 0
    skip_count = 0
    error_count = 0
    retried_count = 0

    # Process each house
    for house_id in sorted(os.listdir(STAGING_DIR)):
        house_dir = STAGING_DIR / house_id
        if not house_dir.is_dir():
            continue

        photo_files = sorted([f for f in os.listdir(house_dir)
                             if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".avif"))])

        if not photo_files:
            continue

        house_info = house_map.get(house_id, {})
        print(f"\n=== {house_id} ({house_info.get('address', '?')}) ===")
        print(f"  Photos to analyze: {len(photo_files)}")

        # Initialize house in index
        if "staging" not in index_data:
            index_data["staging"] = {}
        if house_id not in index_data["staging"]:
            index_data["staging"][house_id] = {
                "name": house_info.get("address", house_id),
                "town": house_info.get("town", ""),
                "photos": {}
            }

        existing_analyzed = index_data["staging"][house_id]["photos"]

        for photo_file in photo_files:
            photo_path = str(house_dir / photo_file)
            existing_photo_data = existing_analyzed.get(photo_file)

            # Skip if already analyzed with a real (non-placeholder) result
            if not needs_analysis(existing_photo_data, retry_failed):
                skip_count += 1
                continue

            was_retry = existing_photo_data is not None and "nim_room_type" in existing_photo_data
            label = "Retrying" if was_retry else "Analyzing"
            print(f"  {label} {photo_file}...", end="", flush=True)

            # Get dimensions first
            dims = get_image_dimensions(photo_path)

            # Run NIM analysis with retries
            nim_result = None
            for attempt in range(3):
                try:
                    nim_result = analyze_with_nim(api_key, photo_path, model=model)
                    break
                except (urllib.error.HTTPError, urllib.error.URLError, ConnectionError, TimeoutError) as e:
                    if attempt < 2:
                        print(f" R{attempt+1}", end="", flush=True)
                        time.sleep(3 * (attempt + 1))
                        continue
                    nim_result = {"error": str(e)}
                except Exception as e:
                    nim_result = {"error": str(e)}
                    break

            if nim_result is None:
                nim_result = {"error": "Failed after 3 retries"}

            if "error" in nim_result:
                print(f" ERROR: {nim_result['error'][:80]}")
                error_count += 1
                existing_analyzed[photo_file] = {
                    "path": photo_path,
                    **dims,
                    "nim_error": str(nim_result["error"])[:200]
                }
            else:
                analyzed_count += 1
                if was_retry:
                    retried_count += 1
                photo_data = {
                    "path": photo_path,
                    **dims,
                    "nim_room_type": nim_result.get("room_type") or "other",
                    "nim_quality": nim_result.get("quality") or "unknown",
                    "nim_composition": nim_result.get("composition") or "unknown",
                    "nim_features": nim_result.get("features") or "",
                    "nim_description": nim_result.get("description") or "",
                    "nim_best_for": nim_result.get("best_for") or "gallery",
                    "nim_has_people": bool(nim_result.get("has_people", False)),
                    "nim_tags": nim_result.get("tags") or [],
                    "nim_model": model,
                }
                existing_analyzed[photo_file] = photo_data
                q = photo_data["nim_quality"]
                rt = photo_data["nim_room_type"]
                # Shorten common regurgitated values
                if "|" in rt:
                    rt = "other"
                still_placeholder = is_placeholder_result(photo_data)
                flag = " [STILL PLACEHOLDER]" if still_placeholder else ""
                print(f" OK ({rt}, {q}){flag}")

            # Rate limit: NIM API is fast but be gentle
            time.sleep(0.3)

        # Update index in real-time to avoid losing progress
        INDEX_FILE.write_text(json.dumps(index_data, indent=2) + "\n")
        print(f"  (checkpoint saved)")

    return analyzed_count, skip_count, error_count, retried_count


def process_published_photos(index_data):
    """Index all published photos with their dimensions and format"""
    if "houses" not in index_data:
        index_data["houses"] = {}

    for house_id in sorted(os.listdir(PUBLISHED_DIR)):
        house_dir = PUBLISHED_DIR / house_id
        if not house_dir.is_dir():
            continue

        avif_files = sorted([f for f in os.listdir(house_dir)
                            if f.lower().endswith(".avif")])

        if not avif_files:
            continue

        print(f"  Published {house_id}: {len(avif_files)} AVIF files")

        if house_id not in index_data["houses"]:
            index_data["houses"][house_id] = {
                "name": house_id.replace("-", " ").title(),
                "town": "",
                "photos": {}
            }

        for avif_file in avif_files:
            avif_path = str(house_dir / avif_file)
            dims = get_image_dimensions(avif_path)

            # Find matching staging photo for source reference
            base_name = os.path.splitext(avif_file)[0]
            source = ""
            staging_photos = index_data.get("staging", {}).get(house_id, {}).get("photos", {})
            for sfile, sinfo in staging_photos.items():
                if sfile.startswith(base_name):
                    source = sinfo.get("path", "")
                    break

            index_data["houses"][house_id]["photos"][avif_file] = {
                "path": avif_path,
                "format": "avif",
                **dims,
                "source": source,
                "tags": ["published"],
                "scene": "",
                "quality": "",
                "page_label": ""
            }


def scan_remaining_houses(index_data):
    """Add entries for houses that have no photos"""
    houses = json.loads(HOUSE_MAP_FILE.read_text())

    for house in houses:
        house_id = house["id"]
        if house_id not in index_data.get("houses", {}):
            index_data.setdefault("houses", {})[house_id] = {
                "name": house.get("address", house_id),
                "town": house.get("town", ""),
                "photos": {},
                "status": "coming_soon"
            }

        # Ensure houses have proper structure
        h = index_data["houses"][house_id]
        if "photos" not in h:
            h["photos"] = {}
        if not h["photos"]:
            h["status"] = h.get("status", "coming_soon")
        elif "status" not in h:
            h["status"] = "published"


def compute_coverage(index_data):
    """Compute coverage summary"""
    houses = index_data.get("houses", {})
    staging = index_data.get("staging", {})

    total_houses = len(houses)
    houses_with_published = sum(1 for h in houses.values() if h.get("photos"))
    houses_coming_soon = sum(1 for h in houses.values() if not h.get("photos"))

    total_published = sum(len(h.get("photos", {})) for h in houses.values())
    total_staging = sum(len(s.get("photos", {})) for s in staging.values())

    # Count importer-blocked houses
    blocked = []
    house_map = json.loads(HOUSE_MAP_FILE.read_text())
    for h in house_map:
        if h["id"] not in staging:
            blocked.append(h["id"])
        elif not os.listdir(STAGING_DIR / h["id"]):
            blocked.append(h["id"])

    # NIM analysis quality summary: how many staging photos have a usable
    # analysis vs. an outright error vs. echoed placeholder/junk text.
    nim_total = 0
    nim_ok = 0
    nim_errors = 0
    nim_placeholder = 0
    for s in staging.values():
        for photo_data in s.get("photos", {}).values():
            nim_total += 1
            if "nim_error" in photo_data:
                nim_errors += 1
            elif "nim_room_type" not in photo_data:
                nim_errors += 1  # never analyzed
            elif is_placeholder_result(photo_data):
                nim_placeholder += 1
            else:
                nim_ok += 1

    index_data["coverage"] = {
        "generated": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "total_houses": total_houses,
        "houses_with_published_photos": houses_with_published,
        "houses_coming_soon": houses_coming_soon,
        "total_published_avif_files": total_published,
        "total_staging_originals": total_staging,
        "houses_without_staging_photos": blocked,
        "import_blocked_focushive": [
            "ravenswood-01 (313 Walnut)",
            "ravenswood-02 (107 Virginia St)",
            "parkersburg-03 (900 32nd St)",
            "ravenswood-04 (200 Gallatin)"
        ],
        "no_sources": ["ravenswood-05 (216 Sand St)"],
        "nim_analysis": {
            "total_staging_photos": nim_total,
            "analyzed_ok": nim_ok,
            "errors_or_unanalyzed": nim_errors,
            "placeholder_junk": nim_placeholder,
        }
    }


def parse_args():
    parser = argparse.ArgumentParser(
        description="Batch Nvidia NIM vision analysis for staging photos."
    )
    parser.add_argument(
        "--retry-failed", action="store_true",
        help="Also reprocess photos that were previously analyzed but returned "
             "echoed placeholder/junk text (in addition to never-analyzed photos)."
    )
    parser.add_argument(
        "--model", default=NIM_MODEL,
        help=f"NIM model id to use for this run (default: {NIM_MODEL})"
    )
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 60)
    print("Mt Cottages Photo Index Pipeline")
    print("Phase 3-4: NIM Analysis + Index Build")
    print("=" * 60)
    if args.retry_failed:
        print(f"Mode: --retry-failed (model: {args.model})")

    # Load existing index if any
    if INDEX_FILE.exists():
        index_data = json.loads(INDEX_FILE.read_text())
        print(f"Loaded existing index (version {index_data.get('version', 0)})")
    else:
        index_data = {"version": 1, "generated": "", "generator": __file__}
    index_data["version"] = 2
    index_data["generator"] = "scripts/analyze_photos_nim.py"

    # Get NIM API key
    api_key = get_nim_key()
    if not api_key:
        print("ERROR: No NIM API key found")
        print("Set NIM_KEY env var or ensure Azure CLI is logged in")
        sys.exit(1)
    print(f"NIM key obtained ({api_key[:8]}...{api_key[-4:]})")

    # Phase 3: Analyze staging photos
    print("\n--- Phase 3: NIM Vision Analysis ---")
    analyzed, skipped, errors, retried = process_staging_photos(
        api_key, index_data, model=args.model, retry_failed=args.retry_failed
    )
    print(f"\nAnalysis complete: {analyzed} analyzed ({retried} retried), {skipped} skipped, {errors} errors")

    # Phase 4: Build complete index
    print("\n--- Phase 4: Building Complete Index ---")

    # Process published photos
    print("Processing published photos...")
    process_published_photos(index_data)

    # Add remaining houses
    print("Scanning remaining houses...")
    scan_remaining_houses(index_data)

    # Compute coverage
    print("Computing coverage...")
    compute_coverage(index_data)

    # Write final index
    index_data["generated"] = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())

    INDEX_FILE.write_text(json.dumps(index_data, indent=2) + "\n")
    print(f"\nIndex written to {INDEX_FILE}")

    # Print summary
    c = index_data.get("coverage", {})
    print(f"\n=== Summary ===")
    print(f"Total houses: {c.get('total_houses', 0)}")
    print(f"Houses with published photos: {c.get('houses_with_published_photos', 0)}")
    print(f"Houses coming soon: {c.get('houses_coming_soon', 0)}")
    print(f"Total published AVIF files: {c.get('total_published_avif_files', 0)}")
    print(f"Total staging originals: {c.get('total_staging_originals', 0)}")

    blocked = c.get("import_blocked_focushive", [])
    if blocked:
        print(f"\nImport blocked (focushive tenant): {len(blocked)} houses")
        for b in blocked:
            print(f"  - {b}")

    print(f"\nDone! Index saved to {INDEX_FILE}")


if __name__ == "__main__":
    main()
