#!/usr/bin/env python3
"""
Import photos from SharePoint via Microsoft Graph API.
Falls back to direct SharePoint REST API if Graph doesn't work.
Uses refresh token from rclone config to get access tokens.
"""
import json, os, sys, hashlib, re, base64, urllib.request, urllib.parse
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
REPO_DIR = SCRIPT_DIR.parent
STAGING_DIR = REPO_DIR / "sharepoint-download-staging"
HOUSE_MAP_FILE = REPO_DIR / "sharepoint-house-map.json"
CSV_FILE = REPO_DIR / "homes.csv"
MANIFEST_FILE = REPO_DIR / "sharepoint-photo-manifest.json"

# Known tenants. Each maps to the rclone.conf section holding a refresh
# token for that tenant (see ~/.config/rclone/rclone.conf). Multiple
# ad-hoc M365T*/M365P* sections exist for focushive as redundant refresh
# tokens from earlier device-code logins; TOKEN_SECTION picks one that is
# known to refresh successfully.
TENANTS = {
    "taomgt": {
        "tenant_id": "682e7365-7f2b-4b39-843e-372f114ddf76",
        "host": "taomgt.sharepoint.com",
        "token_section": "REFRESH_TEST",
    },
    "focushive": {
        "tenant_id": "2febe90d-872e-4e31-b1ee-7898aac0159c",
        "host": "focushive.sharepoint.com",
        "token_section": "M365TB3D54258D6E8",
    },
}

# Shared multi-tenant app registration ("Focus Hive CLI") used for the
# refresh-token grant against either tenant.
CLIENT_ID = "fcda3faa-1259-4b56-a04d-3281fc98d8f1"

# Known site IDs (discovered via Graph API), grouped by tenant.
SITES = {
    "taomgt": {
        "TaoCottage": "taomgt.sharepoint.com,af14de09-90d0-4533-9d6e-6ceb96b8f64c,fe277eac-da67-4b05-83f0-cb21c2cb4df6",
    },
    "focushive": {
        "UnitedHome": "focushive.sharepoint.com,1fbe1862-d679-4a4f-88f4-f73fbbd1b72b,e8925c59-e26c-424b-b53c-4a9e962c977b",
        "CivilEngineering": "focushive.sharepoint.com,187d3ca1-f1ea-499b-b391-1a15797e2f78,7ca45b0a-c693-411e-b82f-e96e70e39e9f",
    },
}

_TOKEN_CACHE = {}

def get_token(tenant_key="taomgt"):
    """Get a fresh access token from the rclone-stored refresh token for a tenant"""
    if tenant_key in _TOKEN_CACHE:
        return _TOKEN_CACHE[tenant_key]

    tenant = TENANTS[tenant_key]
    section = tenant["token_section"]

    with open(os.path.expanduser("~/.config/rclone/rclone.conf")) as f:
        content = f.read()
    match = re.search(rf'\[{re.escape(section)}\]\ntoken = (.*?)(?:\n\[|\Z)', content, re.DOTALL)
    if not match:
        raise RuntimeError(f"No {section} token found in rclone config for tenant {tenant_key}")
    token_data = json.loads(match.group(1))

    data = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "grant_type": "refresh_token",
        "refresh_token": token_data["refresh_token"],
        "scope": "https://graph.microsoft.com/.default offline_access"
    }).encode()

    req = urllib.request.Request(
        f"https://login.microsoftonline.com/{tenant['tenant_id']}/oauth2/v2.0/token",
        data=data, method="POST"
    )
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read())
    _TOKEN_CACHE[tenant_key] = result["access_token"]
    return _TOKEN_CACHE[tenant_key]

def resolve_site(site_url):
    """Return (tenant_key, site_name, site_id) for a SharePoint site_url, or (None, None, None)."""
    m = re.match(r'https://([^/]+)/sites/([^/]+)', site_url.strip())
    if not m:
        return None, None, None
    host, site_name = m.group(1), m.group(2)
    for tenant_key, tenant in TENANTS.items():
        if tenant["host"] == host:
            site_id = SITES.get(tenant_key, {}).get(site_name)
            if site_id:
                return tenant_key, site_name, site_id
            return tenant_key, site_name, None
    return None, site_name, None

def graph_get(token, url):
    """Make a Graph API GET request"""
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

def graph_get_all(token, url):
    """Get all pages from a Graph API endpoint"""
    items = []
    while url:
        data = graph_get(token, url)
        items.extend(data.get("value", []))
        url = data.get("@odata.nextLink")
    return items

def list_folder_contents(token, site_id, folder_path):
    """List contents of a SharePoint folder given its path"""
    # URL-encode each path segment
    segments = folder_path.strip("/").split("/")
    encoded = "/".join(urllib.parse.quote(s, safe="") for s in segments)

    drive_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/{encoded}:/children"
    return graph_get_all(token, drive_url)

def download_file(token, site_id, file_path, destination):
    """Download a file from SharePoint"""
    segments = file_path.strip("/").split("/")
    encoded = "/".join(urllib.parse.quote(s, safe="") for s in segments)

    # First get the download URL
    url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/{encoded}"
    meta = graph_get(token, url)

    download_url = meta.get("@microsoft.graph.downloadUrl")
    if not download_url:
        # Try to get content
        content_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/{encoded}:/content"
        download_url = content_url

    # Download
    if download_url.startswith("https://"):
        req = urllib.request.Request(download_url, headers={"Authorization": f"Bearer {token}"})
    else:
        req = urllib.request.Request(download_url)

    resp = urllib.request.urlopen(req)
    with open(destination, "wb") as f:
        f.write(resp.read())
    return destination

def get_image_files(token, site_id, folder_path, recursive=True):
    """Get all image files from a SharePoint folder"""
    items = list_folder_contents(token, site_id, folder_path)
    image_files = []

    for item in items:
        name = item.get("name", "")
        ext = os.path.splitext(name)[1].lower()
        if ext in (".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic", ".heif"):
            image_files.append({
                "name": name,
                "path": f"{folder_path}/{name}",
                "size": item.get("size", 0),
                "modified": item.get("lastModifiedDateTime", ""),
                "id": item.get("id", ""),
                "downloadUrl": item.get("@microsoft.graph.downloadUrl", "")
            })

        # If folder, optionally recurse
        if recursive and "folder" in item:
            sub_files = get_image_files(token, site_id, f"{folder_path}/{name}", recursive)
            image_files.extend(sub_files)

    return image_files

def import_house(house_id, sources, limit=50):
    """Import photos for a single house from its sources (each source may
    belong to a different tenant; resolved and authenticated per-source)."""
    dest_dir = STAGING_DIR / house_id
    dest_dir.mkdir(parents=True, exist_ok=True)

    # Check what we already have
    existing_files = set(os.listdir(dest_dir))
    existing_count = len(existing_files)
    existing_hashes = set()

    # Hash files already on disk so an interrupted/resumed run (manifest not
    # yet flushed for this batch) never re-downloads a duplicate under a new
    # filename.
    for fname in existing_files:
        try:
            existing_hashes.add(hashlib.sha256((dest_dir / fname).read_bytes()).hexdigest())
        except Exception:
            pass

    # Also load hashes recorded in the manifest (covers prior runs whose
    # files may have since moved elsewhere but are still tracked).
    manifest = {"files": [], "errors": []}
    if MANIFEST_FILE.exists():
        try:
            manifest_data = json.loads(MANIFEST_FILE.read_text())
            if house_id in manifest_data.get("houses", {}):
                for f in manifest_data["houses"][house_id].get("files", []):
                    if os.path.exists(f["path"]):
                        existing_hashes.add(f["sha256"])
        except:
            pass

    files_imported = existing_count

    for source in sources:
        site_url = source["site_url"]
        folder_url = source["folder_url"]

        tenant_key, site_name, site_id = resolve_site(site_url)
        if not tenant_key:
            print(f"  SKIP {site_url} - unknown tenant host")
            manifest["errors"].append(f"Unknown tenant host for {site_url}")
            continue
        if not site_id:
            print(f"  SKIP {site_url} - no site mapping for site '{site_name}' in tenant '{tenant_key}'")
            manifest["errors"].append(f"No site mapping for {site_url}")
            continue

        try:
            token = get_token(tenant_key)
        except Exception as e:
            print(f"  SKIP {site_url} - could not obtain {tenant_key} token: {e}")
            manifest["errors"].append(f"token_error [{tenant_key}]: {e}")
            continue

        print(f"  Listing files from {tenant_key}/{site_name}: {folder_url}")

        # Strip "Shared Documents/" prefix for Graph API paths.
        # The Graph API drive/root:/path is relative to the default
        # document library root, which IS "Shared Documents".
        api_path = re.sub(r'^Shared Documents/', '', folder_url.strip())
        if api_path != folder_url:
            print(f"    API path: {api_path}")

        try:
            # Get the list of image files
            for attempt in range(3):
                try:
                    image_files = get_image_files(token, site_id, api_path)
                    break
                except urllib.error.HTTPError as e:
                    if e.code == 429:  # Rate limited
                        import time
                        time.sleep(5 * (attempt + 1))
                        continue
                    raise
                except Exception as e:
                    print(f"  Error listing files: {e}")
                    manifest["errors"].append(f"list_error: {e}")
                    image_files = []
                    break
            else:
                image_files = []
                print(f"  Failed after 3 retries")
                manifest["errors"].append(f"List retry failed for {folder_url}")

            print(f"  Found {len(image_files)} image files")

            # Sort by size (largest first - prefer better quality)
            image_files.sort(key=lambda x: -x["size"])

            for img_file in image_files:
                if files_imported >= limit:
                    break

                if img_file["name"] in existing_files:
                    continue

                ext = os.path.splitext(img_file["name"])[1].lower()
                target = dest_dir / f"photo-{files_imported + 1:02d}{ext}"

                print(f"  Downloading {img_file['name']} ({img_file['size']/1024/1024:.1f}MB)...")

                try:
                    # Download using available download URL or metadata fetch
                    if img_file.get("downloadUrl"):
                        req = urllib.request.Request(img_file["downloadUrl"])
                    else:
                        # Get file via Graph API
                        segments = img_file["path"].strip("/").split("/")
                        encoded = "/".join(urllib.parse.quote(s, safe="") for s in segments)
                        dl_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/{encoded}:/content"
                        req = urllib.request.Request(dl_url, headers={"Authorization": f"Bearer {token}"})

                    resp = urllib.request.urlopen(req)
                    content = resp.read()

                    # Calculate hash and check for duplicates
                    sha256 = hashlib.sha256(content).hexdigest()
                    if sha256 in existing_hashes:
                        print(f"    (duplicate, skipping)")
                        continue

                    existing_hashes.add(sha256)
                    with open(target, "wb") as f:
                        f.write(content)

                    files_imported += 1
                    manifest["files"].append({
                        "path": str(target),
                        "sha256": sha256,
                        "source_file": img_file["name"],
                        "source_site": site_url,
                        "source_folder": folder_url,
                        "modified": img_file.get("modified", ""),
                        "bytes": img_file.get("size", 0)
                    })
                    print(f"    -> {target.name} (file #{files_imported})")

                except Exception as e:
                    print(f"    Error: {e}")
                    manifest["errors"].append(f"download_error: {img_file['name']}: {e}")

        except Exception as e:
            print(f"  Error processing source: {e}")
            manifest["errors"].append(f"source_error: {folder_url}: {e}")

    persist_manifest(house_id, manifest)
    return files_imported - existing_count, manifest["errors"]

def persist_manifest(house_id, manifest):
    """Merge this run's file/error records into the on-disk manifest, keyed by house."""
    if MANIFEST_FILE.exists():
        try:
            manifest_data = json.loads(MANIFEST_FILE.read_text())
        except Exception:
            manifest_data = {"source": "homes.csv + Microsoft 365 SharePoint", "houses": {}}
    else:
        manifest_data = {"source": "homes.csv + Microsoft 365 SharePoint", "houses": {}}

    manifest_data.setdefault("houses", {})
    house_entry = manifest_data["houses"].setdefault(house_id, {"files": [], "errors": []})
    house_entry.setdefault("files", [])
    house_entry.setdefault("errors", [])

    existing_paths = {f["path"] for f in house_entry["files"]}
    for f in manifest["files"]:
        if f["path"] not in existing_paths:
            house_entry["files"].append(f)
            existing_paths.add(f["path"])

    if manifest["errors"]:
        house_entry["errors"].extend(manifest["errors"])

    MANIFEST_FILE.write_text(json.dumps(manifest_data, indent=2))

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Import photos via Graph API")
    parser.add_argument("--house", help="Specific house ID to import")
    parser.add_argument("--limit", type=int, default=50, help="Max photos per house")
    args = parser.parse_args()

    # Read house map
    houses = json.loads(HOUSE_MAP_FILE.read_text())

    # Read CSV for inventory
    csv_inventory = {}
    import csv
    with open(CSV_FILE, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = (row["site_url"], row["folder_url"])
            csv_inventory[key] = row

    selected_houses = [h for h in houses if h["include_public"] and (not args.house or h["id"] == args.house)]

    for house in selected_houses:
        house_id = house["id"]
        sources = house.get("sources", [])

        if not sources:
            print(f"\n{house_id}: No sources configured, skipping")
            continue

        # Report any source whose tenant/site we can't resolve at all, up front.
        usable_sources = []
        for s in sources:
            tenant_key, site_name, site_id = resolve_site(s["site_url"])
            if not tenant_key or not site_id:
                print(f"{house_id}: BLOCKED: no site mapping for {s['site_url']}")
            else:
                usable_sources.append(s)

        if not usable_sources:
            print(f"{house_id}: No usable sources available")
            continue

        csv_statuses = []
        for s in usable_sources:
            row = csv_inventory.get((s["site_url"], s["folder_url"]))
            if row:
                csv_statuses.append(f"{row.get('status', '?')}:{row.get('photo_files', '?')}")

        print(f"\n{house_id} ({house['address']}, {house['town']})")
        for s in usable_sources:
            print(f"  Source: {s['site_url']} :: {s['folder_url']}")
        print(f"  CSV status: {', '.join(csv_statuses)}")

        new_count, errors = import_house(house_id, usable_sources, limit=args.limit)

        if new_count > 0:
            print(f"  Imported {new_count} new photos")
        else:
            print(f"  No new photos imported")

        if errors:
            print(f"  Errors: {len(errors)}")

if __name__ == "__main__":
    main()
