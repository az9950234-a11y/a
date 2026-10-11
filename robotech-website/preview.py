#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Make an offline copy of the site that opens by double-clicking index.html (no server needed).

    python3 build.py && python3 preview.py      # → ./preview/index.html

The production build in ./public uses clean root URLs (/products/…) for SEO;
this copy rewrites them to relative file links (…/index.html). Don't deploy ./preview.
"""
import base64
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "public"
DST = ROOT / "preview"


def rel_url(url, prefix):
    url = url.split("?v=")[0]
    path, _, frag = url.partition("#")
    if path == "" or path.endswith("/"):
        path += "index.html"
    return prefix + path.lstrip("/") + (("#" + frag) if frag else "")


def convert(html, depth):
    prefix = "../" * depth or "./"
    html = re.sub(r'\b(href|src)="(/[^"/][^"]*|/)"', lambda m: f'{m.group(1)}="{rel_url(m.group(2), prefix)}"', html)

    def fix_set(m):
        items = []
        for part in m.group(2).split(","):
            bits = part.strip().split(" ", 1)
            if bits[0].startswith("/"):
                bits[0] = rel_url(bits[0], prefix)
            items.append(" ".join(bits))
        return f'{m.group(1)}="{", ".join(items)}"'
    html = re.sub(r'\b(srcset|imagesrcset)="([^"]*)"', fix_set, html)
    # font preloads fail on file:// (fonts are embedded in the CSS instead)
    return re.sub(r'<link rel="preload" href="[^"]*" as="font"[^>]*>\n', "", html)


def main():
    if DST.exists():
        shutil.rmtree(DST)
    shutil.copytree(SRC, DST)
    for page in DST.rglob("*.html"):
        depth = len(page.relative_to(DST).parts) - 1
        page.write_text(convert(page.read_text(encoding="utf-8"), depth), encoding="utf-8")
    css = DST / "assets/css/style.css"
    # browsers block font files on file:// — embed them as data URIs
    def embed(m):
        data = base64.b64encode((SRC / "assets/fonts" / m.group(1)).read_bytes()).decode()
        return f"url(data:font/woff2;base64,{data})"
    css.write_text(re.sub(r"url\(/assets/fonts/([^)]+)\)", embed, css.read_text(encoding="utf-8")), encoding="utf-8")
    print(f"Offline preview ready → {DST / 'index.html'}")


if __name__ == "__main__":
    main()
