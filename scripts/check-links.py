#!/usr/bin/env python3
"""Checks every local href/src in the repository's HTML files and reports any
that do not resolve to a real file. Skips mailto:, tel:, http(s):, and
same-page anchors. Used for Feature 003 Phase 7 link validation."""
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
SKIP_PREFIXES = ("mailto:", "tel:", "http://", "https://", "javascript:", "#")

def find_html_files():
    return [p for p in ROOT.rglob("*.html") if ".git" not in p.parts and "node_modules" not in p.parts] + \
           [p for p in ROOT.rglob("*.htm") if ".git" not in p.parts and "node_modules" not in p.parts]

def extract_links(html):
    return re.findall(r'(?:href|src)="([^"]+)"', html)

def main():
    broken = []
    checked = 0
    for html_file in find_html_files():
        html = html_file.read_text(encoding="utf-8", errors="ignore")
        for link in extract_links(html):
            if link.startswith(SKIP_PREFIXES):
                continue
            path_part = urlsplit(link).path
            if not path_part:
                continue
            checked += 1
            resolved = (html_file.parent / path_part).resolve()
            if not resolved.exists():
                broken.append((str(html_file.relative_to(ROOT)), link))

    print(f"Checked {checked} local links across {len(find_html_files())} HTML files.")
    if broken:
        print(f"\n{len(broken)} broken link(s):")
        for source, link in broken:
            print(f"  {source} -> {link}")
        sys.exit(1)
    print("No broken internal links found.")

if __name__ == "__main__":
    main()
