#!/usr/bin/env python3
"""Remove peaceful-cottage/mt-site theme markers from HTML files."""

import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_DATA_HEADER_RE = re.compile(r'<div\s+data-site-header\s*></div>\s*')
_DATA_FOOTER_RE = re.compile(r'<div\s+data-site-footer\s*></div>\s*')
_CSS_LINK_RE = re.compile(r'<link[^>]*href\s*=\s*["\']assets/css/mtcottages-site.css["\'][^>]*>\s*')
_JS_SCRIPT_RE = re.compile(r'<script[^>]*src\s*=\s*["\']assets/js/mtcottages-site.js["\'][^>]*>\s*</script>\s*')

_CLASS_REMOVALS = [
    (r'(^|\s)mt-site(?=\s|$)', r'\1'),
    (r'(^|\s)mt-page-shell(?=\s|$)', r'\1'),
    (r'(^|\s)mt-page-hero(?=\s|$)', r'\1'),
    (r'(^|\s)mt-section(?=\s|$)', r'\1'),
]
_MARKER_RE = re.compile('|'.join(r'(?:^|\s)' + n + r'(?=\s|$)' for n in ['mt-site', 'mt-page-shell', 'mt-page-hero', 'mt-section']))

def clean_class(m):
    v = m.group(1)
    if not _MARKER_RE.search(v):
        return m.group(0)
    for p, r in _CLASS_REMOVALS:
        v = re.sub(p, r, v)
    v = re.sub(r'\s+', ' ', v).strip()
    return '' if not v else f'class="{v}"'

def process(fp):
    c = open(fp).read()
    o = c
    c = _DATA_HEADER_RE.sub('', c)
    c = _DATA_FOOTER_RE.sub('', c)
    c = _CSS_LINK_RE.sub('', c)
    c = _JS_SCRIPT_RE.sub('', c)
    c = re.sub(r'class="([^"]*)"', clean_class, c)
    c = re.sub(r'\s+class=""', '', c)
    if c == o: return False
    open(fp, 'w').write(c)
    return True

html = sorted(f for f in os.listdir(ROOT) if f.endswith('.html'))
mod = [f for f in html if process(os.path.join(ROOT, f))]
for f in mod: print(f'  {f}')
print(f'\nModified: {len(mod)}/{len(html)}')
