# -*- coding: utf-8 -*-
"""
Global site settings — edit this file first.

After any change run:  python3 build.py
"""

SITE = {
    # ⚠️ Your real domain (no trailing slash). Used for canonical URLs, sitemap,
    # hreflang and structured data. Change it before going live.
    "url": "https://robotechcnc.com",

    "brand": {"ar": "روبوتك CNC", "en": "Robotech CNC"},
    "legal_name": "Robot Technology Co., Ltd",

    # Contact
    "phone": "+966508450477",            # E.164 format, used in tel: links + schema
    "phone_display": "+966 50 845 0477",
    "whatsapp": "966508450477",          # digits only, used in wa.me links
    "email": "",                         # e.g. "sales@robotechcnc.com" — leave "" to hide

    "address": {
        "street": "Yiwuleyuan East, Jiangbin Rd",
        "city": "Yiwu",
        "region": "Zhejiang",
        "country": "CN",
        "display": {
            "ar": "ييوليوان الشرقي، طريق جيانغبين، ييوو، تشجيانغ، الصين",
            "en": "Yiwuleyuan East, Jiangbin Rd, Yiwu, Zhejiang, China",
        },
    },

    # Social profiles — only non-empty ones are shown and added to schema "sameAs"
    "social": {
        "instagram": "",
        "tiktok": "",
        "snapchat": "",
        "x": "",
        "youtube": "",
        "facebook": "",
        "linkedin": "",
    },

    # Proof points shown across the site
    "years": 25,
    "machines_sold": 2415,
    "satisfaction": 95,

    # Search-engine verification + analytics (optional, leave "" to skip)
    "google_site_verification": "",
    "bing_site_verification": "",
    "ga4_id": "",  # e.g. "G-XXXXXXXXXX"
}

# Component brands shown in the "trusted partners" strip
PARTNERS = [
    ("HSD", {"ar": "سبندلات — إيطاليا", "en": "Spindles — Italy"}),
    ("HITECO", {"ar": "سبندلات — إيطاليا", "en": "Spindles — Italy"}),
    ("SCM", {"ar": "تقنيات الخشب — إيطاليا", "en": "Woodworking tech — Italy"}),
    ("SYNTEC", {"ar": "أنظمة تحكم CNC — تايوان", "en": "CNC controllers — Taiwan"}),
    ("YASKAWA", {"ar": "محركات سيرفو — اليابان", "en": "Servo drives — Japan"}),
    ("MAX Photonics", {"ar": "مصادر ليزر فايبر", "en": "Fiber laser sources"}),
]

# Product order on the site + structure (texts live in ar.py / en.py)
# Optional per product: "price_sar": 85000  → adds a price (Offer) to Google structured data
PRODUCTS = [
    {"slug": "fiber-laser-cutting-machine", "cat": "metal", "image": True, "icon": "laser",
     "related": ["enclosed-fiber-laser-cutting-machine", "handheld-laser-welding-machine", "fiber-laser-marking-machine"]},
    {"slug": "enclosed-fiber-laser-cutting-machine", "cat": "metal", "image": True, "icon": "tube",
     "related": ["fiber-laser-cutting-machine", "handheld-laser-welding-machine", "laser-cleaning-machine"]},
    {"slug": "handheld-laser-welding-machine", "cat": "metal", "image": True, "icon": "weld",
     "related": ["laser-cleaning-machine", "fiber-laser-cutting-machine", "enclosed-fiber-laser-cutting-machine"]},
    {"slug": "laser-cleaning-machine", "cat": "metal", "image": False, "icon": "clean",
     "related": ["handheld-laser-welding-machine", "fiber-laser-cutting-machine", "fiber-laser-marking-machine"]},
    {"slug": "fiber-laser-marking-machine", "cat": "metal", "image": True, "icon": "mark",
     "related": ["fiber-laser-cutting-machine", "handheld-laser-welding-machine", "co2-laser-cutting-engraving-1325"]},
    {"slug": "co2-laser-cutting-engraving-1325", "cat": "wood", "image": True, "icon": "engrave", "model": "1325",
     "related": ["cnc-router-wood-1325", "fiber-laser-marking-machine", "fiber-laser-cutting-machine"]},
    {"slug": "cnc-router-wood-1325", "cat": "wood", "image": True, "icon": "router", "model": "1325",
     "related": ["co2-laser-cutting-engraving-1325", "edge-banding-machine-4500at", "vacuum-laminating-machine"]},
    {"slug": "edge-banding-machine-4500at", "cat": "wood", "image": True, "icon": "edge", "model": "4500AT",
     "related": ["sliding-table-panel-saw-6132a", "cnc-router-wood-1325", "vacuum-laminating-machine"]},
    {"slug": "sliding-table-panel-saw-6132a", "cat": "wood", "image": True, "icon": "saw", "model": "6132A",
     "related": ["edge-banding-machine-4500at", "cnc-router-wood-1325", "vacuum-laminating-machine"]},
    {"slug": "vacuum-laminating-machine", "cat": "wood", "image": True, "icon": "press",
     "related": ["cnc-router-wood-1325", "sliding-table-panel-saw-6132a", "edge-banding-machine-4500at"]},
    {"slug": "door-lock-mortising-machine", "cat": "wood", "image": True, "icon": "door",
     "related": ["cnc-router-wood-1325", "sliding-table-panel-saw-6132a", "vacuum-laminating-machine"]},
]

CITIES = [
    {"slug": "cnc-machines-riyadh", "geo": "Riyadh", "coords": "24.71°N 46.68°E",
     "featured": ["cnc-router-wood-1325", "edge-banding-machine-4500at", "sliding-table-panel-saw-6132a",
                  "vacuum-laminating-machine", "fiber-laser-cutting-machine", "co2-laser-cutting-engraving-1325"]},
    {"slug": "cnc-machines-jeddah", "geo": "Jeddah", "coords": "21.49°N 39.19°E",
     "featured": ["co2-laser-cutting-engraving-1325", "cnc-router-wood-1325", "fiber-laser-cutting-machine",
                  "fiber-laser-marking-machine", "edge-banding-machine-4500at", "handheld-laser-welding-machine"]},
    {"slug": "cnc-machines-dammam", "geo": "Dammam", "coords": "26.42°N 50.09°E",
     "featured": ["fiber-laser-cutting-machine", "enclosed-fiber-laser-cutting-machine", "handheld-laser-welding-machine",
                  "laser-cleaning-machine", "fiber-laser-marking-machine", "cnc-router-wood-1325"]},
]

# Six application tiles on the home page → product they link to
APPLICATIONS = [
    ("laser", "fiber-laser-cutting-machine"),
    ("tube", "enclosed-fiber-laser-cutting-machine"),
    ("engrave", "co2-laser-cutting-engraving-1325"),
    ("mark", "fiber-laser-marking-machine"),
    ("weld", "handheld-laser-welding-machine"),
    ("clean", "laser-cleaning-machine"),
]
