# -*- coding: utf-8 -*-
"""Make a relative-link copy of public/ for previewing (claude.ai artifact / opening files locally).
Usage: python3 preview.py OUT_DIR"""
import os, re, shutil, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "public")
OUT = sys.argv[1]
SKIP = {"_redirects", "_headers", "vercel.json", "robots.txt", "sitemap.xml", "404.html"}

if os.path.exists(OUT):
    shutil.rmtree(OUT)
shutil.copytree(SRC, OUT, ignore=lambda d, f: [x for x in f if x in SKIP])

LINK = re.compile(r'(href|src)="/(?!/)([^"#?]*)([#?][^"]*)?"')

for d, _, files in os.walk(OUT):
    for f in files:
        if not f.endswith(".html"):
            continue
        p = os.path.join(d, f)
        depth = os.path.relpath(p, OUT).count(os.sep)
        up = "../" * depth

        def fix(m):
            path, tail = m.group(2), m.group(3) or ""
            if path == "" or path.endswith("/"):
                path += "index.html"
            return f'{m.group(1)}="{up}{path}{tail}"'

        html = LINK.sub(fix, open(p, encoding="utf-8").read())
        if depth == 0 and f == "index.html":
            # the artifact host wraps the main page in its own skeleton
            html = re.sub(r"<!doctype html>\s*<html[^>]*>\s*<head>|</head>\s*<body>|</body>\s*</html>", "", html, flags=re.I)
            html = '<script>document.documentElement.lang="en";document.documentElement.dir="ltr"</script>\n' + html
            html = re.sub(r"<title>.*?</title>", "<title>Robotech CNC Website</title>", html, count=1)
        open(p, "w", encoding="utf-8").write(html)
print("preview ->", OUT)
