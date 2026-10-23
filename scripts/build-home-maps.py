#!/usr/bin/env python3
"""Build the static street-map images for the home microsite location pages.

Downloads the OpenStreetMap standard tiles around each home once, stitches a
1280x720 image centred on the home, and saves it to assets/images/maps/<id>.png.
The page shows the image with a pin and the "© OpenStreetMap contributors"
credit, so visitors see a real street map without loading a map service.
Re-run only when a home is added or its coordinates change:
    python3 scripts/build-home-maps.py
"""
import io
import math
import time
import urllib.request
from pathlib import Path

from PIL import Image

HOMES = {
    "henrietta": (38.948959, -81.757844),
    "oak": (39.279273, -81.530239),
    "broad": (39.281665, -81.528869),
}
ZOOM = 16
WIDTH, HEIGHT = 1280, 720
TILE = 256
USER_AGENT = "mtcottages.com static map builder (https://mtcottages.com)"
OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "maps"


def to_pixels(lat: float, lng: float, zoom: int) -> tuple[float, float]:
    scale = TILE * 2**zoom
    x = (lng + 180) / 360 * scale
    rad = math.radians(lat)
    y = (1 - math.log(math.tan(rad) + 1 / math.cos(rad)) / math.pi) / 2 * scale
    return x, y


def tile(x: int, y: int, cache: dict) -> Image.Image:
    if (x, y) not in cache:
        request = urllib.request.Request(f"https://tile.openstreetmap.org/{ZOOM}/{x}/{y}.png", headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(request, timeout=30) as response:
            cache[(x, y)] = Image.open(io.BytesIO(response.read())).convert("RGB")
        time.sleep(0.3)
    return cache[(x, y)]


def build(home_id: str, lat: float, lng: float, cache: dict) -> None:
    cx, cy = to_pixels(lat, lng, ZOOM)
    left, top = cx - WIDTH / 2, cy - HEIGHT / 2
    canvas = Image.new("RGB", (WIDTH, HEIGHT))
    for tx in range(int(left // TILE), int((left + WIDTH) // TILE) + 1):
        for ty in range(int(top // TILE), int((top + HEIGHT) // TILE) + 1):
            canvas.paste(tile(tx, ty, cache), (round(tx * TILE - left), round(ty * TILE - top)))
    OUT.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT / f"{home_id}.png", optimize=True)
    print(f"wrote {OUT / f'{home_id}.png'}")


if __name__ == "__main__":
    tiles: dict = {}
    for key, (lat, lng) in HOMES.items():
        build(key, lat, lng, tiles)
