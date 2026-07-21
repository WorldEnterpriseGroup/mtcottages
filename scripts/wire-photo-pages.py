#!/usr/bin/env python3
"""
Update property detail pages with hero background and venobox gallery.

Maps photo selections from _data/photo-selections.json into each property
page, following the HotelHub theme pattern from parkersburg-01.html.
"""
import json, re, sys
from pathlib import Path
from html import escape

REPO_DIR = Path(__file__).parent.parent
SELECTIONS_FILE = REPO_DIR / "_data/photo-selections.json"

# Each property page: (filename, page title for gallery heading)
PAGES = {
    "parkersburg-02.html": "45th Street House",
    "parkersburg-03.html": "32nd Street Cottage",
    "ravenswood-01.html": "Walnut Cottage",
    "ravenswood-02.html": "Virginia Street House",
    "ravenswood-04.html": "Gallatin House",
}

# Expanded galleries for houses that already have photos but unused AVIFs
EXPAND_GALLERIES = {
    "parkersburg-01.html": ("Broad Street Cottage", [
        ("photo-01.avif", "A cozy bedroom with a wooden bed"),
        ("photo-02.avif", "A cozy living room"),
        ("photo-04.avif", "A bedroom"),
        ("photo-07.avif", "A cozy living room"),
    ]),
    "parkersburg-04.html": ("Broad Street House", [
        ("photo-02.avif", "A view from the front steps"),
        ("photo-04.avif", "A set of wooden stairs"),
    ]),
    "ravenswood-03.html": ("Henrietta Cottage", [
        ("photo-02.avif", "A well-lit bathroom"),
        ("photo-03.avif", "A small bathroom"),
        ("photo-07.avif", "A cozy dining room"),
        ("photo-08.avif", "A cozy dining room"),
    ]),
}


def build_gallery_html(house_id, gallery_list, title):
    """Build venobox gallery HTML for a list of (filename, label) pairs."""
    if not gallery_list:
        return ""

    # Pair into 2-column rows
    pairs = [gallery_list[i:i+2] for i in range(0, len(gallery_list), 2)]
    parts = []
    first = True
    for pair in pairs:
        if first:
            parts.append("""    <div class="rooms-section" style="padding-top: 60px; padding-bottom: 60px;">
      <div class="container">
        <div class="hotelhub-section-title text-center">
          <h4><i class="flaticon flaticon-right-arrow"></i>PHOTO GALLERY</h4>
          <h1>See inside {title}</h1>
        </div>
        <div class="row">""".format(title=escape(title)))
            first = False
        else:
            parts.append("""        <div class="row" style="margin-top: 30px;">""")

        for gf, label in pair:
            gpath = f"assets/images/cottages/{house_id}/{gf}"
            elabel = escape(label[:120])
            parts.append("""          <div class="col-lg-6">
            <div class="rooms-single-single-bx">
              <div class="choose-single-thumbs">
                <a class="venobox" data-gall="house-gallery" href="{path}">
                  <img src="{path}" alt="{label}">
                </a>
              </div>
            </div>
          </div>""".format(path=gpath, label=elabel))

        parts.append("""        </div>""")

    parts.append("""      </div>
    </div>""")
    return "\n".join(parts)


def add_gallery_to_page(filepath, gallery_html, section_marker):
    """
    Find the placeholder section in the page and replace with gallery HTML.
    section_marker is the text just before the gallery placeholder.
    """
    content = filepath.read_text(encoding="utf-8")

    # Pattern: look for "PHOTO GALLERY" section title followed by placeholder
    # or "Photos coming soon" text
    patterns = [
        # "Photos coming soon" inside a gallery section
        (r'(<div class="hotelhub-section-title text-center">\s*'
         r'<h4><i class="flaticon flaticon-right-arrow"></i>PHOTO GALLERY</h4>\s*'
         r'<h1>See inside[^<]+</h1>\s*</div>\s*<div class="row">\s*'
         r'<div class="col-lg-\d+">\s*<div class="text-center"[^>]*>)[^<]+'
         r'(?:Contact us|Photos coming soon|preparing photos)[^<]*(?:</div>\s*){2}'
         r'</div>\s*</div>)',
         lambda m: '<div class="hotelhub-section-title text-center">\n'
                   f'      <h4><i class="flaticon flaticon-right-arrow"></i>PHOTO GALLERY</h4>\n'
                   f'      <h1>See inside {escape(section_marker)}</h1>\n'
                   f'    </div>\n{gallery_html}'),
    ]

    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
        if new_content != content:
            filepath.write_text(new_content, encoding="utf-8")
            return True

    # Fallback: look for the placeholder more broadly
    # The pattern is usually a div with text "preparing photos of this home"
    # followed by the btn and closing divs before the amenities section
    placeholder_patterns = [
        # "preparing photos" text inside PHOTO GALLERY section
        (r'(<h4><i class="flaticon flaticon-right-arrow"></i>PHOTO GALLERY</h4>\s*'
         r'<h1>See inside[^<]+</h1>\s*</div>\s*)'
         r'<div class="row">\s*<div class="col-lg-\d+">\s*'
         r'<div class="text-center"[^>]*>.*?</div>\s*</div>\s*</div>\s*'
         r'(</div>\s*</div>\s*<div class="service_inner_page")',
         r'\1' + gallery_html + r'\2'),
        # "We are preparing photos" in a paragraph
        (r'(<h4><i class="flaticon flaticon-right-arrow"></i>PHOTO GALLERY</h4>\s*'
         r'<h1>See inside[^<]+</h1>\s*</div>\s*)'
         r'<div class="row">.*?</div>\s*'
         r'(</div>\s*</div>\s*<div class="service_inner_page")',
         r'\1' + gallery_html + r'\2'),
    ]

    for pattern, replacement in placeholder_patterns:
        new_content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
        if new_content != content:
            filepath.write_text(new_content, encoding="utf-8")
            return True

    # Even more aggressive: look for the full PHOTO GALLERY section
    photo_gallery_pattern = (
        r'(<h4><i class="flaticon flaticon-right-arrow"></i>PHOTO GALLERY</h4>\s*'
        r'<h1>See inside[^<]+</h1>\s*</div>\s*).*?'
        r'(</div>\s*</div>\s*<div class="service_inner_page[^"]*")'
    )
    new_content = re.sub(
        photo_gallery_pattern,
        r'\1' + gallery_html + r'\2',
        content, count=1, flags=re.DOTALL
    )
    if new_content != content:
        filepath.write_text(new_content, encoding="utf-8")
        return True

    return False


def add_hero_to_page(filepath, hero_path):
    """Add inline background-image to breatcome-section."""
    content = filepath.read_text(encoding="utf-8")

    # Replace breatcome-section that lacks inline style
    pattern = r'(<div class="breatcome-section style_two d-flex align-items-center">)'
    replacement = (f'<div class="breatcome-section style_two d-flex align-items-center"'
                   f' style="background-image: url(\'{hero_path}\');">')

    new_content = re.sub(pattern, replacement, content, count=1)
    if new_content != content:
        filepath.write_text(new_content, encoding="utf-8")
        return True
    return False


def main():
    selections = json.loads(SELECTIONS_FILE.read_text())

    for page_file, title in PAGES.items():
        filepath = REPO_DIR / page_file
        if not filepath.is_file():
            print(f"SKIP {page_file}: not found")
            continue

        house_id = page_file.replace(".html", "")
        sel = selections.get(house_id, {})

        print(f"\n=== {page_file} ({title}) ===")

        # Step 1: Add hero background
        hero_file = None
        if sel.get("hero"):
            hero_file = sel["hero"].get("published_file") or sel["hero"].get("file")
        if hero_file:
            hero_path = f"assets/images/cottages/{house_id}/{hero_file}"
            if add_hero_to_page(filepath, hero_path):
                print(f"  HERO: added {hero_path}")
            else:
                print(f"  HERO: already has inline style or not found")
        else:
            print(f"  HERO: none selected")

        # Step 2: Add gallery
        gallery = sel.get("gallery", [])
        if gallery:
            gallery_items = [(g.get("published_file") or g.get("file"), g.get("label", ""))
                             for g in gallery if g.get("published_file") or g.get("file")]
            gallery_html = build_gallery_html(house_id, gallery_items, title)
            if add_gallery_to_page(filepath, gallery_html, title):
                print(f"  GALLERY: {len(gallery_items)} photos wired")
            else:
                print(f"  GALLERY: FAILED to find placeholder. Check page structure.")
        else:
            print(f"  GALLERY: none selected (keeping placeholder)")

    # Expand existing galleries
    print(f"\n=== Expanding Existing Galleries ===")
    for page_file, (title, extra_photos) in EXPAND_GALLERIES.items():
        filepath = REPO_DIR / page_file
        if not filepath.is_file():
            print(f"SKIP {page_file}: not found")
            continue

        house_id = page_file.replace(".html", "")
        gallery_html = build_gallery_html(house_id, extra_photos, title)

        # Insert additional gallery row before the "AMENITIES" section
        content = filepath.read_text(encoding="utf-8")
        insert_marker = '<div class="service_inner_page"'
        if gallery_html and insert_marker in content:
            # Add as a new row after the last gallery row
            # Find the end of the existing gallery section
            gallery_end = "</div>\n    </div>"  # closes rooms-section
            gallery_close = content.rfind(gallery_end, 0, content.find(insert_marker))
            if gallery_close > 0:
                # Insert extra rows before that closing
                extra = '\n        <div class="row" style="margin-top: 30px;">\n'
                for gf, label in extra_photos:
                    gpath = f"assets/images/cottages/{house_id}/{gf}"
                    elabel = escape(label[:120])
                    extra += f"""          <div class="col-lg-6">
            <div class="rooms-single-single-bx">
              <div class="choose-single-thumbs">
                <a class="venobox" data-gall="house-gallery" href="{gpath}">
                  <img src="{gpath}" alt="{elabel}">
                </a>
              </div>
            </div>
          </div>
"""
                extra += '        </div>\n'
                new_content = content[:gallery_close] + extra + content[gallery_close:]
                filepath.write_text(new_content, encoding="utf-8")
                print(f"  {page_file}: added {len(extra_photos)} more gallery photos")
            else:
                print(f"  {page_file}: could not expand gallery")
        else:
            print(f"  {page_file}: skip")

    print("\nDone!")


if __name__ == "__main__":
    main()
