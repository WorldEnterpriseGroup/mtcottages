#!/usr/bin/env python3
"""Replace rendered near-copies with unused isolated sources deterministically."""

from __future__ import annotations

import importlib.util
import json
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


audit = load_module("mtc_photo_audit_repair", ROOT / "scripts/audit-photo-uniqueness.py")
allocator = load_module("mtc_photo_allocator_repair", ROOT / "scripts/allocate-unique-photos.py")


def main() -> int:
    payload = audit.audit_payload()
    aliases = payload["decoded_pixel_aliases"]
    if not aliases:
        print("No decoded-pixel aliases to repair.")
        return 0

    manifest_path = ROOT / "_data/photo-render-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    used = {entry["source"] for entry in manifest["assets"].values()}
    inventory = audit.eligible_inventory()
    refs = {ref.path: ref for ref in audit.rendered_refs()}
    occupied_fingerprints = {
        fingerprint
        for path in manifest["assets"]
        if (fingerprint := audit.decoded_fingerprint(path))
    }
    repaired = 0

    for paths in aliases.values():
        for old_path in paths[1:]:
            old_entry = manifest["assets"][old_path]
            house_id = old_entry["house_id"]
            ref = refs[old_path]
            replacement = None
            new_path = None
            for candidate in inventory.get(house_id, []):
                if candidate["source"] in used or candidate["reserved"]:
                    continue
                assignment = {
                    "slot": {
                        "page": ref.page,
                        "line": ref.line,
                        "kind": ref.kind,
                    },
                    "source": candidate["source"],
                    "source_house": candidate["house_id"],
                    "source_file": candidate["file"],
                    "dimensions": tuple(old_entry["dimensions"]),
                }
                candidate_path = allocator.destination_for(assignment)
                allocator.build_asset(assignment, candidate_path)
                fingerprint = audit.decoded_fingerprint(candidate_path)
                if fingerprint and fingerprint not in occupied_fingerprints:
                    replacement = candidate
                    new_path = candidate_path
                    occupied_fingerprints.add(fingerprint)
                    break
                (ROOT / candidate_path).unlink(missing_ok=True)
            if not replacement or not new_path:
                raise RuntimeError(f"No distinct unused source available for {old_path}")

            page = ROOT / ref.page
            relative = Path(os.path.relpath(ROOT / new_path, page.parent)).as_posix()
            text = page.read_text(encoding="utf-8")
            if ref.url not in text:
                raise RuntimeError(f"Rendered URL not found in {ref.page}: {ref.url}")
            page.write_text(text.replace(ref.url, relative, 1), encoding="utf-8")
            manifest["assets"][new_path] = {
                "source": replacement["source"],
                "house_id": replacement["house_id"],
                "page": ref.page,
                "kind": ref.kind,
                "dimensions": old_entry["dimensions"],
            }
            del manifest["assets"][old_path]
            (ROOT / old_path).unlink(missing_ok=True)
            used.add(replacement["source"])
            repaired += 1

    manifest["assets"] = dict(sorted(manifest["assets"].items()))
    manifest["generator"] = "scripts/allocate-unique-photos.py + scripts/repair-photo-aliases.py"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Repaired {repaired} decoded-pixel aliases.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
