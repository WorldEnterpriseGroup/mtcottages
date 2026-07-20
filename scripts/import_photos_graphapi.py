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

# Tenant ID for taomgt
TAOMGT_TENANT = "682e7365-7f2b-4b39-843e-372f114ddf76"
TAOMGT_SITE_HOST = "taomgt.sharepoint.com"

# Known site IDs (discovered via Graph API)
SITES = {
    "taomgt": {
        "TaoCottage": "taomgt.sharepoint.com,af14de09-90d0-4533-9d6e-6ceb96b8f64c,fe277eac-da67-4b05-83f0-cb21c2cb4df6",
    }
}

def get_token():
    """Get a fresh access token from the rclone refresh token"""
    with open(os.path.expanduser("~/.config/rclone/rclone.conf")) as f:
        content = f.read()
    match = re.search(r'\[REFRESH_TEST\]\ntoken = (.*?)(?:\n\[|\Z)', content, re.DOTALL)
    if not match:
        raise RuntimeError("No REFRESH_TEST token found in rclone config")
    token_data = json.loads(match.group(1))

    data = urllib.parse.urlencode({
        "client_id": "fcda3faa-1259-4b56-a04d-3281fc98d8f1",
        "grant_type": "refresh_token",
        "refresh_token": token_data["refresh_token"],
        "scope": "https://graph.microsoft.com/.default offline_access"
    }).encode()

    req = urllib.request.Request(
        f"https://login.microsoftonline.com/{TAOMGT_TENANT}/oauth2/v2.0/token",
        data=data, method="POST"
    )
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read())
    return result["access_token"]

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

def import_house(token, house_id, sources, limit=50):
    """Import photos for a single house from its sources"""
    dest_dir = STAGING_DIR / house_id
    dest_dir.mkdir(parents=True, exist_ok=True)

    # Check what we already have
    existing_files = set(os.listdir(dest_dir))
    existing_count = len(existing_files)
    existing_hashes = set()

    # Load existing hashes from manifest
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

        # Determine site name from URL
        site_name = None
        for tenant_key, sites in SITES.items():
            for name, sid in sites.items():
                if sid.split(",")[0] in site_url:
                    site_name = name
                    break

        if not site_name:
            if "taomgt.sharepoint.com/sites/TaoCottage" in site_url:
                site_name = "TaoCottage"
            else:
                print(f"  SKIP {site_url} - no site mapping for {site_url}")
                manifest["errors"].append(f"No site mapping for {site_url}")
                continue

        site_id = SITES["taomgt"].get(site_name)
        if not site_id:
            manifest["errors"].append(f"No site ID for {site_name}")
            continue

        print(f"  Listing files from {site_name}: {folder_url}")

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

    return files_imported - existing_count, manifest["errors"]

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

    # Get token
    print("Getting access token...")
    token = get_token()
    print("Token obtained.\n")

    selected_houses = [h for h in houses if h["include_public"] and (not args.house or h["id"] == args.house)]

    for house in selected_houses:
        house_id = house["id"]
        sources = house.get("sources", [])

        if not sources:
            print(f"\n{house_id}: No sources configured, skipping")
            continue

        # Filter to only taomgt sources (focushive won't work with this token)
        valid_sources = []
        for s in sources:
            if "taomgt.sharepoint.com" in s["site_url"]:
                valid_sources.append(s)
            else:
                print(f"{house_id}: BLOCKED: no focushive auth - {s['site_url']}")

        if not valid_sources:
            print(f"{house_id}: No taomgt sources available")
            continue

        csv_statuses = []
        for s in valid_sources:
            row = csv_inventory.get((s["site_url"], s["folder_url"]))
            if row:
                csv_statuses.append(f"{row.get('status', '?')}:{row.get('photo_files', '?')}")

        print(f"\n{house_id} ({house['address']}, {house['town']})")
        print(f"  Sources: {valid_sources[0]['folder_url']}")
        print(f"  CSV status: {', '.join(csv_statuses)}")

        new_count, errors = import_house(token, house_id, valid_sources, limit=args.limit)

        if new_count > 0:
            print(f"  Imported {new_count} new photos")
        else:
            print(f"  No new photos imported")

        if errors:
            print(f"  Errors: {len(errors)}")

if __name__ == "__main__":
    main()
