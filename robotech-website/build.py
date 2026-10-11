#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Robotech CNC — static site generator (Arabic + English). Python 3.8+, stdlib only.
Pillow is optional: if installed, social-share (Open Graph) images are regenerated.

    python3 build.py            # build into ./public
    python3 -m http.server -d public 8000   # preview at http://localhost:8000

Edit content in ./content (settings.py, ar.py, en.py), then rebuild.
"""
import datetime
import hashlib
import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "public"
sys.path.insert(0, str(ROOT / "content"))

import settings as S  # noqa: E402
import ar  # noqa: E402
import en  # noqa: E402

L = {"ar": ar, "en": en}
LANGS = ("ar", "en")
LOCALE = {"ar": "ar-SA", "en": "en-SA"}
OG_LOCALE = {"ar": "ar_SA", "en": "en_US"}
SITE = S.SITE
BASE = SITE["url"].rstrip("/")
TODAY = datetime.date.today().isoformat()
YEAR = datetime.date.today().year
PRODUCTS = {p["slug"]: p for p in S.PRODUCTS}
GUIDE_PUBLISHED = "2026-10-11"

# Self-hosted fonts (see @font-face at the top of style.css) — preload the critical ones
FONT_PRELOAD = {
    "ar": ["ibm-plex-sans-arabic-400-arabic", "ibm-plex-sans-arabic-700-arabic"],
    "en": ["barlow-400-latin", "barlow-condensed-700-latin"],
}


# ───────────────────────── helpers ─────────────────────────
def esc(s):
    return html.escape(str(s), quote=True)


def strip_tags(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s)).strip()


# Numbers joined by ×, –, / (e.g. 1500×3000, 1.5 – 12, ±0.03) are reversed by the
# bidi algorithm inside Arabic text — isolate them as LTR runs.
_NUM = r"[±~+]?\d[\d.,]*(?:°|%)?"
_BIDI_RE = re.compile(rf"{_NUM}(?:\s*[×–/-]\s*{_NUM})+|[±~]\d[\d.,]*")


def bidi_fix(body):
    parts = re.split(r"(<[^>]+>)", body)
    skip = False
    for i, part in enumerate(parts):
        if part.startswith("<"):
            tag = part[1:].split()[0].rstrip(">").lower() if len(part) > 1 else ""
            if tag in ("option", "textarea", "svg", "bdi"):
                skip = True
            elif tag in ("/option", "/textarea", "/svg", "/bdi"):
                skip = False
            continue
        if not skip and part:
            parts[i] = _BIDI_RE.sub(lambda m: f'<bdi dir="ltr">{m.group(0)}</bdi>', part)
    return "".join(parts)


def href(lang, path):
    return path if lang == "ar" else "/en" + path


def absu(lang, path):
    return BASE + href(lang, path)


def fmt(s):
    return s.format(years=SITE["years"], sold=f'{SITE["machines_sold"]:,}', sat=SITE["satisfaction"])


def wa(text):
    return f"https://wa.me/{SITE['whatsapp']}?text={quote(text)}"


def tel():
    return "tel:" + SITE["phone"]


def versioned(rel):
    digest = hashlib.md5((OUT / rel.lstrip("/")).read_bytes()).hexdigest()[:8]
    return f"{rel}?v={digest}"


def icon(name, cls="i"):
    return f'<svg class="{cls}" aria-hidden="true" focusable="false"><use href="#i-{name}"/></svg>'


def product_img(slug, alt, mode="card", eager=False):
    p = PRODUCTS[slug]
    if not p["image"]:
        return f'<div class="noimg" role="img" aria-label="{esc(alt)}">{icon(p["icon"], "noimg__i")}</div>'
    base = f"/assets/img/products/{slug}"
    if mode == "card":
        sizes = "(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 300px"
    else:
        sizes = "(max-width: 900px) 92vw, 560px"
    load = 'loading="eager" fetchpriority="high"' if eager else 'loading="lazy"'
    return (f'<img src="{base}-480.webp" srcset="{base}-480.webp 480w, {base}.webp 960w" sizes="{sizes}" '
            f'width="960" height="720" alt="{esc(alt)}" {load} decoding="async">')


def section_head(eyebrow, h2, lead=None, center=False, h_id=None):
    idattr = f' id="{h_id}"' if h_id else ""
    return (f'<header class="sh{" sh--c" if center else ""}">'
            + (f'<p class="eyebrow">{esc(eyebrow)}</p>' if eyebrow else "")
            + f'<h2{idattr}>{h2}</h2>'
            + (f'<p class="sh__lead">{lead}</p>' if lead else "")
            + "</header>")


# ───────────────────────── icons (inline sprite) ─────────────────────────
ICONS = {
    "wa": '<path fill="currentColor" stroke="none" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35zM12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88zm8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41z"/>',
    "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    "mail": '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
    "pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "chev": '<path d="m6 9 6 6 6-6"/>',
    "globe": '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    "menu": '<path d="M3 6h18M3 12h18M3 18h18"/>',
    # applications / machines
    "laser": '<path d="M9 2h6v5H9zM10.5 7h3L12 10.5zM12 10.5V16"/><path d="M3 20l2.5-3h15.5L18.5 20z"/><path d="M8.5 14.5 6.5 13.5M15.5 14.5l2-1M12 16.5v1"/>',
    "tube": '<ellipse cx="18" cy="14" rx="2.5" ry="4"/><path d="M18 10H6a2.5 4 0 0 0 0 8h12"/><path d="M12 2v6M10 2h4"/>',
    "engrave": '<path d="M9 2h6v3H9zM12 5v7"/><rect x="3" y="13" width="18" height="8" rx="1"/><path d="M6.5 17.5c1.5-2 3 2 4.5 0s3 2 4.5 0 2 1 2 1"/>',
    "mark": '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v1M14 20h1M18 18h3v3h-3z"/>',
    "weld": '<path d="m3 21 7-7M8 12l4 4M10 10l4.5-4.5 4 4L14 14"/><path d="M18 2.5l.6 1.8M21.5 6l-1.8.6M21 2.8l-1.4 1.4"/>',
    "clean": '<path d="M3 3h6v5H3zM9 5.5h2.5"/><path d="m11.5 5.5 9 9M11.5 5.5l5 11M11.5 5.5l9.5 4.5"/><path d="M3 21h18"/>',
    "router": '<path d="M10 2h4v6h-4zM12 8v4M11 12h2l-1 2z"/><path d="M2 16h20v3H2zM4 19v2M20 19v2"/>',
    "edge": '<rect x="3" y="6" width="14" height="12" rx="1"/><path d="M17 6h2.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H17"/><path d="M7 10h6M7 14h4"/>',
    "saw": '<circle cx="12" cy="10" r="6.5"/><circle cx="12" cy="10" r="1.5"/><path d="M12 3.5v2M18.5 10h-2M12 16.5v-2M5.5 10h2M2 20h20"/>',
    "press": '<path d="M3 5h18v4H3zM5 9v11M19 9v11M7 14h10M7 17h10"/>',
    "door": '<path d="M6 3h12v18H6zM3 21h18"/><circle cx="15" cy="12" r="1"/>',
    # services
    "expert": '<circle cx="12" cy="7" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
    "support": '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M21 14v1.5a2 2 0 0 1-2 2h-1.5v-6H19a2 2 0 0 1 2 2zM3 14v1.5a2 2 0 0 0 2 2h1.5v-6H5a2 2 0 0 0-2 2z"/><path d="M18 17.5v.5a3 3 0 0 1-3 3h-3"/>',
    "parts": '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    "training": '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2.5 9 2.5 12 0v-5M22 10v6"/>',
    "truck": '<path d="M1 4h14v12H1zM15 8h4l3 3.5V16h-7z"/><circle cx="5.5" cy="18" r="2"/><circle cx="18.5" cy="18" r="2"/>',
    "tools": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
}


def sprite():
    syms = "".join(
        f'<symbol id="i-{k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
        f'stroke-linecap="round" stroke-linejoin="round">{v}</symbol>' for k, v in ICONS.items())
    return f'<svg width="0" height="0" style="position:absolute" aria-hidden="true">{syms}</svg>'


# ───────────────────────── structured data ─────────────────────────
ORG_ID = BASE + "/#organization"
SITE_ID = BASE + "/#website"


def org_node():
    a = SITE["address"]
    node = {
        "@type": "Organization",
        "@id": ORG_ID,
        "name": SITE["brand"]["en"],
        "alternateName": [SITE["brand"]["ar"], "Robotech", "روبوتك"],
        "legalName": SITE["legal_name"],
        "url": BASE + "/",
        "logo": {"@type": "ImageObject", "url": BASE + "/assets/img/logo.png", "width": 640, "height": 102},
        "image": BASE + "/assets/img/og/default.jpg",
        "description": strip_tags(en.UI["footer_about"]),
        "telephone": SITE["phone"],
        "address": {"@type": "PostalAddress", "streetAddress": a["street"], "addressLocality": a["city"],
                    "addressRegion": a["region"], "addressCountry": a["country"]},
        "areaServed": [{"@type": "Country", "name": "Saudi Arabia"}]
        + [{"@type": "City", "name": c["geo"]} for c in S.CITIES],
        "contactPoint": [{"@type": "ContactPoint", "telephone": SITE["phone"], "contactType": "sales",
                          "areaServed": "SA", "availableLanguage": ["Arabic", "English"]}],
    }
    if SITE.get("email"):
        node["email"] = SITE["email"]
        node["contactPoint"][0]["email"] = SITE["email"]
    same = [v for v in SITE["social"].values() if v]
    if same:
        node["sameAs"] = same
    return node


def website_node():
    return {"@type": "WebSite", "@id": SITE_ID, "url": BASE + "/", "name": SITE["brand"]["en"],
            "alternateName": SITE["brand"]["ar"], "inLanguage": [LOCALE["ar"], LOCALE["en"]],
            "publisher": {"@id": ORG_ID}}


def breadcrumb_node(lang, url, crumbs):
    items = [{"@type": "ListItem", "position": i + 1, "name": strip_tags(name), "item": absu(lang, p)}
             for i, (name, p) in enumerate(crumbs)]
    return {"@type": "BreadcrumbList", "@id": url + "#breadcrumb", "itemListElement": items}


def faq_node(url, faqs):
    return {"@type": "FAQPage", "@id": url + "#faq", "mainEntity": [
        {"@type": "Question", "name": strip_tags(q), "acceptedAnswer": {"@type": "Answer", "text": strip_tags(a)}}
        for q, a in faqs]}


# ───────────────────────── layout ─────────────────────────
def header(lang, active):
    u = L[lang].UI
    items = [("home", "/", u["nav_home"]), ("products", "/products/", u["nav_products"]),
             ("locations", None, u["nav_locations"]), ("about", "/about/", u["nav_about"]),
             ("guide", "/cnc-buying-guide/", u["nav_guide"]), ("contact", "/contact/", u["nav_contact"])]
    lis = []
    for key, p, label in items:
        if key == "locations":
            sub = "".join(f'<li><a href="{href(lang, "/" + c["slug"] + "/")}">{esc(L[lang].CITIES[c["slug"]]["name"])}</a></li>'
                          for c in S.CITIES)
            act = " is-active" if active == "locations" else ""
            lis.append(f'<li class="has-sub{act}"><button class="nav__btn" type="button" aria-expanded="false">'
                       f'{esc(label)}{icon("chev", "i i--sm")}</button><ul class="sub">{sub}</ul></li>')
        else:
            cur = ' aria-current="page"' if key == active else ""
            lis.append(f'<li><a href="{href(lang, p)}"{cur}>{esc(label)}</a></li>')
    return f"""<header class="hdr" id="top">
<div class="wrap hdr__in">
<a class="brand" href="{href(lang, '/')}" aria-label="{esc(SITE['brand'][lang])}"><img src="/assets/img/logo.webp" width="168" height="27" alt="{esc(SITE['brand'][lang])}"></a>
<nav class="nav" id="nav" aria-label="{esc(u['menu'])}"><ul class="nav__list">{''.join(lis)}</ul></nav>
<div class="hdr__act">
<a class="lang" href="{{ALT_URL}}" hreflang="{'en' if lang == 'ar' else 'ar'}" lang="{'en' if lang == 'ar' else 'ar'}" title="{esc(u['lang_name'])}">{icon('globe', 'i i--sm')}<span>{esc(u['lang_short'])}</span></a>
<a class="btn btn--sm hdr__cta" href="{wa(u['wa_generic'])}" target="_blank" rel="noopener">{esc(u['cta_quote'])}</a>
<button class="burger" type="button" aria-controls="nav" aria-expanded="false" aria-label="{esc(u['menu'])}"><span></span><span></span><span></span></button>
</div>
</div>
</header>"""


def footer(lang):
    m = L[lang]
    u = m.UI
    links = [(u["nav_home"], "/"), (u["nav_products"], "/products/"), (u["nav_about"], "/about/"),
             (u["nav_guide"], "/cnc-buying-guide/"), (u["nav_contact"], "/contact/")]
    prods = "".join(f'<li><a href="{href(lang, "/products/" + s + "/")}">{esc(m.PRODUCTS[s]["name"])}</a></li>'
                    for s in PRODUCTS)
    city_label = {"ar": "ماكينات CNC في {}", "en": "CNC machines in {}"}[lang]
    cities = "".join(f'<li><a href="{href(lang, "/" + c["slug"] + "/")}">{esc(city_label.format(m.CITIES[c["slug"]]["name"]))}</a></li>'
                     for c in S.CITIES)
    social = "".join(f'<li><a href="{esc(v)}" target="_blank" rel="noopener me">{esc(k.capitalize() if k != "x" else "X")}</a></li>'
                     for k, v in SITE["social"].items() if v)
    email = (f'<li><a href="mailto:{esc(SITE["email"])}">{icon("mail", "i i--sm")}<span>{esc(SITE["email"])}</span></a></li>'
             if SITE.get("email") else "")
    return f"""<footer class="ftr">
<div class="wrap ftr__grid">
<div class="ftr__about">
<img src="/assets/img/logo.webp" width="168" height="27" alt="{esc(SITE['brand'][lang])}" loading="lazy">
<p>{esc(u['footer_about'])}</p>
<ul class="ftr__contact">
<li><a href="{tel()}" dir="ltr">{icon('phone', 'i i--sm')}<span>{esc(SITE['phone_display'])}</span></a></li>
<li><a href="{wa(u['wa_generic'])}" target="_blank" rel="noopener">{icon('wa', 'i i--sm')}<span>{esc(u['wa_label'])}</span></a></li>
{email}
<li>{icon('pin', 'i i--sm')}<span><strong>{esc(u['hq'])}:</strong> {esc(SITE['address']['display'][lang])}</span></li>
</ul>
{f'<ul class="ftr__social">{social}</ul>' if social else ''}
</div>
<nav class="ftr__col" aria-label="{esc(u['footer_links'])}"><h2>{esc(u['footer_links'])}</h2><ul>{''.join(f'<li><a href="{href(lang, p)}">{esc(t)}</a></li>' for t, p in links)}</ul></nav>
<nav class="ftr__col" aria-label="{esc(u['footer_products'])}"><h2>{esc(u['footer_products'])}</h2><ul>{prods}</ul></nav>
<nav class="ftr__col" aria-label="{esc(u['footer_cities'])}"><h2>{esc(u['footer_cities'])}</h2><ul>{cities}</ul><p class="ftr__note">{esc(u['service_area'])}</p></nav>
</div>
<div class="ftr__bar"><div class="wrap ftr__bar-in">
<p>© {YEAR} {esc(SITE['brand'][lang])} — {esc(SITE['legal_name'])}. {esc(u['rights'])}</p>
<a href="#top" class="ftr__top" aria-label="Top">↑</a>
</div></div>
</footer>
<div class="mbar" role="group" aria-label="{esc(u['footer_contact'])}">
<a class="mbar__call" href="{tel()}">{icon('phone', 'i')}<span>{esc(u['call_label'])}</span></a>
<a class="mbar__wa" href="{wa(u['wa_generic'])}" target="_blank" rel="noopener">{icon('wa', 'i')}<span>{esc(u['wa_label'])}</span></a>
</div>
<a class="fab" href="{wa(u['wa_generic'])}" target="_blank" rel="noopener" aria-label="{esc(u['cta_whatsapp'])}">{icon('wa', 'i')}</a>"""


def layout(lang, page):
    """page: dict(path, title, desc, body, active, graph(list), og_image, og_type, preload)"""
    m = L[lang]
    other = "en" if lang == "ar" else "ar"
    url = absu(lang, page["path"])
    alt_url = href(other, page["path"])
    og_img = BASE + page.get("og_image", "/assets/img/og/default.jpg")
    graph = [org_node(), website_node()] + page.get("graph", [])
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":"))
    verif = ""
    if SITE.get("google_site_verification"):
        verif += f'<meta name="google-site-verification" content="{esc(SITE["google_site_verification"])}">\n'
    if SITE.get("bing_site_verification"):
        verif += f'<meta name="msvalidate.01" content="{esc(SITE["bing_site_verification"])}">\n'
    ga = ""
    if SITE.get("ga4_id"):
        gid = esc(SITE["ga4_id"])
        ga = (f'<script async src="https://www.googletagmanager.com/gtag/js?id={gid}"></script>'
              f"<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments)}}"
              f"gtag('js',new Date());gtag('config','{gid}');</script>\n")
    preload = ""
    if page.get("preload"):
        p = page["preload"]
        preload = (f'<link rel="preload" as="image" href="{p}-480.webp" imagesrcset="{p}-480.webp 480w, {p}.webp 960w" '
                   f'imagesizes="(max-width: 900px) 92vw, 560px" fetchpriority="high">\n')
    fonts = "".join(f'<link rel="preload" href="/assets/fonts/{f}.woff2" as="font" type="font/woff2" crossorigin>\n'
                    for f in FONT_PRELOAD[lang])
    head = f"""<!doctype html>
<html lang="{lang}" dir="{'rtl' if lang == 'ar' else 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(page['title'])}</title>
<meta name="description" content="{esc(page['desc'])}">
<meta name="robots" content="{page.get('robots', 'index, follow, max-image-preview:large, max-snippet:-1')}">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="{LOCALE['ar']}" href="{absu('ar', page['path'])}">
<link rel="alternate" hreflang="{LOCALE['en']}" href="{absu('en', page['path'])}">
<link rel="alternate" hreflang="x-default" href="{absu('ar', page['path'])}">
<meta name="theme-color" content="#0d0e10">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="{page.get('og_type', 'website')}">
<meta property="og:site_name" content="{esc(SITE['brand'][lang])}">
<meta property="og:locale" content="{OG_LOCALE[lang]}">
<meta property="og:locale:alternate" content="{OG_LOCALE[other]}">
<meta property="og:title" content="{esc(page['title'])}">
<meta property="og:description" content="{esc(page['desc'])}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{og_img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(page['title'])}">
<meta name="twitter:description" content="{esc(page['desc'])}">
<meta name="twitter:image" content="{og_img}">
{verif}<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
{fonts}{preload}<link rel="stylesheet" href="{versioned('/assets/css/style.css')}">
<script type="application/ld+json">{ld}</script>
{ga}</head>"""
    body = f"""<body class="lang-{lang}">
{sprite()}
<a class="skip" href="#main">{esc(m.UI['skip'])}</a>
{header(lang, page.get('active')).replace('{ALT_URL}', alt_url)}
<main id="main">
{bidi_fix(page['body']) if lang == 'ar' else page['body']}
</main>
{footer(lang)}
<script src="{versioned('/assets/js/main.js')}" defer></script>
</body>
</html>
"""
    return head + "\n" + body


# ───────────────────────── shared blocks ─────────────────────────
def breadcrumbs(lang, crumbs):
    u = L[lang].UI
    parts = []
    for i, (name, p) in enumerate(crumbs):
        if i == len(crumbs) - 1:
            parts.append(f'<li aria-current="page">{esc(strip_tags(name))}</li>')
        else:
            parts.append(f'<li><a href="{href(lang, p)}">{esc(strip_tags(name))}</a></li>')
    return f'<nav class="crumbs" aria-label="{esc(u["breadcrumb"])}"><ol>{"".join(parts)}</ol></nav>'


def product_card(lang, slug, h="h3"):
    m = L[lang]
    t = m.PRODUCTS[slug]
    p = PRODUCTS[slug]
    url = href(lang, f"/products/{slug}/")
    model = f'<span class="card__model">{esc(p["model"])}</span>' if p.get("model") else ""
    return f"""<article class="card">
<div class="card__media">{product_img(slug, t['name'])}{model}</div>
<div class="card__body">
<p class="card__tag">{esc(m.CATEGORIES[p['cat']]['name'])}</p>
<{h} class="card__title"><a href="{url}">{esc(t['name'])}</a></{h}>
<p class="card__text">{esc(t['short'])}</p>
<span class="card__more">{esc(m.UI['details'])}{icon('arrow', 'i i--sm i--dir')}</span>
</div>
</article>"""


def cta_card(lang, h="h3"):
    m = L[lang]
    c = m.UI
    return f"""<article class="card card--cta">
<div><p class="card__tag">{esc(c['cta_card_tag'])}</p>
<{h}>{esc(c['cta_card_h'])}</{h}>
<p>{esc(c['cta_card_p'])}</p></div>
<a class="btn" href="{wa(c['wa_generic'])}" target="_blank" rel="noopener">{icon('wa', 'i')}<span>{esc(c['cta_card_btn'])}</span></a>
</article>"""


def products_grid(lang, slugs, h="h3", cta=False):
    cards = "".join(product_card(lang, s, h) for s in slugs)
    if cta:
        cards += cta_card(lang, h)
    return '<div class="grid-cards">' + cards + "</div>"


def faq_block(lang, faqs, eyebrow=None, title=None):
    m = L[lang]
    items = "".join(
        f'<details class="faq__item"{" open" if i == 0 else ""}><summary><h3>{esc(strip_tags(q))}</h3><span class="faq__ic" aria-hidden="true"></span></summary>'
        f'<div class="faq__a"><p>{a}</p></div></details>' for i, (q, a) in enumerate(faqs))
    return (f'<section class="section" aria-labelledby="faq-h"><div class="wrap faq">'
            f'{section_head(eyebrow or m.HOME["faq_eyebrow"], esc(title or m.UI["faq_title"]), h_id="faq-h")}'
            f'<div class="faq__list">{items}</div></div></section>')


def quote_form(lang, preselect=None, h="h3"):
    m = L[lang]
    f = m.FORM
    opts = f'<option value="">{esc(f["machine_any"])}</option>' + "".join(
        f'<option{" selected" if s == preselect else ""}>{esc(m.PRODUCTS[s]["name"])}</option>' for s in PRODUCTS)
    cities = "".join(f"<option>{esc(c)}</option>" for c in f["cities"])
    lab = f["labels"]
    return f"""<form class="qform" action="https://wa.me/{SITE['whatsapp']}" method="get" target="_blank" data-wa="{SITE['whatsapp']}" data-intro="{esc(f['intro'])}">
<{h} class="qform__title">{esc(f['title'])}</{h}>
<p class="qform__sub">{esc(f['sub'])}</p>
<div class="qform__row">
<label><span>{esc(f['name'])}</span><input name="name" autocomplete="name" required data-label="{esc(lab['name'])}"></label>
<label><span>{esc(f['phone'])}</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" required data-label="{esc(lab['phone'])}"></label>
</div>
<div class="qform__row">
<label><span>{esc(f['city'])}</span><select name="city" data-label="{esc(lab['city'])}">{cities}</select></label>
<label><span>{esc(f['machine'])}</span><select name="machine" data-label="{esc(lab['machine'])}">{opts}</select></label>
</div>
<label><span>{esc(f['message'])}</span><textarea name="text" rows="4" placeholder="{esc(f['message_ph'])}" data-label="{esc(lab['message'])}"></textarea></label>
<button class="btn btn--block" type="submit">{icon('wa', 'i')}<span>{esc(f['submit'])}</span></button>
</form>"""


def cta_section(lang, text=None, preselect=None):
    m = L[lang]
    u = m.UI
    return f"""<section class="section section--dark cta" aria-labelledby="cta-h">
<div class="wrap cta__grid">
<div class="cta__copy">
<p class="eyebrow">{esc(u['cta_quote'])}</p>
<h2 id="cta-h">{esc(m.HOME['cta_h2'])}</h2>
<p class="cta__p">{esc(text or m.HOME['cta_p'])}</p>
<ul class="cta__ways">
<li><a href="{wa(u['wa_generic'])}" target="_blank" rel="noopener">{icon('wa', 'i')}<span><strong>{esc(u['wa_label'])}</strong><small dir="ltr">{esc(SITE['phone_display'])}</small></span></a></li>
<li><a href="{tel()}">{icon('phone', 'i')}<span><strong>{esc(u['cta_call'])}</strong><small dir="ltr">{esc(SITE['phone_display'])}</small></span></a></li>
</ul>
</div>
{quote_form(lang, preselect)}
</div>
</section>"""


def services_block(lang, title):
    m = L[lang]
    items = "".join(f'<li class="svc">{icon(ic, "svc__i")}<h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for ic, t, d in m.SERVICES)
    return (f'<section class="section section--sand" aria-labelledby="svc-h"><div class="wrap">'
            f'{section_head(None, esc(title), h_id="svc-h")}<ul class="svc-grid">{items}</ul></div></section>')


def partners_block(lang):
    m = L[lang]
    items = "".join(f'<li><strong>{esc(n)}</strong><span>{esc(d[lang])}</span></li>' for n, d in S.PARTNERS)
    return (f'<section class="partners" aria-labelledby="partners-h"><div class="wrap">'
            f'<h2 id="partners-h" class="partners__h">{esc(m.HOME["partners_h2"])}</h2><ul class="partners__list">{items}</ul></div></section>')


def stats_block(lang):
    m = L[lang]
    items = []
    for num, label in m.HOME["stats"]:
        val = fmt(num)
        digits = re.sub(r"[^\d]", "", val)
        count = f' data-count="{digits}"' if digits and "/" not in val else ""
        items.append(f'<li><strong{count} data-fmt="{esc(val)}">{esc(val)}</strong><span>{esc(label)}</span></li>')
    return f'<section class="stats" aria-label="{esc(m.HOME["stats"][0][1])}"><div class="wrap"><ul class="stats__list">{"".join(items)}</ul></div></section>'


def page_hero(lang, h1, lead, crumbs=None, extra=""):
    bc = breadcrumbs(lang, crumbs) if crumbs else ""
    return (f'<section class="phero"><div class="wrap">{bc}<h1>{h1}</h1>'
            + (f'<p class="phero__lead">{lead}</p>' if lead else "") + f'{extra}</div></section>')


# ───────────────────────── pages ─────────────────────────
def page_home(lang):
    m = L[lang]
    u, h = m.UI, m.HOME
    hero_slug = "fiber-laser-cutting-machine"
    chips = "".join(f"<li>{icon('check', 'i i--sm')}{esc(fmt(c))}</li>" for c in h["chips"])
    spec = {"ar": [("القدرة", "1.5–12 kW"), ("الدقة", "±0.03 mm"), ("مساحة العمل", "3015")],
            "en": [("Power", "1.5–12 kW"), ("Accuracy", "±0.03 mm"), ("Bed", "3015")]}[lang]
    specbar = "".join(f'<div><dt>{esc(k)}</dt><dd dir="ltr">{esc(v)}</dd></div>' for k, v in spec)
    apps = "".join(
        f'<li><a class="app" href="{href(lang, "/products/" + slug + "/")}">{icon(ic, "app__i")}'
        f'<strong>{esc(m.APPS[ic][0])}</strong><span>{esc(m.APPS[ic][1])}</span></a></li>' for ic, slug in S.APPLICATIONS)
    groups = ""
    for cat in ("metal", "wood"):
        slugs = [s for s, p in PRODUCTS.items() if p["cat"] == cat]
        groups += (f'<div class="pgroup"><div class="pgroup__head"><h3>{esc(m.CATEGORIES[cat]["name"])}</h3>'
                   f'<p>{esc(m.CATEGORIES[cat]["lead"])}</p></div>{products_grid(lang, slugs, "h4", cta=len(slugs) % 3 != 0)}</div>')
    points = "".join(f'<li>{icon(ic, "pt__i")}<div><h3>{esc(t)}</h3><p>{esc(d)}</p></div></li>' for ic, t, d in h["about_points"])
    badge_pts = "".join(f"<li>{esc(x)}</li>" for x in h["badge_points"])
    vmw = "".join(f'<article class="vmw__card{" vmw__card--hl" if i == 1 else ""}"><h3>{esc(t)}</h3><p>{d}</p></article>'
                  for i, (t, d) in enumerate(h["vmw"]))
    steps = "".join(f'<li><span class="step__n" aria-hidden="true">{i + 1:02d}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></li>'
                    for i, (t, d) in enumerate(h["process"]))
    city_cards = "".join(
        f'<li><a class="city" href="{href(lang, "/" + c["slug"] + "/")}"><span class="city__geo" dir="ltr">{esc(c["coords"])}</span>'
        f'<strong>{esc(m.CITY_CARDS[c["slug"]][0])}</strong><span>{esc(m.CITY_CARDS[c["slug"]][1])}</span>'
        f'{icon("arrow", "i city__arrow i--dir")}</a></li>' for c in S.CITIES)

    body = f"""<section class="hero">
<div class="wrap hero__grid">
<div class="hero__copy">
<p class="eyebrow eyebrow--light">{esc(h['eyebrow'])}</p>
<h1>{h['h1']}</h1>
<p class="hero__lead">{h['lead']}</p>
<div class="btns">
<a class="btn btn--lg" href="{wa(u['wa_generic'])}" target="_blank" rel="noopener">{icon('wa', 'i')}<span>{esc(u['cta_quote'])}</span></a>
<a class="btn btn--ghost btn--lg" href="{href(lang, '/products/')}">{esc(u['cta_browse'])}{icon('arrow', 'i i--sm i--dir')}</a>
</div>
<ul class="chips">{chips}</ul>
</div>
<figure class="showcase">
<span class="showcase__tag">{esc(h['hero_tag'])}</span>
<a class="showcase__media" href="{href(lang, '/products/' + hero_slug + '/')}">{product_img(hero_slug, m.PRODUCTS[hero_slug]['name'], 'hero', eager=True)}<span class="scan" aria-hidden="true"></span></a>
<figcaption><a href="{href(lang, '/products/' + hero_slug + '/')}">{esc(h['hero_card'])}{icon('arrow', 'i i--sm i--dir')}</a><dl class="specbar">{specbar}</dl></figcaption>
</figure>
</div>
</section>

<section class="apps" aria-labelledby="apps-h">
<div class="wrap">
<h2 id="apps-h" class="visually-hidden">{esc(h['apps_h2'])}</h2>
<ul class="apps__grid">{apps}</ul>
</div>
</section>

<section class="section" id="products" aria-labelledby="prod-h">
<div class="wrap">
{section_head(h['products_eyebrow'], esc(h['products_h2']), esc(h['products_lead']), h_id="prod-h")}
{groups}
</div>
</section>

<section class="section section--sand" aria-labelledby="about-h">
<div class="wrap about">
<div class="about__copy">
{section_head(h['about_eyebrow'], esc(h['about_h2']), h_id="about-h")}
{''.join(f'<p>{p}</p>' for p in h['about_p'])}
<ul class="points">{points}</ul>
</div>
<div class="about__media">
<img src="/assets/img/laser-cutting-workshop.webp" width="610" height="397" alt="{esc(h['workshop_alt'])}" loading="lazy" decoding="async">
<div class="badge"><strong>{SITE['years']}+</strong><span>{esc(h['badge_label'])}</span><ul>{badge_pts}</ul></div>
</div>
</div>
</section>

<section class="section section--dark" aria-label="{esc(h['vmw'][0][0])}">
<div class="wrap"><div class="vmw">{vmw}</div></div>
</section>
{stats_block(lang)}
<section class="section" aria-labelledby="proc-h">
<div class="wrap">
{section_head(h['process_eyebrow'], esc(h['process_h2']), h_id="proc-h", center=True)}
<ol class="steps">{steps}</ol>
</div>
</section>

<section class="section section--dark" aria-labelledby="cities-h">
<div class="wrap">
{section_head(h['cities_eyebrow'], esc(h['cities_h2']), esc(h['cities_lead']), h_id="cities-h")}
<ul class="cities">{city_cards}</ul>
</div>
</section>
{partners_block(lang)}
{faq_block(lang, m.FAQ, h['faq_eyebrow'], h['faq_h2'])}
{cta_section(lang)}"""
    url = absu(lang, "/")
    graph = [{"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": h["title"], "description": h["desc"],
              "inLanguage": LOCALE[lang], "isPartOf": {"@id": SITE_ID}, "about": {"@id": ORG_ID},
              "primaryImageOfPage": BASE + f"/assets/img/products/{hero_slug}.webp"},
             faq_node(url, m.FAQ),
             {"@type": "ItemList", "@id": url + "#products", "name": h["products_h2"],
              "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": absu(lang, f"/products/{s}/"),
                                   "name": m.PRODUCTS[s]["name"]} for i, s in enumerate(PRODUCTS)]}]
    return {"path": "/", "title": h["title"], "desc": h["desc"], "body": body, "active": "home", "graph": graph,
            "preload": f"/assets/img/products/{hero_slug}"}


def page_products(lang):
    m = L[lang]
    pp = m.PRODUCTS_PAGE
    crumbs = [(m.UI["home"], "/"), (pp["h1"], "/products/")]
    groups = ""
    for cat in ("metal", "wood"):
        slugs = [s for s, p in PRODUCTS.items() if p["cat"] == cat]
        groups += (f'<section class="pgroup" aria-labelledby="cat-{cat}"><div class="pgroup__head">'
                   f'<h2 id="cat-{cat}">{esc(m.CATEGORIES[cat]["name"])}</h2><p>{esc(m.CATEGORIES[cat]["lead"])}</p></div>'
                   f'{products_grid(lang, slugs, cta=len(slugs) % 3 != 0)}</section>')
    body = (page_hero(lang, esc(pp["h1"]), esc(pp["lead"]), crumbs)
            + f'<div class="section"><div class="wrap">{groups}</div></div>'
            + services_block(lang, m.UI["included_title"]) + cta_section(lang))
    url = absu(lang, "/products/")
    graph = [{"@type": "CollectionPage", "@id": url + "#webpage", "url": url, "name": pp["title"], "description": pp["desc"],
              "inLanguage": LOCALE[lang], "isPartOf": {"@id": SITE_ID}, "breadcrumb": {"@id": url + "#breadcrumb"}},
             breadcrumb_node(lang, url, crumbs),
             {"@type": "ItemList", "@id": url + "#list", "itemListElement": [
                 {"@type": "ListItem", "position": i + 1, "url": absu(lang, f"/products/{s}/"), "name": m.PRODUCTS[s]["name"]}
                 for i, s in enumerate(PRODUCTS)]}]
    return {"path": "/products/", "title": pp["title"], "desc": pp["desc"], "body": body, "active": "products", "graph": graph}


def page_product(lang, slug):
    m = L[lang]
    u = m.UI
    t = m.PRODUCTS[slug]
    p = PRODUCTS[slug]
    path = f"/products/{slug}/"
    crumbs = [(u["home"], "/"), (u["nav_products"], "/products/"), (t["name"], path)]
    hl = "".join(f"<li>{icon('check', 'i i--sm')}{esc(x)}</li>" for x in t["highlights"])
    apps = "".join(f"<li>{esc(a)}</li>" for a in t["apps"])
    feats = "".join(f'<li class="feat"><span class="feat__n" aria-hidden="true">{i + 1:02d}</span><h3>{esc(a)}</h3><p>{esc(b)}</p></li>'
                    for i, (a, b) in enumerate(t["features"]))
    rows = "".join(f'<tr><th scope="row">{esc(k)}</th><td>{esc(v)}</td></tr>' for k, v in t["specs"])
    model = (f'<span class="pinfo__model">{esc(u["model"])}: <b dir="ltr">{esc(p["model"])}</b></span>' if p.get("model") else "")
    body = f"""<section class="phero phero--product">
<div class="wrap">
{breadcrumbs(lang, crumbs)}
<div class="pd">
<div class="pd__media">{product_img(slug, t['name'], 'hero', eager=True)}{'' if p['image'] else f'<p class="pd__soon">{esc(u["no_image"])}</p>'}</div>
<div class="pd__info">
<p class="eyebrow eyebrow--light"><a href="{href(lang, '/products/')}">{esc(m.CATEGORIES[p['cat']]['name'])}</a></p>
<h1>{esc(t['name'])}</h1>
<p class="pd__lead">{esc(t['short'])}</p>
<ul class="pd__hl">{hl}</ul>
<div class="btns">
<a class="btn btn--lg" href="{wa(u['wa_msg'] + t['name'])}" target="_blank" rel="noopener">{icon('wa', 'i')}<span>{esc(u['quote_for'])}</span></a>
<a class="btn btn--ghost btn--lg" href="{tel()}">{icon('phone', 'i i--sm')}<span>{esc(u['cta_call'])}</span></a>
</div>
{model}
</div>
</div>
</div>
</section>

<section class="section" aria-labelledby="ov-h">
<div class="wrap ov">
<div class="ov__text">
{section_head(None, esc(u['overview']), h_id="ov-h")}
{''.join(f'<p>{x}</p>' for x in t['intro'])}
</div>
<aside class="ov__apps" aria-labelledby="apps-h"><h2 id="apps-h">{esc(u['apps_title'])}</h2><ul class="tick">{apps}</ul></aside>
</div>
</section>

<section class="section section--sand" aria-labelledby="feat-h">
<div class="wrap">
{section_head(None, esc(u['features_title']), h_id="feat-h")}
<ul class="feats">{feats}</ul>
</div>
</section>

<section class="section" aria-labelledby="spec-h">
<div class="wrap specs">
{section_head(None, esc(u['specs_title']), h_id="spec-h")}
<div class="table-wrap"><table class="spec-table"><caption class="visually-hidden">{esc(t['name'])} — {esc(u['specs_title'])}</caption><tbody>{rows}</tbody></table></div>
<p class="note">{esc(u['specs_note'])}</p>
</div>
</section>
{services_block(lang, u['included_title'])}
{faq_block(lang, t['faqs'], u['faq_title'], f"{u['faq_title']}: {t['name']}")}
<section class="section section--sand" aria-labelledby="rel-h">
<div class="wrap">
{section_head(None, esc(u['related']), h_id="rel-h")}
{products_grid(lang, p['related'])}
</div>
</section>
{cta_section(lang, preselect=slug)}"""
    url = absu(lang, path)
    prod = {"@type": "Product", "@id": url + "#product", "name": t["name"], "description": strip_tags(" ".join(t["intro"])),
            "brand": {"@type": "Brand", "name": "Robotech"}, "manufacturer": {"@id": ORG_ID},
            "category": m.CATEGORIES[p["cat"]]["name"], "url": url,
            "additionalProperty": [{"@type": "PropertyValue", "name": k, "value": v} for k, v in t["specs"]]}
    if p["image"]:
        prod["image"] = [BASE + f"/assets/img/products/{slug}.webp", BASE + f"/assets/img/og/{slug}.jpg"]
    if p.get("model"):
        prod["model"] = p["model"]
    if p.get("price_sar"):
        prod["offers"] = {"@type": "Offer", "price": str(p["price_sar"]), "priceCurrency": "SAR",
                          "availability": "https://schema.org/InStock", "url": url, "seller": {"@id": ORG_ID},
                          "areaServed": "SA"}
    graph = [{"@type": "ItemPage", "@id": url + "#webpage", "url": url, "name": t["title"], "description": t["desc"],
              "inLanguage": LOCALE[lang], "isPartOf": {"@id": SITE_ID}, "breadcrumb": {"@id": url + "#breadcrumb"},
              "mainEntity": {"@id": url + "#product"}},
             prod, breadcrumb_node(lang, url, crumbs), faq_node(url, t["faqs"])]
    page = {"path": path, "title": t["title"], "desc": t["desc"], "body": body, "active": "products", "graph": graph,
            "og_image": f"/assets/img/og/{slug}.jpg" if p["image"] else "/assets/img/og/default.jpg", "og_type": "product"}
    if p["image"]:
        page["preload"] = f"/assets/img/products/{slug}"
    return page


def page_city(lang, city):
    m = L[lang]
    u = m.UI
    slug = city["slug"]
    c = m.CITIES[slug]
    path = f"/{slug}/"
    crumbs = [(u["home"], "/"), (c["h1"], path)]
    inds = "".join(f"<li>{esc(x)}</li>" for x in c["industries"])
    others = "".join(
        f'<li><a class="city" href="{href(lang, "/" + o["slug"] + "/")}"><span class="city__geo" dir="ltr">{esc(o["coords"])}</span>'
        f'<strong>{esc(m.CITY_CARDS[o["slug"]][0])}</strong><span>{esc(m.CITY_CARDS[o["slug"]][1])}</span>'
        f'{icon("arrow", "i city__arrow i--dir")}</a></li>' for o in S.CITIES if o["slug"] != slug)
    extra = (f'<div class="btns"><a class="btn btn--lg" href="{wa(u["wa_generic"])}" target="_blank" rel="noopener">{icon("wa", "i")}'
             f'<span>{esc(u["cta_quote"])}</span></a><a class="btn btn--ghost btn--lg" href="{tel()}">{icon("phone", "i i--sm")}'
             f'<span>{esc(u["cta_call"])}</span></a></div>')
    body = (page_hero(lang, esc(c["h1"]), "", crumbs, extra=extra).replace('<h1>', f'<p class="eyebrow eyebrow--light" dir="ltr">{esc(city["coords"])}</p><h1>', 1)
            + f"""<section class="section" aria-labelledby="intro-h">
<div class="wrap ov">
<div class="ov__text">
<h2 id="intro-h" class="visually-hidden">{esc(c['h1'])}</h2>
{''.join(f'<p>{x}</p>' for x in c['intro'])}
</div>
<aside class="ov__apps" aria-labelledby="ind-h"><h2 id="ind-h">{esc(u['city_industries_title'].format(city=c['name']))}</h2><ul class="tick">{inds}</ul></aside>
</div>
</section>
<section class="section section--sand" aria-labelledby="cp-h">
<div class="wrap">
{section_head(None, esc(u['city_products_title'].format(city=c['name'])), h_id="cp-h")}
{products_grid(lang, city['featured'])}
</div>
</section>
{services_block(lang, u['city_services_title'].format(city=c['name']))}
{faq_block(lang, c['faqs'])}
<section class="section section--dark" aria-labelledby="oc-h">
<div class="wrap">
{section_head(None, esc(u['other_cities']), h_id="oc-h")}
<ul class="cities cities--2">{others}</ul>
</div>
</section>
{cta_section(lang)}""")
    url = absu(lang, path)
    graph = [{"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": c["title"], "description": c["desc"],
              "inLanguage": LOCALE[lang], "isPartOf": {"@id": SITE_ID}, "breadcrumb": {"@id": url + "#breadcrumb"}},
             {"@type": "Service", "@id": url + "#service", "name": c["h1"],
              "serviceType": "CNC & laser machine supply, installation, training and maintenance",
              "provider": {"@id": ORG_ID}, "areaServed": {"@type": "City", "name": city["geo"],
                                                          "containedInPlace": {"@type": "Country", "name": "Saudi Arabia"}},
              "hasOfferCatalog": {"@type": "OfferCatalog", "name": u["city_products_title"].format(city=c["name"]),
                                  "itemListElement": [{"@type": "Offer", "itemOffered": {"@type": "Product", "name": m.PRODUCTS[s]["name"],
                                                                                         "url": absu(lang, f"/products/{s}/")}}
                                                      for s in city["featured"]]}},
             breadcrumb_node(lang, url, crumbs), faq_node(url, c["faqs"])]
    return {"path": path, "title": c["title"], "desc": c["desc"], "body": body, "active": "locations", "graph": graph}


def page_about(lang):
    m = L[lang]
    a = m.ABOUT
    u = m.UI
    crumbs = [(u["home"], "/"), (u["nav_about"], "/about/")]
    vmw = "".join(f'<article class="vmw__card{" vmw__card--hl" if i == 1 else ""}"><h3>{esc(t)}</h3><p>{d}</p></article>'
                  for i, (t, d) in enumerate(m.HOME["vmw"]))
    values = "".join(f'<li class="feat"><span class="feat__n" aria-hidden="true">{i + 1:02d}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></li>'
                     for i, (t, d) in enumerate(a["values"]))
    body = (page_hero(lang, esc(a["h1"]), esc(a["lead"]), crumbs)
            + f"""<section class="section" aria-labelledby="story-h">
<div class="wrap about">
<div class="about__copy">
{section_head(None, esc(a['story_h2']), h_id="story-h")}
{''.join(f'<p>{p}</p>' for p in a['story'])}
</div>
<div class="about__media">
<img src="/assets/img/laser-cutting-workshop.webp" width="610" height="397" alt="{esc(m.HOME['workshop_alt'])}" loading="lazy" decoding="async">
<div class="badge"><strong>{SITE['years']}+</strong><span>{esc(m.HOME['badge_label'])}</span><ul>{''.join(f'<li>{esc(x)}</li>' for x in m.HOME['badge_points'])}</ul></div>
</div>
</div>
</section>
{stats_block(lang)}
<section class="section section--dark" aria-label="{esc(m.HOME['vmw'][0][0])}"><div class="wrap"><div class="vmw">{vmw}</div></div></section>
<section class="section" aria-labelledby="val-h"><div class="wrap">
{section_head(None, esc(a['values_h2']), h_id="val-h")}
<ul class="feats">{values}</ul>
</div></section>
<section class="section section--sand" aria-labelledby="v30-h"><div class="wrap v2030">
<h2 id="v30-h">{esc(a['v2030_h2'])}</h2><p>{esc(a['v2030'])}</p>
</div></section>
{partners_block(lang)}
{cta_section(lang)}""")
    url = absu(lang, "/about/")
    graph = [{"@type": "AboutPage", "@id": url + "#webpage", "url": url, "name": a["title"], "description": a["desc"],
              "inLanguage": LOCALE[lang], "isPartOf": {"@id": SITE_ID}, "about": {"@id": ORG_ID},
              "breadcrumb": {"@id": url + "#breadcrumb"}}, breadcrumb_node(lang, url, crumbs)]
    return {"path": "/about/", "title": a["title"], "desc": a["desc"], "body": body, "active": "about", "graph": graph}


def page_contact(lang):
    m = L[lang]
    c = m.CONTACT
    u = m.UI
    crumbs = [(u["home"], "/"), (u["nav_contact"], "/contact/")]
    cards = [
        ("wa", c["wa_title"], c["wa_text"], wa(u["wa_generic"]), SITE["phone_display"], True),
        ("phone", c["call_title"], c["call_text"], tel(), SITE["phone_display"], False),
    ]
    if SITE.get("email"):
        cards.append(("mail", c["email_title"], c["email_text"], "mailto:" + SITE["email"], SITE["email"], False))
    EXT = ' target="_blank" rel="noopener"'
    cards_html = "".join(
        f'<li><a class="ccard" href="{link}"{EXT if ext else ""}>{icon(ic, "ccard__i")}'
        f'<strong>{esc(t)}</strong><span>{esc(d)}</span><b dir="ltr">{esc(v)}</b></a></li>'
        for ic, t, d, link, v, ext in cards)
    cards_html += (f'<li><div class="ccard">{icon("pin", "ccard__i")}<strong>{esc(c["addr_title"])}</strong>'
                   f'<span>{esc(SITE["address"]["display"][lang])}</span><b>{esc(u["service_area"])}</b></div></li>')
    body = (page_hero(lang, esc(c["h1"]), esc(c["lead"]), crumbs)
            + f"""<section class="section" aria-label="{esc(c['h1'])}">
<div class="wrap contact">
<ul class="ccards">{cards_html}</ul>
<div class="contact__form">{quote_form(lang, h="h2")}</div>
</div>
</section>
{faq_block(lang, m.FAQ[2:5])}""")
    url = absu(lang, "/contact/")
    graph = [{"@type": "ContactPage", "@id": url + "#webpage", "url": url, "name": c["title"], "description": c["desc"],
              "inLanguage": LOCALE[lang], "isPartOf": {"@id": SITE_ID}, "about": {"@id": ORG_ID},
              "breadcrumb": {"@id": url + "#breadcrumb"}}, breadcrumb_node(lang, url, crumbs)]
    return {"path": "/contact/", "title": c["title"], "desc": c["desc"], "body": body, "active": "contact", "graph": graph}


def page_guide(lang):
    m = L[lang]
    g = m.GUIDE
    u = m.UI
    path = f"/{g['slug']}/"
    crumbs = [(u["home"], "/"), (u["nav_guide"], path)]
    toc = "".join(f'<li><a href="#{sid}">{esc(t)}</a></li>' for sid, t, _ in g["sections"])
    secs = "".join(f'<section id="{sid}" aria-labelledby="{sid}-h"><h2 id="{sid}-h">{esc(t)}</h2>{content}</section>'
                   for sid, t, content in g["sections"])
    date_label = datetime.date.fromisoformat(TODAY)
    body = (page_hero(lang, esc(g["h1"]), esc(g["lead"]), crumbs,
                      extra=f'<p class="phero__meta">{esc(u["updated"])}: <time datetime="{TODAY}" dir="ltr">{date_label.isoformat()}</time> · {esc(SITE["brand"][lang])}</p>')
            + f"""<div class="section"><div class="wrap guide">
<aside class="guide__toc"><details open><summary>{esc(u['toc'])}</summary><ol>{toc}</ol></details></aside>
<article class="prose">{secs}
<div class="prose__cta"><p>{esc(g['cta'])}</p><a class="btn" href="{wa(u['wa_generic'])}" target="_blank" rel="noopener">{icon('wa', 'i')}<span>{esc(u['cta_quote'])}</span></a></div>
</article>
</div></div>
<section class="section section--sand" aria-labelledby="gp-h"><div class="wrap">
{section_head(None, esc(u['all_products']), h_id="gp-h")}
{products_grid(lang, ['fiber-laser-cutting-machine', 'co2-laser-cutting-engraving-1325', 'cnc-router-wood-1325'])}
</div></section>
{cta_section(lang, text=g['cta'])}""")
    url = absu(lang, path)
    graph = [{"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": g["title"], "description": g["desc"],
              "inLanguage": LOCALE[lang], "isPartOf": {"@id": SITE_ID}, "breadcrumb": {"@id": url + "#breadcrumb"},
              "mainEntity": {"@id": url + "#article"}},
             {"@type": "Article", "@id": url + "#article", "headline": g["h1"], "description": g["desc"],
              "inLanguage": LOCALE[lang], "datePublished": GUIDE_PUBLISHED, "dateModified": TODAY,
              "author": {"@id": ORG_ID}, "publisher": {"@id": ORG_ID}, "mainEntityOfPage": url,
              "image": BASE + "/assets/img/og/default.jpg",
              "articleSection": [t for _, t, _ in g["sections"]]},
             breadcrumb_node(lang, url, crumbs)]
    return {"path": path, "title": g["title"], "desc": g["desc"], "body": body, "active": "guide", "graph": graph,
            "og_type": "article"}


def page_404():
    a, e = ar.NOT_FOUND, en.NOT_FOUND
    body = f"""<section class="phero phero--404"><div class="wrap">
<p class="nf__code" aria-hidden="true">404</p>
<h1>{esc(a['h1'])}</h1><p class="phero__lead">{esc(a['p'])}</p>
<p class="phero__lead" lang="en" dir="ltr">{esc(e['h1'])} — {esc(e['p'])}</p>
<div class="btns"><a class="btn btn--lg" href="/">{esc(ar.UI['nav_home'])}</a><a class="btn btn--ghost btn--lg" href="/products/">{esc(ar.UI['cta_browse'])}</a><a class="btn btn--ghost btn--lg" href="/en/" lang="en">English</a></div>
</div></section>"""
    page = {"path": "/404.html", "title": a["title"], "desc": a["p"], "body": body, "robots": "noindex, follow"}
    html_doc = layout("ar", page).replace('href="/en/404.html"', 'href="/en/"')
    # 404 must not declare canonical/hreflang
    html_doc = re.sub(r'<link rel="(canonical|alternate)"[^>]*>\n', "", html_doc)
    return html_doc


# ───────────────────────── extra files ─────────────────────────
def build_og():
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("  · Pillow not installed — keeping existing OG images")
        return
    W, H = 1200, 630
    og_dir = OUT / "assets/img/og"
    og_dir.mkdir(parents=True, exist_ok=True)
    logo = Image.open(OUT / "assets/img/logo.png").convert("RGBA")
    lg = logo.resize((430, round(logo.height * 430 / logo.width)), Image.LANCZOS)

    def render(slug):
        im = Image.new("RGB", (W, H), (13, 14, 16))
        d = ImageDraw.Draw(im)
        for x in range(0, W, 40):
            d.line([(x, 0), (x, H)], fill=(22, 24, 27))
        for y in range(0, H, 40):
            d.line([(0, y), (W, y)], fill=(22, 24, 27))
        prod = Image.open(OUT / f"assets/img/products/{slug}.webp").convert("RGB").resize((600, 450), Image.LANCZOS)
        cx, cy = W - 600 - 56, (H - 450) // 2
        card = Image.new("RGB", (600, 450), (255, 255, 255))
        card.paste(prod, (0, 0))
        mask = Image.new("L", (600, 450), 255)
        md = ImageDraw.Draw(mask)
        md.polygon([(0, 0), (28, 0), (0, 28)], fill=0)
        md.polygon([(600, 450), (572, 450), (600, 422)], fill=0)
        im.paste(card, (cx, cy), mask)
        im.paste(lg, (56, H // 2 - lg.height // 2 - 20), lg)
        d.rectangle([56, H // 2 + lg.height // 2 + 10, 56 + 120, H // 2 + lg.height // 2 + 14], fill=(237, 86, 43))
        d.rectangle([0, H - 8, W, H], fill=(237, 86, 43))
        return im

    render("fiber-laser-cutting-machine").save(og_dir / "default.jpg", quality=86, optimize=True, progressive=True)
    for slug, p in PRODUCTS.items():
        if p["image"]:
            render(slug).save(og_dir / f"{slug}.jpg", quality=84, optimize=True, progressive=True)


def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main():
    pages = []  # (neutral path, {lang: page})
    builders = [page_home, page_products, page_about, page_contact, page_guide]
    print("Building Robotech CNC site →", OUT)
    build_og()
    for b in builders:
        pages.append({lang: b(lang) for lang in LANGS})
    for slug in PRODUCTS:
        pages.append({lang: page_product(lang, slug) for lang in LANGS})
    for city in S.CITIES:
        pages.append({lang: page_city(lang, city) for lang in LANGS})

    count = 0
    for group in pages:
        for lang, page in group.items():
            rel = href(lang, page["path"]).lstrip("/")
            write(OUT / rel / "index.html", layout(lang, page))
            count += 1
    write(OUT / "404.html", page_404())

    # sitemap.xml (with hreflang alternates + images)
    urls = []
    for group in pages:
        path = group["ar"]["path"]
        alts = "".join(f'<xhtml:link rel="alternate" hreflang="{LOCALE[lg]}" href="{absu(lg, path)}"/>' for lg in LANGS)
        alts += f'<xhtml:link rel="alternate" hreflang="x-default" href="{absu("ar", path)}"/>'
        img = ""
        if path.startswith("/products/") and path != "/products/":
            slug = path.split("/")[2]
            if PRODUCTS[slug]["image"]:
                img = f'<image:image><image:loc>{BASE}/assets/img/products/{slug}.webp</image:loc></image:image>'
        elif path == "/":
            img = f'<image:image><image:loc>{BASE}/assets/img/products/fiber-laser-cutting-machine.webp</image:loc></image:image>'
        prio = "1.0" if path == "/" else ("0.9" if path.startswith("/products/") else "0.8")
        for lg in LANGS:
            urls.append(f"<url><loc>{absu(lg, path)}</loc><lastmod>{TODAY}</lastmod>{alts}{img}<priority>{prio}</priority></url>")
    write(OUT / "sitemap.xml",
          '<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" '
          'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + "\n".join(urls) + "\n</urlset>\n")

    write(OUT / "robots.txt", f"User-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: {BASE}/sitemap.xml\n")

    write(OUT / "site.webmanifest", json.dumps({
        "name": SITE["brand"]["en"], "short_name": "Robotech", "lang": "ar", "dir": "rtl", "start_url": "/",
        "display": "browser", "background_color": "#0d0e10", "theme_color": "#0d0e10",
        "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
                  {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"}]}, ensure_ascii=False, indent=2))

    # llms.txt — concise map of the site for AI search engines / assistants
    lines = [f"# {SITE['brand']['en']} ({SITE['brand']['ar']})", "",
             f"> {strip_tags(en.UI['footer_about'])} Serving Riyadh, Jeddah, Dammam and all of Saudi Arabia. "
             f"{SITE['years']}+ years of experience, {SITE['machines_sold']:,}+ machines sold. "
             f"Phone/WhatsApp: {SITE['phone_display']}.", "", "## Machines (English)"]
    lines += [f"- [{en.PRODUCTS[s]['name']}]({absu('en', f'/products/{s}/')}): {en.PRODUCTS[s]['short']}" for s in PRODUCTS]
    lines += ["", "## Service areas"]
    lines += [f"- [{en.CITIES[c['slug']]['h1']}]({absu('en', '/' + c['slug'] + '/')})" for c in S.CITIES]
    lines += ["", "## Guides & company",
              f"- [{en.GUIDE['h1']}]({absu('en', '/cnc-buying-guide/')})",
              f"- [About]({absu('en', '/about/')})", f"- [Contact]({absu('en', '/contact/')})", "",
              "## Arabic (primary language)", f"- [الرئيسية]({absu('ar', '/')})", f"- [المنتجات]({absu('ar', '/products/')})",
              f"- [{ar.GUIDE['h1']}]({absu('ar', '/cnc-buying-guide/')})", ""]
    write(OUT / "llms.txt", "\n".join(lines))

    # Cache headers (Netlify / Cloudflare Pages)
    write(OUT / "_headers",
          "/assets/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n"
          "/assets/*\n  Cache-Control: public, max-age=2592000\n"
          "/*.html\n  Cache-Control: public, max-age=0, must-revalidate\n"
          "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n"
          "  X-Frame-Options: SAMEORIGIN\n")
    print(f"  ✓ {count} pages + 404, sitemap.xml, robots.txt, llms.txt, manifest")
    if "robotechcnc.com" in BASE:
        print("  ! Reminder: set your real domain in content/settings.py (SITE['url']) before publishing.")


if __name__ == "__main__":
    main()
