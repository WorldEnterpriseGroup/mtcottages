#!/usr/bin/env python3
"""Analyze imported photos using Nvidia NIM vision API.

Usage: python3 scripts/analyze-photos-nim.py <house-id>
Example: python3 scripts/analyze-photos-nim.py parkersburg-02
"""

import base64
import json
import os
import sys
import time
import urllib.request
import urllib.error

from PIL import Image

NIM_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions"
NIM_MODEL = "meta/llama-3.2-11b-vision-instruct"

PHOTO_DIR = "sharepoint-download-staging"
TMP_DIR = "/tmp/nim-analysis"

PROMPT = (
    "Describe this photo for a furnished cottage rental listing. "
    "What room or area is shown? What features are visible? "
    "What is the photo quality like? "
    "Keep your response to 3-4 concise sentences."
)


def get_api_key():
    key = os.environ.get("NIM_KEY")
    if not key:
        raise RuntimeError("NIM_KEY environment variable not set")
    return key


def resize_image(src_path):
    """Resize image to max 1200px on longest edge, save as JPEG quality 80."""
    os.makedirs(TMP_DIR, exist_ok=True)
    basename = os.path.basename(src_path)
    # Strip extension, force .jpg
    name_no_ext = os.path.splitext(basename)[0]
    dst_path = os.path.join(TMP_DIR, f"{name_no_ext}.jpg")

    img = Image.open(src_path)
    # Convert RGBA/P modes to RGB
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    img.thumbnail((1200, 1200))
    img.save(dst_path, "JPEG", quality=80)
    return dst_path


def analyze_photo(api_key, image_path):
    """Send a single photo to Nvidia NIM and return the description."""
    # Resize first
    resized = resize_image(image_path)

    with open(resized, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("utf-8")

    payload = {
        "model": NIM_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                    },
                ],
            }
        ],
        "max_tokens": 300,
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        NIM_ENDPOINT,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode("utf-8"))
        return result["choices"][0]["message"]["content"].strip()
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return f"ERROR-HTTP {e.code}: {body[:200]}"
    except urllib.error.URLError as e:
        return f"ERROR-NET: {e.reason}"
    except Exception as e:
        return f"ERROR: {e}"


def quality_assessment(desc):
    """Make a best guess at photo quality from the description."""
    desc_lower = desc.lower()
    if any(w in desc_lower for w in ["error", "unable to", "cannot determine"]):
        return "analysis failed"
    if any(w in desc_lower for w in ["blurry", "blurred", "out of focus", "motion blur", "low light", "dark", "overexposed", "underexposed", "noisy", "grainy"]):
        return "poor quality"
    if any(w in desc_lower for w in ["well-lit", "well lit", "clear", "sharp", "good lighting", "natural light", "bright"]):
        return "good quality"
    return "adequate quality"


def recommended_section(desc):
    """Map scene description to a listing section."""
    desc_lower = desc.lower()
    if any(w in desc_lower for w in ["error", "unable to", "cannot determine"]):
        return "n/a (error)"
    if any(w in desc_lower for w in ["living room", "sitting area", "lounge", "sofa", "couch", "fireplace", "entertainment"]):
        return "living room"
    if any(w in desc_lower for w in ["kitchen", "counter", "stove", "oven", "refrigerator", "fridge", "microwave", "cabinets", "sink", "dishwasher"]):
        return "kitchen"
    if any(w in desc_lower for w in ["bedroom", "bed", "mattress", "nightstand", "dresser"]):
        return "bedroom"
    if any(w in desc_lower for w in ["bathroom", "shower", "bathtub", "tub", "toilet", "vanity", "sink"]):
        return "bathroom"
    if any(w in desc_lower for w in ["dining", "dining table", "dining room", "table and chairs", "breakfast"]):
        return "dining area"
    if any(w in desc_lower for w in ["exterior", "front", "facade", "house", "building", "outside", "driveway", "yard", "garden", "lawn", "patio", "deck", "porch", "balcony"]):
        return "exterior"
    if any(w in desc_lower for w in ["stairs", "staircase", "hallway", "corridor", "entry", "foyer"]):
        return "entry/hallway"
    if any(w in desc_lower for w in ["office", "desk", "workspace", "study"]):
        return "home office"
    if any(w in desc_lower for w in ["laundry", "washer", "dryer", "utility"]):
        return "utility/laundry"
    return "general interior"


def process_house(house_id):
    """Process all photos for a given house."""
    api_key = get_api_key()
    house_dir = os.path.join(PHOTO_DIR, house_id)

    if not os.path.isdir(house_dir):
        print(f"ERROR: Directory {house_dir} not found", file=sys.stderr)
        sys.exit(1)

    # Collect image files sorted
    image_files = sorted(
        [
            os.path.join(house_dir, f)
            for f in os.listdir(house_dir)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]
    )

    if not image_files:
        print(f"ERROR: No image files found in {house_dir}", file=sys.stderr)
        sys.exit(1)

    results = []

    print(f"\n{'='*60}")
    print(f"Processing {house_id} ({len(image_files)} photos)")
    print(f"{'='*60}\n")

    for i, img_path in enumerate(image_files, 1):
        photo_name = os.path.basename(img_path)
        print(f"  [{i}/{len(image_files)}] {photo_name}... ", end="", flush=True)

        # Show resizing progress
        print(f"(resizing... ", end="", flush=True)
        try:
            desc = analyze_photo(api_key, img_path)
            quality = quality_assessment(desc)
            section = recommended_section(desc)
            results.append(
                {
                    "photo": photo_name,
                    "description": desc,
                    "quality": quality,
                    "section": section,
                }
            )
            print(f"done)")
            print(f"    Description: {desc}")
            print(f"    Quality: {quality} | Section: {section}")
        except Exception as e:
            print(f"FAILED: {e}")
            results.append(
                {
                    "photo": photo_name,
                    "description": f"ERROR: {e}",
                    "quality": "failed",
                    "section": "n/a",
                }
            )

        # Small delay to avoid flooding API
        time.sleep(0.5)

    # Print summary
    print(f"\n{'='*60}")
    print(f"=== {house_id} ===")
    print(f"{'='*60}")
    for r in results:
        print(f"{r['photo']}: {r['description']}")
        print(f"  Quality: {r['quality']} | Section: {r['section']}")
        print()

    # Best picks
    good_photos = [r for r in results if r['quality'] in ('good quality', 'adequate quality') and r['section'] != 'n/a (error)']
    if good_photos:
        print(f"Best picks: ", end="")
        picks = []
        # Pick hero candidate: first exterior or living room
        hero = next((r for r in good_photos if r['section'] == 'exterior'), None)
        if hero:
            picks.append(f"{hero['photo']} (hero candidate - exterior)")
        # Pick gallery candidates
        gallery = [r for r in good_photos if r['section'] not in ('exterior',) and r['photo'] != (hero['photo'] if hero else None)]
        for g in gallery[:4]:
            picks.append(f"{g['photo']} ({g['section']})")
        if not picks:
            picks = [f"{r['photo']} ({r['section']})" for r in good_photos[:3]]
        print(", ".join(picks))
    else:
        print("No suitable photos identified for Best picks.")

    print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/analyze-photos-nim.py <house-id>", file=sys.stderr)
        sys.exit(1)
    process_house(sys.argv[1])
