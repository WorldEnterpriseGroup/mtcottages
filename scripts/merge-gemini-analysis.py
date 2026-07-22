#!/usr/bin/env python3
"""
Merge `hm analyze --photo` JSON results into `_data/photo-index.json`.

Usage:
  python3 scripts/merge-gemini-analysis.py /tmp/gemini-analysis-results.json

Reads the JSON output from `hm analyze --output json`, pairs each result
with the matching entry in photo-index.json's staging section by matching
the file path, and writes back the updated index.

If the report file contains errors (missing photos, failures), they are
listed to stderr but partial results are still merged.
"""

import json
import os
import re
import sys

STAGING_ROOT = os.path.join(os.path.dirname(__file__), '..', 'sharepoint-download-staging')

def resolve_house_id(file_path: str) -> tuple[str, str] | None:
    """Given an absolute file path, return (house_id, filename) or None."""
    fp = os.path.normpath(file_path)
    parts = fp.split(os.sep)
    try:
        staging_idx = parts.index('sharepoint-download-staging')
    except ValueError:
        return None
    if staging_idx + 2 >= len(parts):
        return None
    house_id = parts[staging_idx + 1]
    filename = parts[-1]
    return (house_id, filename)


def load_index(path: str) -> dict:
    with open(path, 'r') as f:
        return json.load(f)


def save_index(path: str, data: dict) -> None:
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Written {path}")


def merge_results(index_path: str, results_path: str) -> None:
    index = load_index(index_path)
    staging = index.get('staging', {})

    with open(results_path, 'r') as f:
        results = json.load(f)

    updated = 0
    skipped = 0
    errors = []
    current_cache = set()

    for entry in results:
        file_path = entry.get('file', '')
        error = entry.get('error')

        pair = resolve_house_id(file_path)
        if not pair:
            skipped += 1
            continue

        house_id, filename = pair

        if house_id not in staging:
            errors.append(f"House {house_id} not found in staging for {filename}")
            skipped += 1
            continue

        # The staging key for this photo may be either the exact filename
        # from the path (e.g. photo-01.jpg) or a case-variant.
        photos = staging[house_id].get('photos', {})
        # Try exact match first, then case-insensitive
        photo_key = None
        if filename in photos:
            photo_key = filename
        else:
            # Try matching by number ignoring extension
            base_match = re.match(r'(photo-\d+)\.', filename)
            if base_match:
                prefix = base_match.group(1)
                for pk in photos:
                    if pk.startswith(prefix):
                        photo_key = pk
                        break

        if not photo_key:
            errors.append(f"Photo {filename} not found in {house_id} staging keys")
            skipped += 1
            continue

        if error:
            errors.append(f"Analysis error for {house_id}/{filename}: {error[:200]}")
            skipped += 1
            continue

        result = entry.get('result') or entry  # flat or nested
        if not result.get('room_type'):
            errors.append(f"Empty result for {house_id}/{filename}")
            skipped += 1
            continue

        photo = photos[photo_key]
        # Write the NIM-prefixed fields with gemini source tag
        photo['gemini_room_type'] = result.get('room_type')
        photo['gemini_quality'] = result.get('quality')
        photo['gemini_composition'] = result.get('composition')
        photo['gemini_features'] = result.get('features', '')
        photo['gemini_description'] = result.get('description', '')
        photo['gemini_best_for'] = result.get('best_for', '')
        photo['gemini_has_people'] = result.get('has_people', False)
        photo['gemini_tags'] = result.get('tags', [])
        photo['gemini_model'] = 'gemini-3.6-flash'
        current_cache.add((house_id, photo_key))
        updated += 1

    # Report
    print(f"Updated: {updated} photos")
    print(f"Skipped: {skipped}")
    errors = errors[:20]  # cap errors for readability
    for e in errors:
        print(f"  WARN: {e}", file=sys.stderr)

    # Also add a gemini_analyzed_at timestamp
    from datetime import datetime, timezone
    index['gemini_analyzed_at'] = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
    index['gemini_model'] = 'gemini-3.6-flash'
    index['generator'] = index.get('generator', '') + ' + Gemini 3.6 Flash re-analysis'

    save_index(index_path, index)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: merge-gemini-analysis.py <results.json>")
        sys.exit(1)

    index_path = os.path.join(
        os.path.dirname(__file__), '..', '_data', 'photo-index.json'
    )
    merge_results(index_path, sys.argv[1])
    print("Done.")
