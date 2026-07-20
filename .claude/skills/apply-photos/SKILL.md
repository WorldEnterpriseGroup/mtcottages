---
name: apply-photos
description: Import photos from SharePoint, preview results, and integrate them into the Mt Cottages site. Only user-invokable due to file-modifying side effects.
disable-model-invocation: true
---

# /apply-photos

Import property photos from SharePoint, review, and commit them to the site.

## Prerequisites

- Requires the `m365` CLI (`@pnp/cli-microsoft365`) to be authenticated and logged in
- The ignored `homes.csv` and `sharepoint-house-map.json` must be present in the repo root
- The target property's source folders must be mapped in `sharepoint-house-map.json`

## Process

### 1. Run the importer

```bash
ruby scripts/import_sharepoint_photos.rb
```

This reads from the ignored inventory/map, downloads image files from mapped SharePoint source folders into `assets/images/cottages/<house-id>/`, and records provenance in the ignored `sharepoint-photo-manifest.json`.

### 2. Visual review

The importer downloads more than what should go public. Review each downloaded directory:

- Remove construction, inspection, maintenance, duplicate, sideways, or otherwise uncertain images.
- Never reuse one source file or hash across two houses.
- For `216 Sand St`: no source folder exists yet in the house map — do not publish until an exact source is identified.
- For `255 Court St`: internal only — never publish.
- `287 Ridgeway Ave`: NOT a canonical property — do not create or populate a photo directory.

### 3. Integrate approved photos

After visual curation, update the relevant `.html` pages to reference the approved images using the public house ID paths (e.g., `assets/images/cottages/parkersburg-01/kitchen.jpg`).

### 4. Commit

```bash
git add assets/images/cottages/
git commit -m "Add photos for <property-description>"
```

The ignored manifests (`sharepoint-photo-manifest.json`, `sharepoint-house-map.json`, `homes.csv`) must never be added to Git.
