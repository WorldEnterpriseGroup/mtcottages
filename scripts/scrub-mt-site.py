#!/usr/bin/env python3
"""Remove peaceful-cottage/mt-site theme markers from HTML files."""

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# The specific markers to remove (per task instructions)
CSS_FILE = "assets/css/mtcottages-site.css"
JS_FILE = "assets/js/mtcottages-site.js"

# Regex patterns for class removal
# These handle mt-site, mt-page-shell, mt-page-hero, mt-section from class attributes
_CLASS_REMOVALS = {
    # Remove standalone use (class="mt-site")
    r'\bmt-site\b': '',
    r'\bmt-page-shell\b': '',
    r'\bmt-page-hero\b': '',
    r'\bmt-section\b': '',
}

# Pattern for data attributes
_DATA_ATTR_PATTERN = re.compile(
    r'<div\s+data-site-header\s*></div>\s*'
)

_DATA_ATTR_FOOTER_PATTERN = re.compile(
    r'<div\s+data-site-footer\s*></div>\s*'
)

# Pattern for CSS link reference
_CSS_LINK_PATTERN = re.compile(
    r'<link[^>]*href\s*=\s*["\']' + re.escape(CSS_FILE) + r'["\'][^>]*>\s*'
)

# Pattern for JS script reference
_JS_SCRIPT_PATTERN = re.compile(
    r'<script[^>]*src\s*=\s*["\']' + re.escape(JS_FILE) + r'["\'][^>]*>\s*</script>\s*'
)


def clean_class_attr(match):
    """Clean the specified class names from a class attribute value."""
    value = match.group(1)
    for pattern, replacement in _CLASS_REMOVALS.items():
        value = re.sub(pattern, replacement, value)
    # Clean up excess whitespace
    value = re.sub(r'\s+', ' ', value).strip()
    if not value:
        return ''
    return f'class="{value}"'


def process_html(filepath):
    """Remove mt-site markers from an HTML file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Remove data-site-header divs
    content = _DATA_ATTR_PATTERN.sub('', content)

    # Remove data-site-footer divs
    content = _DATA_ATTR_FOOTER_PATTERN.sub('', content)

    # Remove CSS link reference
    content = _CSS_LINK_PATTERN.sub('', content)

    # Remove JS script reference
    content = _JS_SCRIPT_PATTERN.sub('', content)

    # Clean class attributes (removing specific class names)
    # Match class="..." and process the contents
    content = re.sub(
        r'class="([^"]*)"',
        clean_class_attr,
        content
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def main():
    html_files = []
    for f in os.listdir(ROOT):
        if f.endswith('.html'):
            html_files.append(os.path.join(ROOT, f))

    html_files.sort()

    modified = []
    for fp in html_files:
        if process_html(fp):
            modified.append(os.path.basename(fp))
            print(f"  Modified: {os.path.basename(fp)}")

    # Report
    print(f"\nTotal HTML files processed: {len(html_files)}")
    print(f"Files modified: {len(modified)}")
    if modified:
        print(f"Modified files: {', '.join(modified)}")

    # Report on CSS/JS file existence
    css_path = os.path.join(ROOT, CSS_FILE)
    js_path = os.path.join(ROOT, JS_FILE)

    if os.path.exists(css_path):
        print(f"\nWARNING: {CSS_FILE} still exists on disk (not deleted by script)")
    else:
        print(f"\nOK: {CSS_FILE} not found on disk")

    if os.path.exists(js_path):
        print(f"WARNING: {JS_FILE} still exists on disk (not deleted by script)")
    else:
        print(f"OK: {JS_FILE} not found on disk")


if __name__ == '__main__':
    main()
