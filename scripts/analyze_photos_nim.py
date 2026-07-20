#!/usr/bin/env python3
"""
Batch Nvidia NIM vision analysis for all staging photos.
Resizes to 1200px max dimension before sending.
"""
import json, os, sys, base64, io, time, hashlib, subprocess
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

NIM_PROMPT = """Return ONLY valid JSON (no markdown, no explanation) for this real estate photo analysis.
{
  "room_type": "exterior|living room|kitchen|bedroom|bathroom|dining|detail|outdoor_space|hallway|other",
  "quality": "excellent|good|adequate|poor",
  "composition": "professional|smartphone|snapshot",
  "features": "comma-separated visible features",
  "description": "one sentence scene description",
  "best_for": "hero|gallery|thumbnail|skip",
  "has_people": false,
  "tags": ["relevant", "tags", "here"]
}"""

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

def analyze_with_nim(api_key, image_path):
    """Send an image to Nvidia NIM for analysis"""
    try:
        img = resize_image_to_max(image_path)
        b64 = image_to_base64(img)

        payload = json.dumps({
            "model": NIM_MODEL,
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

def process_staging_photos(api_key, index_data):
    """Process all photos in staging that haven't been analyzed yet"""
    houses = json.loads(HOUSE_MAP_FILE.read_text())
    house_map = {h["id"]: h for h in houses}

    # Track what's been analyzed
    analyzed_count = 0
    skip_count = 0
    error_count = 0

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

            # Skip if already analyzed
            if photo_file in existing_analyzed and "nim_room_type" in existing_analyzed[photo_file]:
                skip_count += 1
                continue

            print(f"  Analyzing {photo_file}...", end="", flush=True)

            # Get dimensions first
            dims = get_image_dimensions(photo_path)

            # Run NIM analysis with retries
            nim_result = None
            for attempt in range(3):
                try:
                    nim_result = analyze_with_nim(api_key, photo_path)
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
                photo_data = {
                    "path": photo_path,
                    **dims,
                    "nim_room_type": nim_result.get("room_type", "other"),
                    "nim_quality": nim_result.get("quality", "unknown"),
                    "nim_composition": nim_result.get("composition", "unknown"),
                    "nim_features": nim_result.get("features", ""),
                    "nim_description": nim_result.get("description", ""),
                    "nim_best_for": nim_result.get("best_for", "gallery"),
                    "nim_has_people": nim_result.get("has_people", False),
                    "nim_tags": nim_result.get("tags", []),
                }
                existing_analyzed[photo_file] = photo_data
                q = nim_result.get("quality", "?")
                rt = nim_result.get("room_type", "?")
                # Shorten common regurgitated values
                if "|" in rt:
                    rt = "other"
                print(f" OK ({rt}, {q})")

            # Rate limit: NIM API is fast but be gentle
            time.sleep(0.3)

        # Update index in real-time to avoid losing progress
        INDEX_FILE.write_text(json.dumps(index_data, indent=2) + "\n")
        print(f"  (checkpoint saved)")

    return analyzed_count, skip_count, error_count


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
        "no_sources": ["ravenswood-05 (216 Sand St)"]
    }


def main():
    print("=" * 60)
    print("Mt Cottages Photo Index Pipeline")
    print("Phase 3-4: NIM Analysis + Index Build")
    print("=" * 60)

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
    analyzed, skipped, errors = process_staging_photos(api_key, index_data)
    print(f"\nAnalysis complete: {analyzed} analyzed, {skipped} skipped, {errors} errors")

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
