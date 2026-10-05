# -*- coding: utf-8 -*-
"""Static site generator for robotechcnc.com  ->  python3 build.py  (output: public/)"""
import json, os, shutil, datetime
from html import escape as e
from content import (SITE, STATS, CERTS, CATEGORIES, PRODUCTS, FEATURED, CITIES,
                     WHY, INDUSTRIES, FAQ)

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "public")
D = SITE["domain"]
TODAY = datetime.date.today().isoformat()
CAT = {c["slug"]: c for c in CATEGORIES}
PROD = {p["slug"]: p for p in PRODUCTS}
PAGES = []  # (path_en, path_ar) for sitemap

# ------------------------------------------------------------------ helpers
def url(lang, slug=""):
    base = "/ar/" if lang == "ar" else "/"
    return base + (slug.strip("/") + "/" if slug else "")

def T(lang, en, ar):
    return ar if lang == "ar" else en

def L(obj, lang, key):
    return obj[key + ("_ar" if lang == "ar" else "_en")] if key + "_en" in obj else obj[lang]

ICONS = {
    "laser": '<path d="M12 2v7"/><path d="M8 13l4-4 4 4"/><path d="M3 21h18"/><path d="M6 17h12"/><path d="M12 13v4"/>',
    "co2": '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h6M7 14h10"/>',
    "router": '<path d="M4 20h16"/><path d="M6 20V8h12v12"/><path d="M12 8V3"/><path d="M10 13h4v3h-4z"/>',
    "window": '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M4 12h16"/>',
    "bend": '<path d="M3 18h7l4-8h7"/><path d="M14 4v6"/><path d="M11 4h6"/>',
    "mark": '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>',
    "clean": '<path d="M4 20l7-7"/><path d="M13 3l8 8-6 2-4-4z"/><path d="M3 14l2 2"/>',
    "weld": '<path d="M5 19l6-6"/><path d="M14 4l6 6-3 3-6-6z"/><path d="M4 14l1 1M7 21l1-1M2 18h2"/>',
    "robot": '<rect x="9" y="2" width="6" height="5" rx="1"/><path d="M12 7v4l5 4"/><path d="M17 15l2 5"/><path d="M5 21h14"/><path d="M12 11l-4 6v4"/>',
    "plasma": '<path d="M12 2l3 7-3 3-3-3z"/><path d="M12 12v4"/><path d="M4 20h16"/><path d="M8 16h8"/>',
    "glass": '<path d="M4 4h16v16H4z"/><path d="M4 14l6-6M10 20l10-10"/>',
    "parts": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
}
def icon(name):
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS.get(name, ICONS["laser"]) + "</svg>")

WA_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8.2 8.2 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.2-.3-.3-.6-.4zM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zm0-21.6A11.8 11.8 0 0 0 1.9 18L.2 24l6.2-1.6A11.8 11.8 0 1 0 12 .2z"/></svg>'
PHONE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>'

def wa_link(lang, text=None):
    t = text or T(lang, "Hello Robotech, I'd like a quote.", "السلام عليكم روبوتك، أبغى عرض سعر.")
    from urllib.parse import quote
    return f"https://wa.me/{SITE['whatsapp']}?text={quote(t)}"

def img_or_placeholder(p, lang, eager=False):
    alt = e(p[lang])
    if p["img"]:
        load = 'fetchpriority="high"' if eager else 'loading="lazy"'
        return (f'<img src="/img/products/{p["img"]}" alt="{alt}" width="1200" height="900" '
                f'{load} decoding="async">')
    c = CAT[p["cat"]]
    return (f'<div class="placeholder" role="img" aria-label="{alt}"><div class="in">{icon(c["icon"])}'
            f'<b>{e(p["model"])}</b><small>ROBOTECH</small></div></div>')

# ------------------------------------------------------------------ layout
def header(lang, path_other, current=""):
    cats = "".join(
        f'<a href="{url(lang, c["slug"])}"><span class="ico">{icon(c["icon"])}</span>'
        f'<span><b>{e(c[lang])}</b><small>{e(c["short_" + lang])}</small></span></a>' for c in CATEGORIES)
    def cur(k): return ' aria-current="page"' if current == k else ""
    return f'''<a class="skip" href="#main">{T(lang, "Skip to content", "تخطَّ إلى المحتوى")}</a>
<header class="top"><div class="wrap">
  <a class="logo" href="{url(lang)}" aria-label="Robotech CNC"><img src="/img/brand/robotech-logo.png" alt="Robotech CNC" width="188" height="30"></a>
  <button class="burger" aria-label="{T(lang, "Menu", "القائمة")}" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
  <nav class="nav" aria-label="{T(lang, "Main", "الرئيسية")}">
    <a href="{url(lang)}"{cur("home")}>{T(lang, "Home", "الرئيسية")}</a>
    <div class="dd"><button aria-haspopup="true">{T(lang, "Machines", "المكائن")} ▾</button><div class="dd-panel">{cats}</div></div>
    <a href="{url(lang, "aluminum-upvc-window-door-machines")}"{cur("win")}>{T(lang, "Window & Door Lines", "خطوط الألمنيوم")}</a>
    <a href="{url(lang, "about-us")}"{cur("about")}>{T(lang, "About", "من نحن")}</a>
    <a href="{url(lang, "contact-us")}"{cur("contact")}>{T(lang, "Contact", "تواصل معنا")}</a>
    <a class="lang" href="{path_other}" hreflang="{T(lang, "ar", "en")}" lang="{T(lang, "ar", "en")}">{T(lang, "العربية", "English")}</a>
    <a class="btn btn-primary" href="{url(lang, "contact-us")}#quote">{T(lang, "Get a quote", "اطلب عرض سعر")}</a>
  </nav>
</div></header>'''

def footer(lang):
    cats = "".join(f'<a href="{url(lang, c["slug"])}">{e(c[lang])}</a>' for c in CATEGORIES[:8])
    cities = "".join(f'<a href="{url(lang, "cnc-machines-in-" + s)}">{T(lang, "CNC machines in " + en, "مكائن CNC في " + ar)}</a>'
                     for s, en, ar, *_ in CITIES[:8])
    return f'''<footer><div class="wrap">
  <div class="cols">
    <div><span class="logo-f"><img src="/img/brand/robotech-logo.png" alt="Robotech CNC" width="150" height="24" loading="lazy"></span>
      <p>{T(lang, "Fiber laser, CO2, CNC router, bending and aluminum/uPVC window machinery — supplied, installed and supported across Saudi Arabia since 2006.",
                 "مكائن ليزر فايبر و CO2 وراوتر CNC والثني وخطوط الألمنيوم و uPVC — توريد وتركيب ودعم في كل المملكة منذ 2006.")}</p>
      <a href="tel:{SITE["phone"]}" dir="ltr">{SITE["phone_display"]}</a>
      <a href="mailto:{SITE["email"]}">{SITE["email"]}</a>
      <p>{e(SITE["address_" + lang])}</p>
    </div>
    <div><h4>{T(lang, "Machines", "المكائن")}</h4>{cats}</div>
    <div><h4>{T(lang, "Service areas", "مناطق الخدمة")}</h4>{cities}</div>
    <div><h4>{T(lang, "Company", "الشركة")}</h4>
      <a href="{url(lang, "about-us")}">{T(lang, "About Robotech", "عن روبوتك")}</a>
      <a href="{url(lang, "contact-us")}">{T(lang, "Contact & quote", "تواصل واطلب عرض سعر")}</a>
      <a href="{url(lang, "spare-parts-2")}">{T(lang, "Spare parts", "قطع الغيار")}</a>
      <a href="{url(lang, "cnc-machine-shop-saudi")}">{T(lang, "CNC machine shop in Saudi Arabia", "متجر مكائن CNC في السعودية")}</a>
      <a href="{SITE["catalog"]}" download>{T(lang, "Download catalog (PDF)", "تحميل الكتالوج (PDF)")}</a>
      <a href="{SITE["youtube"]}" rel="noopener" target="_blank">YouTube</a>
      <a href="{SITE["play"]}" rel="noopener" target="_blank">{T(lang, "Android app", "تطبيق أندرويد")}</a>
    </div>
  </div>
  <div class="legal"><span>© {datetime.date.today().year} Robotech CNC. {T(lang, "All rights reserved.", "جميع الحقوق محفوظة.")}</span>
  <span>{T(lang, "CE · ISO 9001 · FDA certified machinery", "مكائن معتمدة CE · ISO 9001 · FDA")}</span></div>
</div></footer>
<a class="wa" href="{wa_link(lang)}" target="_blank" rel="noopener" aria-label="WhatsApp">{WA_SVG}</a>'''

def org_ld():
    return {
        "@context": "https://schema.org", "@type": ["Organization", "LocalBusiness"], "@id": D + "/#org",
        "name": "Robotech CNC", "alternateName": ["روبوتك", "Robo Tech", "Robotech Premium Machinery Trading"],
        "url": D + "/", "logo": D + "/img/brand/robotech-logo.png", "image": D + "/img/products/cgs-6500.webp",
        "telephone": SITE["phone"], "email": SITE["email"], "foundingDate": SITE["founded"],
        "address": {"@type": "PostalAddress", "streetAddress": SITE["street"], "addressLocality": SITE["locality"],
                    "addressCountry": "SA"},
        "areaServed": [{"@type": "Country", "name": "Saudi Arabia"}] + [{"@type": "City", "name": c[1]} for c in CITIES],
        "sameAs": [SITE["youtube"], SITE["play"]],
        "contactPoint": {"@type": "ContactPoint", "telephone": SITE["phone"], "contactType": "sales",
                         "availableLanguage": ["Arabic", "English"], "areaServed": "SA"},
    }

def crumbs_ld(items):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": D + u}
                                for i, (n, u) in enumerate(items)]}

def crumbs_html(items):
    return '<nav class="crumbs" aria-label="breadcrumb">' + "".join(
        f'<span><a href="{u}">{e(n)}</a></span>' if i < len(items) - 1 else f'<span aria-current="page">{e(n)}</span>'
        for i, (n, u) in enumerate(items)) + "</nav>"

def page(lang, slug, title, desc, body, ld=None, og_img="/img/products/cgs-6500.webp", current="", keywords=""):
    en_path, ar_path = url("en", slug), url("ar", slug)
    me, other = (ar_path, en_path) if lang == "ar" else (en_path, ar_path)
    lds = [org_ld()] + (ld or [])
    ld_html = "".join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in lds)
    html = f'''<!doctype html>
<html lang="{lang}" dir="{T(lang, "ltr", "rtl")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
{f'<meta name="keywords" content="{e(keywords)}">' if keywords else ""}
<link rel="canonical" href="{D}{me}">
<link rel="alternate" hreflang="en" href="{D}{en_path}">
<link rel="alternate" hreflang="ar" href="{D}{ar_path}">
<link rel="alternate" hreflang="x-default" href="{D}{en_path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Robotech CNC">
<meta property="og:locale" content="{T(lang, "en_US", "ar_SA")}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{D}{me}">
<meta property="og:image" content="{D}{og_img}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0D1015">
<link rel="icon" href="/img/brand/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={T(lang, "Inter:wght@400;600;700;800", "IBM+Plex+Sans+Arabic:wght@400;600;700&family=Inter:wght@700;800")}&display=swap">
<link rel="stylesheet" href="/css/site.css">
{ld_html}
</head>
<body>
{header(lang, other, current)}
<main id="main">
{body}
</main>
{footer(lang)}
<script src="/js/site.js" defer></script>
</body>
</html>'''
    out = os.path.join(OUT, me.strip("/"), "index.html")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w", encoding="utf-8").write(html)
    if lang == "en":
        PAGES.append((en_path, ar_path))

# ------------------------------------------------------------------ blocks
def product_card(p, lang):
    return f'''<a class="card" href="{url(lang, "product/" + p["slug"])}">
  <div class="ph">{img_or_placeholder(p, lang)}</div>
  <div class="body"><span class="model" dir="ltr">{e(p["model"])}</span><h3>{e(p[lang])}</h3>
  <p>{e(p["sum_" + lang][:150].rsplit(" ", 1)[0])}…</p><span class="go">{T(lang, "View machine →", "تفاصيل المكينة ←")}</span></div></a>'''

def cta_band(lang, title=None):
    return f'''<section class="sec"><div class="wrap"><div class="band">
  <div><h2>{e(title or T(lang, "Not sure which machine fits your production?", "محتار أي مكينة تناسب إنتاجك؟"))}</h2>
  <p>{T(lang, "Tell us your material, thickness and monthly output. An engineer replies with the right configuration and a quote — usually the same day.",
             "قل لنا نوع الخامة والسماكة والإنتاج الشهري. يرد عليك مهندس بالمواصفات المناسبة وعرض السعر — غالباً بنفس اليوم.")}</p></div>
  <div class="ctas"><a class="btn btn-dark" href="{wa_link(lang)}" target="_blank" rel="noopener">{WA_SVG} {T(lang, "WhatsApp an engineer", "كلّم مهندس واتساب")}</a>
  <a class="btn btn-line" href="tel:{SITE["phone"]}">{PHONE_SVG} <span dir="ltr">{SITE["phone_display"]}</span></a></div>
</div></div></section>'''

def faq_block(lang, items=FAQ):
    html = "".join(f'<details><summary>{e(T(lang, q, qa))}</summary><p>{e(T(lang, a, aa))}</p></details>' for q, qa, a, aa in items)
    ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": T(lang, q, qa), "acceptedAnswer": {"@type": "Answer", "text": T(lang, a, aa)}}
        for q, qa, a, aa in items]}
    return html, ld

def cats_grid(lang, exclude=None):
    out = []
    for c in CATEGORIES:
        if c["slug"] == exclude:
            continue
        if c["slug"] == "aluminum-upvc-window-door-machines":
            out.append(f'''<a class="cat feature" href="{url(lang, c["slug"])}"><div class="txt"><span class="ico">{icon(c["icon"])}</span>
            <h3>{e(c[lang])}</h3><p>{e(c["short_" + lang])}</p><span class="more">{T(lang, "Explore the full line →", "اكتشف الخط الكامل ←")}</span></div>
            <img src="/img/products/cljz2sj-550x4200.webp" alt="{e(c[lang])}" width="1200" height="900" loading="lazy"></a>''')
        else:
            out.append(f'''<a class="cat" href="{url(lang, c["slug"])}"><span class="ico">{icon(c["icon"])}</span><h3>{e(c[lang])}</h3>
            <p>{e(c["short_" + lang])}</p><span class="more">{T(lang, "View machines →", "شاهد المكائن ←")}</span></a>''')
    return '<div class="grid g4">' + "".join(out) + "</div>"

# ------------------------------------------------------------------ pages
def home(lang):
    feat = "".join(product_card(PROD[s], lang) for s in FEATURED)
    why = "".join(f'<div class="why"><span class="n">0{i+1}</span><h3>{e(T(lang, a, b))}</h3><p>{e(T(lang, c, d))}</p></div>'
                  for i, (a, b, c, d) in enumerate(WHY))
    ind = "".join(f"<span>{e(T(lang, a, b))}</span>" for a, b in INDUSTRIES)
    cities = "".join(f'<a href="{url(lang, "cnc-machines-in-" + s)}">{e(T(lang, en, ar))}</a>' for s, en, ar, *_ in CITIES)
    faq_html, faq_ld = faq_block(lang)
    stats = "".join(f'<div class="stat"><b>{n}</b><span>{e(T(lang, a, b))}</span></div>' for n, a, b in STATS)
    body = f'''
<section class="hero"><div class="wrap">
  <div>
    <span class="eyebrow">{T(lang, "Industrial machinery · Saudi Arabia · Since 2006", "مكائن صناعية · السعودية · منذ 2006")}</span>
    <h1>{T(lang, "CNC & laser machines that <span>pay for themselves.</span>", "مكائن CNC وليزر <span>ترجّع قيمتها من إنتاجها.</span>")}</h1>
    <p class="lead">{T(lang, "Fiber laser cutters up to 20 kW, CO2 lasers, CNC routers, press brakes and complete aluminum & uPVC window lines — supplied, installed and supported across the Kingdom by Robotech.",
                       "ليزر فايبر حتى 20 كيلوواط، ليزر CO2، راوتر CNC، مكابس ثني، وخطوط كاملة لنوافذ الألمنيوم و uPVC — توريد وتركيب ودعم في كل المملكة من روبوتك.")}</p>
    <div class="ctas">
      <a class="btn btn-primary" href="{wa_link(lang)}" target="_blank" rel="noopener">{WA_SVG} {T(lang, "Get a quote on WhatsApp", "اطلب عرض سعر واتساب")}</a>
      <a class="btn btn-ghost" href="#machines">{T(lang, "Browse machines", "تصفّح المكائن")}</a>
    </div>
    <div class="certs">{"".join(f"<span>{c}</span>" for c in CERTS)}</div>
  </div>
  <div class="hero-visual"><img src="/img/products/cljzd-cnc-6600.webp" alt="{T(lang, "Robotech CNC cutting center CLJZD-CNC-6600", "مركز قص CNC من روبوتك CLJZD-CNC-6600")}" width="1200" height="900" fetchpriority="high"><span class="beam"></span>
  <span class="hero-tag"><b>CLJZD-CNC-6600</b>{T(lang, "CNC cutting center", "مركز قص CNC")}</span></div>
</div></section>
<section class="stats" aria-label="{T(lang, "Key figures", "أرقام")}"><div class="wrap">{stats}</div></section>

<section class="sec" id="machines"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow">{T(lang, "Machine range", "تشكيلة المكائن")}</span><h2>{T(lang, "Every machine your workshop needs", "كل مكينة يحتاجها مصنعك")}</h2></div>
  <p>{T(lang, "Twelve product lines, one supplier, one support team.", "اثنا عشر خط منتجات، مورد واحد، وفريق دعم واحد.")}</p></div>
  {cats_grid(lang)}
</div></section>

<section class="sec alt"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow">{T(lang, "Featured", "مختارات")}</span><h2>{T(lang, "Best-selling machines", "الأكثر طلباً")}</h2></div>
  <a class="btn btn-line" href="{url(lang, "aluminum-upvc-window-door-machines")}">{T(lang, "All window & door machines", "كل مكائن الألمنيوم")}</a></div>
  <div class="grid g4">{feat}</div>
</div></section>

<section class="sec"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow">{T(lang, "Why Robotech", "ليش روبوتك")}</span><h2>{T(lang, "We don't just sell machines. We keep them cutting.", "ما نبيع مكينة وبس. نضمن إنها تشتغل.")}</h2></div>
  <p>{T(lang, "Over 25,000 engineering and industrial leaders across Saudi Arabia and the Gulf rely on Robotech machines.", "أكثر من 25,000 جهة هندسية وصناعية في السعودية والخليج تعتمد على مكائن روبوتك.")}</p></div>
  <div class="grid g3">{why}</div>
</div></section>

<section class="sec alt"><div class="wrap grid g2" style="gap:48px">
  <div><span class="eyebrow">{T(lang, "Industries", "القطاعات")}</span><h2>{T(lang, "Built for Saudi industry", "مصممة للصناعة السعودية")}</h2>
  <p style="color:var(--steel)">{T(lang, "From the Riyadh Metro and NEOM supply chains to signage studios and kitchen-equipment workshops.", "من سلاسل توريد مترو الرياض ونيوم إلى محلات الدعاية وورش معدات المطابخ.")}</p>
  <div class="chips">{ind}</div></div>
  <div><span class="eyebrow">{T(lang, "Service areas", "مناطق الخدمة")}</span><h2>{T(lang, "Installation & support Kingdom-wide", "تركيب ودعم في كل المملكة")}</h2>
  <p style="color:var(--steel)">{T(lang, "Offices in Riyadh, Jeddah and Dammam; field engineers everywhere else.", "مكاتب في الرياض وجدة والدمام، ومهندسين ميدانيين لباقي المناطق.")}</p>
  <div class="chips">{cities}</div></div>
</div></section>

<section class="sec"><div class="wrap grid g2" style="gap:48px;align-items:start">
  <div><span class="eyebrow">FAQ</span><h2>{T(lang, "Questions buyers ask us", "أسئلة يسألها العملاء")}</h2>
  <p style="color:var(--steel)">{T(lang, "Still unsure? Our engineers answer on WhatsApp.", "عندك سؤال ثاني؟ مهندسينا يردون على الواتساب.")}</p>
  <a class="btn btn-primary" href="{SITE["catalog"]}" download>{T(lang, "Download catalog (PDF)", "تحميل الكتالوج (PDF)")}</a></div>
  <div class="faq">{faq_html}</div>
</div></section>
{cta_band(lang)}'''
    page(lang, "", T(lang, "Robotech CNC | Fiber Laser, CO2 & CNC Machines in Saudi Arabia",
                      "روبوتك CNC | مكائن ليزر فايبر و CO2 و CNC في السعودية"),
         T(lang, "Robotech supplies fiber laser cutting machines, CO2 lasers, CNC routers, press brakes and aluminum/uPVC window machinery across Saudi Arabia — with installation, training and 24/7 support since 2006.",
              "روبوتك لتوريد مكائن ليزر فايبر، ليزر CO2، راوتر CNC، مكابس الثني ومكائن الألمنيوم و uPVC في السعودية — مع التركيب والتدريب ودعم 24/7 منذ 2006."),
         body, [faq_ld, {"@context": "https://schema.org", "@type": "WebSite", "url": D + "/", "name": "Robotech CNC",
                         "inLanguage": T(lang, "en", "ar")}], current="home",
         keywords=T(lang, "CNC machines Saudi Arabia, fiber laser cutting machine, CO2 laser, CNC router, press brake, aluminum window machine",
                    "مكائن CNC السعودية, مكينة ليزر فايبر, ليزر CO2, راوتر CNC, مكبس ثني, مكائن ألمنيوم"))

def category(lang, c):
    items = [p for p in PRODUCTS if p["cat"] == c["slug"]]
    home_n = T(lang, "Home", "الرئيسية")
    cr = [(home_n, url(lang)), (c[lang], url(lang, c["slug"]))]
    intro = "".join(f"<p>{e(x)}</p>" for x in c["intro_" + lang])
    cards = "".join(product_card(p, lang) for p in items)
    extra = ""
    if c["slug"] == "aluminum-upvc-window-door-machines":
        extra = f'<p><a class="btn btn-primary" href="{SITE["catalog"]}" download>{T(lang, "Download the full catalog (PDF, 26 pages)", "حمّل الكتالوج الكامل (PDF، 26 صفحة)")}</a></p>'
    body = f'''<section class="phead"><div class="wrap">{crumbs_html(cr)}<span class="eyebrow">{T(lang, "Machines", "المكائن")}</span>
<h1>{e(c[lang])} {T(lang, "in Saudi Arabia", "في السعودية")}</h1><p>{e(c["short_" + lang])}</p></div></section>
<section class="sec"><div class="wrap"><div class="prose">{intro}{extra}</div>
{f'<div class="grid g4" style="margin-top:32px">{cards}</div>' if cards else ""}
</div></section>
{cta_band(lang)}
<section class="sec alt"><div class="wrap"><div class="sec-head"><h2>{T(lang, "Other machine lines", "خطوط مكائن أخرى")}</h2></div>{cats_grid(lang, exclude=c["slug"])}</div></section>'''
    itemlist = {"@context": "https://schema.org", "@type": "ItemList", "name": c[lang],
                "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": D + url(lang, "product/" + p["slug"])}
                                    for i, p in enumerate(items)]}
    og = next((f'/img/products/{p["img"]}' for p in items if p["img"]), "/img/products/cgs-6500.webp")
    page(lang, c["slug"], T(lang, f'{c["en"]} in Saudi Arabia | Robotech CNC', f'{c["ar"]} في السعودية | روبوتك'),
         c["short_" + lang] + T(lang, " Supply, installation & support across KSA.", " توريد وتركيب ودعم في كل المملكة."),
         body, [crumbs_ld(cr), itemlist], og_img=og, current="win" if c["slug"].startswith("aluminum") else "",
         keywords=c["keywords_" + lang])

def product(lang, p):
    c = CAT[p["cat"]]
    home_n = T(lang, "Home", "الرئيسية")
    cr = [(home_n, url(lang)), (c[lang], url(lang, c["slug"])), (p[lang], url(lang, "product/" + p["slug"]))]
    feats = "".join(f"<li>{e(x)}</li>" for x in p["features_" + lang])
    specs = "".join(f'<tr><th>{e(T(lang, a, b))}</th><td dir="ltr">{e(v)}</td></tr>' for a, b, v in p["specs"])
    related = [x for x in PRODUCTS if x["cat"] == p["cat"] and x["slug"] != p["slug"]][:4]
    rel = "".join(product_card(x, lang) for x in related)
    msg = T(lang, f"Hello Robotech, I'd like a quote for {p['model']} ({p['en']}).",
            f"السلام عليكم روبوتك، أبغى عرض سعر لمكينة {p['model']} ({p['ar']}).")
    body = f'''<section class="phead"><div class="wrap">{crumbs_html(cr)}<span class="eyebrow" dir="ltr">{e(p["model"])}</span><h1>{e(p[lang])}</h1></div></section>
<section class="sec"><div class="wrap pd">
  <div class="gallery">{img_or_placeholder(p, lang, eager=True)}</div>
  <div>
    <p style="font-size:1.12rem">{e(p["sum_" + lang])}</p>
    {f'<h2 style="font-size:1.3rem">{T(lang, "Key features", "أهم المميزات")}</h2><ul class="ticks">{feats}</ul>' if feats else ""}
    {f'<h2 style="font-size:1.3rem">{T(lang, "Specifications", "المواصفات الفنية")}</h2><table class="specs">{specs}</table>' if specs else ""}
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <a class="btn btn-primary" href="{wa_link(lang, msg)}" target="_blank" rel="noopener">{WA_SVG} {T(lang, "Get price on WhatsApp", "اطلب السعر واتساب")}</a>
      <a class="btn btn-line" href="tel:{SITE["phone"]}">{PHONE_SVG} {T(lang, "Call sales", "اتصل بالمبيعات")}</a>
    </div>
    <p class="note" style="margin-top:16px">{T(lang, "Configurations and specifications vary by order. Final specs are confirmed in your quotation. Includes installation, training and warranty support.",
                                                "المواصفات قابلة للتخصيص حسب الطلب، ويتم تأكيدها في عرض السعر. يشمل التركيب والتدريب ودعم الضمان.")}</p>
  </div>
</div></section>
{f'<section class="sec alt"><div class="wrap"><div class="sec-head"><h2>{T(lang, "Related machines", "مكائن مشابهة")}</h2></div><div class="grid g4">{rel}</div></div></section>' if rel else ""}
{cta_band(lang)}'''
    ld = {"@context": "https://schema.org", "@type": "Product", "name": p[lang], "model": p["model"], "sku": p["model"],
          "description": p["sum_" + lang], "brand": {"@type": "Brand", "name": "Robotech"}, "category": c[lang],
          "url": D + url(lang, "product/" + p["slug"])}
    if p["img"]:
        ld["image"] = D + "/img/products/" + p["img"]
    if p["specs"]:
        ld["additionalProperty"] = [{"@type": "PropertyValue", "name": a, "value": v} for a, b, v in p["specs"]]
    page(lang, "product/" + p["slug"], T(lang, f'{p["en"]} | Price & Specs in KSA | Robotech', f'{p["ar"]} | السعر والمواصفات | روبوتك'),
         p["sum_" + lang][:155], body, [crumbs_ld(cr), ld],
         og_img=("/img/products/" + p["img"]) if p["img"] else "/img/products/cgs-6500.webp")

def about(lang):
    cr = [(T(lang, "Home", "الرئيسية"), url(lang)), (T(lang, "About us", "من نحن"), url(lang, "about-us"))]
    why = "".join(f'<div class="why"><h3>{e(T(lang, a, b))}</h3><p>{e(T(lang, c, d))}</p></div>' for a, b, c, d in WHY)
    body = f'''<section class="phead"><div class="wrap">{crumbs_html(cr)}<span class="eyebrow">{T(lang, "About Robotech", "عن روبوتك")}</span>
<h1>{T(lang, "Two decades powering Saudi manufacturing", "قرابة عشرين سنة نشغّل الصناعة السعودية")}</h1></div></section>
<section class="sec"><div class="wrap grid g2" style="gap:48px;align-items:center"><div class="prose">
<p>{T(lang, "Premium Machinery Trading Company (Robotech) was established in May 2006 and is headquartered in Riyadh, with offices and warehouses in Jeddah and Dammam. We are one of the largest and best-known companies in our field in the region.",
            "تأسست شركة بريميوم لتجارة الآلات (روبوتك) في مايو 2006، ومقرها الرئيسي في الرياض، مع مكاتب ومستودعات في جدة والدمام. ونُعد من أكبر وأشهر الشركات في مجالنا بالمنطقة.")}</p>
<p>{T(lang, "We specialize in the latest technology for laser cutting, engraving and forming of all types of metals, wood and fabrics, as well as all CNC machines — and complete one-stop processing lines for aluminum and uPVC windows and doors.",
            "متخصصين في أحدث تقنيات القص والحفر والتشكيل بالليزر لكل أنواع المعادن والخشب والأقمشة، وكل مكائن CNC — إضافة لخطوط إنتاج متكاملة لأبواب ونوافذ الألمنيوم و uPVC.")}</p>
<p>{T(lang, "We empower tens of thousands of customers across Saudi Arabia to grow their metal-processing business with cutting-edge laser technology, reliable service and life-long support — reducing production cost and raising product quality and value.",
            "ساعدنا عشرات الآلاف من العملاء في المملكة يكبّرون أعمالهم بتقنيات ليزر متقدمة وخدمة موثوقة ودعم مدى الحياة — نقلل تكلفة الإنتاج ونرفع جودة المنتج وقيمته.")}</p>
<p>{T(lang, "Since our establishment, research, development and product quality have been the lifeline of the company. We control every step of pre-sales, sales and after-sales service, and hold CE, ISO 9001 and FDA certifications; over 90% of components come from well-known international brands.",
            "من أول يوم، الجودة والتطوير هم أساس شغلنا. نتابع كل مرحلة من قبل البيع إلى البيع وما بعد البيع، ومكائننا معتمدة CE و ISO 9001 و FDA، وأكثر من 90% من مكوناتها من ماركات عالمية معروفة.")}</p>
</div><div class="hero-visual" style="box-shadow:var(--shadow)"><img src="/img/products/cgs-6500.webp" alt="Robotech CGS-6500" width="1200" height="900" loading="lazy"></div></div></section>
<section class="stats"><div class="wrap">{"".join(f'<div class="stat"><b>{n}</b><span>{e(T(lang, a, b))}</span></div>' for n, a, b in STATS)}</div></section>
<section class="sec alt"><div class="wrap"><div class="sec-head"><h2>{T(lang, "What you get with Robotech", "وش تحصل مع روبوتك")}</h2></div><div class="grid g3">{why}</div></div></section>
{cta_band(lang)}'''
    page(lang, "about-us", T(lang, "About Us | Robotech CNC – Machinery Supplier in Saudi Arabia since 2006", "من نحن | روبوتك – مورد مكائن صناعية في السعودية منذ 2006"),
         T(lang, "Robotech (Premium Machinery Trading Co.) has supplied fiber laser, CO2, CNC router and window machinery in Saudi Arabia since 2006, with offices in Riyadh, Jeddah and Dammam.",
              "روبوتك (شركة بريميوم لتجارة الآلات) تورد مكائن الليزر و CNC وخطوط الألمنيوم في السعودية منذ 2006، بمكاتب في الرياض وجدة والدمام."),
         body, [crumbs_ld(cr)], current="about")

def contact(lang):
    cr = [(T(lang, "Home", "الرئيسية"), url(lang)), (T(lang, "Contact us", "تواصل معنا"), url(lang, "contact-us"))]
    opts = "".join(f"<option>{e(c[lang])}</option>" for c in CATEGORIES)
    cities = "".join(f"<option>{e(T(lang, en, ar))}</option>" for s, en, ar, *_ in CITIES)
    body = f'''<section class="phead"><div class="wrap">{crumbs_html(cr)}<span class="eyebrow">{T(lang, "Contact", "تواصل")}</span>
<h1>{T(lang, "Talk to an engineer, not a call center", "كلّم مهندس، مو كول سنتر")}</h1><p>{T(lang, "Quotes usually within one working day.", "عرض السعر غالباً خلال يوم عمل.")}</p></div></section>
<section class="sec"><div class="wrap contact-grid">
<div>
  <a class="cbox" href="{wa_link(lang)}" target="_blank" rel="noopener"><span class="ico" style="background:#E7F9EE;color:#1DA851">{WA_SVG}</span><span><b>WhatsApp</b><small dir="ltr">{SITE["phone_display"]}</small></span></a>
  <a class="cbox" href="tel:{SITE["phone"]}"><span class="ico">{PHONE_SVG}</span><span><b>{T(lang, "Call sales", "اتصل بالمبيعات")}</b><small dir="ltr">{SITE["phone_display"]}</small></span></a>
  <a class="cbox" href="mailto:{SITE["email"]}"><span class="ico">{icon("mark")}</span><span><b>{T(lang, "Email", "البريد الإلكتروني")}</b><small>{SITE["email"]}</small></span></a>
  <div class="cbox"><span class="ico">{icon("window")}</span><span><b>{T(lang, "Head office", "المقر الرئيسي")}</b><small>{e(SITE["address_" + lang])}</small></span></div>
  <iframe title="map" src="https://www.google.com/maps?q={SITE["street"].replace(" ", "+")}+{SITE["locality"]}&output=embed" width="100%" height="260" style="border:0;border-radius:14px" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
</div>
<form class="form" id="quote" data-wa="{SITE["whatsapp"]}">
  <h2 style="font-size:1.5rem">{T(lang, "Request a quote", "اطلب عرض سعر")}</h2>
  <div class="row"><div><label for="f-name">{T(lang, "Name", "الاسم")}</label><input id="f-name" name="name" required autocomplete="name"></div>
  <div><label for="f-phone">{T(lang, "Mobile", "الجوال")}</label><input id="f-phone" name="phone" type="tel" required autocomplete="tel" dir="ltr"></div></div>
  <div class="row"><div><label for="f-city">{T(lang, "City", "المدينة")}</label><select id="f-city" name="city">{cities}<option>{T(lang, "Other", "أخرى")}</option></select></div>
  <div><label for="f-machine">{T(lang, "Machine type", "نوع المكينة")}</label><select id="f-machine" name="machine">{opts}</select></div></div>
  <label for="f-msg">{T(lang, "Material, thickness, output, budget", "الخامة، السماكة، الإنتاج، الميزانية")}</label>
  <textarea id="f-msg" name="message"></textarea>
  <button class="btn btn-primary" type="submit">{WA_SVG} {T(lang, "Send via WhatsApp", "إرسال عبر واتساب")}</button>
  <p class="note" style="margin-top:12px">{T(lang, "Your request opens in WhatsApp, pre-filled — just press send.", "طلبك يفتح في واتساب جاهز — بس اضغط إرسال.")}</p>
</form>
</div></section>'''
    page(lang, "contact-us", T(lang, "Contact Robotech CNC | Get a Quote – Jeddah, Riyadh, Dammam", "تواصل مع روبوتك | اطلب عرض سعر – جدة، الرياض، الدمام"),
         T(lang, f"Call or WhatsApp Robotech on {SITE['phone_display']} for fiber laser, CO2, CNC router and window machinery quotes anywhere in Saudi Arabia.",
              f"تواصل مع روبوتك على {SITE['phone_display']} (اتصال أو واتساب) لعروض أسعار مكائن الليزر و CNC وخطوط الألمنيوم في كل المملكة."),
         body, [crumbs_ld(cr)], current="contact")

def city(lang, s, en, ar, ctx_en, ctx_ar):
    name = T(lang, en, ar)
    cr = [(T(lang, "Home", "الرئيسية"), url(lang)), (T(lang, f"CNC machines in {en}", f"مكائن CNC في {ar}"), url(lang, "cnc-machines-in-" + s))]
    feat = "".join(product_card(PROD[x], lang) for x in FEATURED[:4])
    body = f'''<section class="phead"><div class="wrap">{crumbs_html(cr)}<span class="eyebrow">{T(lang, "Service area", "منطقة خدمة")}</span>
<h1>{T(lang, f"CNC & Laser Machines in {en}", f"مكائن CNC والليزر في {ar}")}</h1>
<p>{T(lang, f"Supply, installation, training and spare parts for {en} — {ctx_en}.", f"توريد وتركيب وتدريب وقطع غيار في {ar} — {ctx_ar}.")}</p></div></section>
<section class="sec"><div class="wrap prose">
<p>{T(lang, f"Robotech supplies fiber laser cutting machines, CO2 lasers, CNC routers, press brakes and complete aluminum & uPVC window lines to manufacturers in {en}. Our engineers handle delivery, installation, commissioning and operator training on your site, and our local spare-parts stock keeps downtime to a minimum.",
            f"روبوتك توفر مكائن ليزر فايبر، ليزر CO2، راوتر CNC، مكابس ثني، وخطوط كاملة لنوافذ الألمنيوم و uPVC للمصانع والورش في {ar}. مهندسينا يتولون التوصيل والتركيب والتشغيل وتدريب المشغّلين في موقعك، ومخزون قطع الغيار المحلي يقلل التوقف لأقل حد.")}</p>
<p>{T(lang, f"Whether you run a signage studio, a sheet-metal shop or a window factory in {en}, we size the machine to your materials and output — then support it for its whole life.",
            f"سواء عندك محل دعاية وإعلان أو ورشة صاج أو مصنع نوافذ في {ar}، نختار لك المكينة حسب خاماتك وإنتاجك — وندعمها طول عمرها.")}</p>
</div><div class="wrap" style="margin-top:28px">{cats_grid(lang)}</div></section>
<section class="sec alt"><div class="wrap"><div class="sec-head"><h2>{T(lang, f"Popular machines in {en}", f"المكائن الأكثر طلباً في {ar}")}</h2></div><div class="grid g4">{feat}</div></div></section>
{cta_band(lang, T(lang, f"Get a machine quote in {en}", f"اطلب عرض سعر في {ar}"))}'''
    lb = {"@context": "https://schema.org", "@type": "Service", "serviceType": T(lang, "CNC and laser machine supply & installation", "توريد وتركيب مكائن CNC والليزر"),
          "provider": {"@id": D + "/#org"}, "areaServed": {"@type": "City", "name": en}}
    page(lang, "cnc-machines-in-" + s, T(lang, f"CNC & Laser Machines in {en} | Robotech CNC", f"مكائن CNC وليزر في {ar} | روبوتك"),
         T(lang, f"Fiber laser, CO2, CNC router and press brake machines in {en} with installation, training and local spare parts. Get a quote from Robotech.",
              f"مكائن ليزر فايبر و CO2 وراوتر CNC ومكابس ثني في {ar} مع التركيب والتدريب وقطع الغيار. اطلب عرض سعر من روبوتك."),
         body, [crumbs_ld(cr), lb])

def machine_shop(lang):
    cr = [(T(lang, "Home", "الرئيسية"), url(lang)), (T(lang, "CNC machine shop in Saudi Arabia", "متجر مكائن CNC في السعودية"), url(lang, "cnc-machine-shop-saudi"))]
    body = f'''<section class="phead"><div class="wrap">{crumbs_html(cr)}<h1>{T(lang, "CNC Machine Shop in Saudi Arabia", "متجر مكائن CNC في السعودية")}</h1>
<p>{T(lang, "Industrial-grade fiber lasers and press brakes for Riyadh, Jeddah, Dammam and beyond — helping Saudi factories move to smart manufacturing.",
           "ليزر فايبر ومكابس ثني بمستوى صناعي للرياض وجدة والدمام وباقي المناطق — نساعد المصانع السعودية تنتقل للتصنيع الذكي.")}</p></div></section>
<section class="sec"><div class="wrap prose">
<p>{T(lang, "Robotech CNC is a trusted partner for advanced industrial solutions in the Kingdom. Our equipment — from high-power fiber laser cutters to versatile press brakes — is designed for the demands of the Saudi industrial sector, and serves suppliers to the Kingdom's giga-projects including the Riyadh Metro, NEOM and high-volume production in the Eastern Province.",
            "روبوتك CNC شريك موثوق للحلول الصناعية المتقدمة في المملكة. معداتنا — من ليزر الفايبر عالي القدرة إلى مكابس الثني — مصممة لمتطلبات القطاع الصناعي السعودي، وتخدم موردي المشاريع الكبرى مثل مترو الرياض ونيوم والإنتاج الكثيف في المنطقة الشرقية.")}</p>
<p>{T(lang, "With a dedicated support team, we offer on-site installation, operator training and a large stock of machines and spare parts.",
            "مع فريق دعم مخصص، نوفر التركيب في الموقع وتدريب المشغّلين ومخزون كبير من المكائن وقطع الغيار.")}</p>
</div><div class="wrap" style="margin-top:28px">{cats_grid(lang)}</div></section>{cta_band(lang)}'''
    page(lang, "cnc-machine-shop-saudi", T(lang, "CNC Machine Shop in Saudi Arabia | Robotech CNC", "متجر مكائن CNC في السعودية | روبوتك"),
         T(lang, "Buy CNC, fiber laser and press brake machines in Saudi Arabia from Robotech — installation, training and spare parts in Riyadh, Jeddah and Dammam.",
              "اشترِ مكائن CNC وليزر فايبر ومكابس ثني في السعودية من روبوتك — تركيب وتدريب وقطع غيار في الرياض وجدة والدمام."),
         body, [crumbs_ld(cr)])

def not_found():
    body = '''<section class="phead" style="padding:120px 0"><div class="wrap"><span class="eyebrow">404</span><h1>Page not found · الصفحة غير موجودة</h1>
<p>The page may have moved in our new website. · ربما انتقلت الصفحة في موقعنا الجديد.</p>
<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px"><a class="btn btn-primary" href="/">Home</a><a class="btn btn-ghost" href="/ar/">الرئيسية</a></div></div></section>'''
    page("en", "404-tmp", "Page not found | Robotech CNC", "Page not found.", body)
    PAGES.pop()
    shutil.move(os.path.join(OUT, "404-tmp", "index.html"), os.path.join(OUT, "404.html"))
    shutil.rmtree(os.path.join(OUT, "404-tmp"))
    shutil.rmtree(os.path.join(OUT, "ar", "404-tmp"), ignore_errors=True)

# ------------------------------------------------------------------ seo files
REDIRECTS = [
    ("/product-category/machines/fiber-laser-machines/*", "/fiber-laser-machines/"),
    ("/product-category/machines/laser-marker-machines/*", "/laser-marking-machine/"),
    ("/product-category/bending-machines/*", "/banding-machine/"),
    ("/product-category/plasma/*", "/plasma-cutting-machines/"),
    ("/product-category/*", "/"),
    ("/shop/*", "/"),
    ("/product/lf60ms-three-chuck-zero-remains-laser-cutting-machine*", "/product/lf60ms-three-chuck-zero-remains/"),
    ("/product/lf20-fiber-marking-machine-2/", "/product/lf20-30-50-fiber-marking-machine/"),
    ("/product/lf1390-precision-fiber-laser-cutting-machine-2/", "/fiber-laser-machines/"),
    ("/product/dual-use-fiber-laser-cutting-machine/", "/product/lf1325lc-fiber-co2-dual-use-laser-cutting/"),
    ("/product/lf3015lnrlearn-more-cnc-pipe-plate-dual-use-fiber-laser-cutting-machine*", "/fiber-laser-machines/"),
    ("/cnc-machining-services-saudi-arabia-3/", "/cnc-machine-shop-saudi/"),
    ("/laser-welding-machine/", "/laser-welding-machines/"),
    ("/plasma/", "/plasma-cutting-machines/"),
    ("/wp-admin/*", "/"),
    ("/wp-login.php", "/"),
]

def seo_files():
    urls = []
    for en, ar in PAGES:
        alt = (f'<xhtml:link rel="alternate" hreflang="en" href="{D}{en}"/>'
               f'<xhtml:link rel="alternate" hreflang="ar" href="{D}{ar}"/>'
               f'<xhtml:link rel="alternate" hreflang="x-default" href="{D}{en}"/>')
        for u in (en, ar):
            pr = "1.0" if u in ("/", "/ar/") else ("0.8" if "/product/" not in u else "0.7")
            urls.append(f"<url><loc>{D}{u}</loc><lastmod>{TODAY}</lastmod><priority>{pr}</priority>{alt}</url>")
    open(os.path.join(OUT, "sitemap.xml"), "w").write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + "\n".join(urls) + "\n</urlset>\n")
    open(os.path.join(OUT, "robots.txt"), "w").write(f"User-agent: *\nAllow: /\n\nSitemap: {D}/sitemap.xml\n")
    # Cloudflare Pages / Netlify redirects (301 keeps old Google rankings)
    open(os.path.join(OUT, "_redirects"), "w").write("".join(f"{a} {b} 301\n" for a, b in REDIRECTS))
    # Vercel equivalent
    vr = [{"source": a.replace("*", ":path*"), "destination": b, "permanent": True} for a, b in REDIRECTS]
    open(os.path.join(OUT, "vercel.json"), "w").write(json.dumps({"trailingSlash": True, "redirects": vr}, indent=2))
    open(os.path.join(OUT, "_headers"), "w").write(
        "/img/*\n  Cache-Control: public, max-age=31536000, immutable\n/css/*\n  Cache-Control: public, max-age=604800\n"
        "/js/*\n  Cache-Control: public, max-age=604800\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n")

# ------------------------------------------------------------------ main
def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    shutil.copytree(os.path.join(ROOT, "static"), OUT)
    os.makedirs(os.path.join(OUT, "downloads"), exist_ok=True)
    cat_pdf = os.path.join(ROOT, "..", "robotech-link-in-bio", "catalogues", "catalog_1.pdf")
    if os.path.exists(cat_pdf):
        shutil.copy(cat_pdf, os.path.join(OUT, SITE["catalog"].lstrip("/")))
    for lang in ("en", "ar"):
        home(lang); about(lang); contact(lang); machine_shop(lang)
        for c in CATEGORIES: category(lang, c)
        for p in PRODUCTS: product(lang, p)
        for ci in CITIES: city(lang, *ci)
    not_found()
    seo_files()
    n = sum(len(f) for _, _, f in os.walk(OUT))
    print(f"Built {len(PAGES) * 2} pages ({n} files) -> {OUT}")

if __name__ == "__main__":
    main()
