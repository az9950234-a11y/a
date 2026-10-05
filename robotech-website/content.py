# -*- coding: utf-8 -*-
"""All site content (English + Arabic). Edit here, then run: python3 build.py"""

SITE = {
    "domain": "https://robotechcnc.com",
    "name_en": "Robotech CNC",
    "name_ar": "روبوتك CNC",
    "legal_en": "Robotech – Premium Machinery Trading Company",
    "legal_ar": "روبوتك – شركة بريميوم لتجارة الآلات",
    "phone": "+966508450477",
    "phone_display": "+966 50 845 0477",
    "whatsapp": "966508450477",
    "email": "info@robotechcnc.com",
    "address_en": "Abu Baker Elseddiq St, Sharafiya, Jeddah, Saudi Arabia",
    "address_ar": "شارع أبو بكر الصديق، الشرفية، جدة، المملكة العربية السعودية",
    "street": "Abu Baker Elseddiq St, Sharafiya",
    "locality": "Jeddah",
    "founded": "2006",
    "youtube": "https://www.youtube.com/@robotechcnc1413",
    "play": "https://play.google.com/store/apps/details?id=com.robotechcnc.www.robotechcnc",
    "catalog": "/downloads/robotech-aluminum-upvc-machinery-catalog.pdf",
}

STATS = [
    ("2006", "Established", "سنة التأسيس"),
    ("25,000+", "Industrial clients in KSA & the Gulf", "عميل صناعي في المملكة والخليج"),
    ("100+", "Countries our machines ship to", "دولة تصلها آلاتنا"),
    ("24/7", "Technical support", "دعم فني"),
]

CERTS = ["CE", "ISO 9001", "FDA", "SGS"]

# ---------------------------------------------------------------- categories
CATEGORIES = [
    {
        "slug": "fiber-laser-machines",
        "icon": "laser",
        "en": "Fiber Laser Cutting Machines",
        "ar": "مكائن قص الليزر فايبر",
        "short_en": "1 kW to 20 kW sheet, tube and dual-use fiber lasers for steel, stainless and aluminum.",
        "short_ar": "ليزر فايبر من 1 إلى 20 كيلوواط لقص الصاج والمواسير والاستخدام المزدوج للحديد والستانلس والألمنيوم.",
        "intro_en": [
            "Robotech supplies the full range of fiber laser cutting machines used by Saudi fabrication shops — from entry-level open-bed cutters to fully enclosed 20 kW systems with automatic exchange tables.",
            "Every machine is delivered with on-site installation, operator training and local spare parts, so your production line starts fast and stays running.",
        ],
        "intro_ar": [
            "توفر روبوتك تشكيلة كاملة من مكائن قص الليزر فايبر التي تحتاجها ورش ومصانع التشكيل في المملكة — من المكائن المفتوحة للمبتدئين إلى الأنظمة المغلقة بالكامل بقدرة 20 كيلوواط مع طاولة تبديل أوتوماتيكية.",
            "كل ماكينة تُسلَّم مع التركيب في موقعك، وتدريب المشغّلين، وقطع غيار متوفرة محلياً، عشان يبدأ خط إنتاجك بسرعة ويستمر بدون توقف.",
        ],
        "keywords_en": "fiber laser cutting machine Saudi Arabia, laser cutting machine Riyadh, tube laser cutter Jeddah",
        "keywords_ar": "مكينة ليزر فايبر, مكينة قص ليزر السعودية, ليزر قص حديد, ليزر قص مواسير",
    },
    {
        "slug": "co2-machine",
        "icon": "co2",
        "en": "CO2 Laser Cutting & Engraving",
        "ar": "مكائن ليزر CO2 للقص والحفر",
        "short_en": "Cut and engrave acrylic, wood, MDF, leather and fabric with RECI tubes and II-VI optics.",
        "short_ar": "قص وحفر الأكريليك والخشب والـMDF والجلد والأقمشة بأنابيب RECI وعدسات II-VI.",
        "intro_en": [
            "Our CO2 laser range covers compact engravers for signage studios through to 1325 large-format cutters for advertising and furniture factories.",
            "Tube power from 40 W up to 180 W, Leadshine drives and US II-VI optics deliver clean edges and fine engraving detail.",
        ],
        "intro_ar": [
            "تشكيلة ليزر CO2 عندنا تبدأ من مكائن الحفر الصغيرة لمحلات اللوحات والدعاية، وتوصل إلى مكائن 1325 الكبيرة لمصانع الدعاية والإعلان والأثاث.",
            "قدرات أنبوب من 40 إلى 180 واط، مع محركات Leadshine وعدسات II-VI الأمريكية لحواف نظيفة وحفر دقيق.",
        ],
        "keywords_en": "CO2 laser machine Saudi Arabia, laser engraving machine Jeddah, acrylic laser cutter",
        "keywords_ar": "مكينة ليزر CO2, مكينة حفر ليزر, ليزر قص أكريليك, مكينة دعاية وإعلان",
    },
    {
        "slug": "cnc-router-machines",
        "icon": "router",
        "en": "CNC Router Machines",
        "ar": "مكائن راوتر CNC",
        "short_en": "High-precision routers for wood, MDF, aluminum composite and stone, with auto-unloading options.",
        "short_ar": "راوتر عالي الدقة للخشب والـMDF وألواح الكلادينج والحجر، مع خيارات التفريغ الأوتوماتيكي.",
        "intro_en": [
            "From sign-making to kitchen and furniture production, our CNC routers are built for accuracy and long duty cycles — including the 1428 Proline with automatic discharge.",
        ],
        "intro_ar": [
            "من محلات اللوحات إلى مصانع المطابخ والأثاث، مكائن الراوتر عندنا مصممة للدقة والتشغيل المتواصل — ومنها موديل 1428 Proline مع التفريغ الأوتوماتيكي.",
        ],
        "keywords_en": "CNC router Saudi Arabia, wood CNC machine Riyadh, CNC router price KSA",
        "keywords_ar": "مكينة راوتر CNC, مكينة نجارة CNC, راوتر خشب السعودية",
    },
    {
        "slug": "aluminum-upvc-window-door-machines",
        "icon": "window",
        "en": "Aluminum & uPVC Window and Door Machinery",
        "ar": "مكائن تصنيع أبواب ونوافذ الألمنيوم و uPVC",
        "short_en": "One-stop production lines: cutting saws, CNC machining centers, corner crimping, welding and cleaning.",
        "short_ar": "خطوط إنتاج متكاملة: مناشير قص، مراكز تشغيل CNC، تجميع زوايا، لحام وتنظيف.",
        "intro_en": [
            "Robotech's window and door line is a complete one-stop solution for aluminum and uPVC fabricators: double-head precision saws, integrated intelligent workstations, gantry machining centers, four-head corner crimping, seamless PVC welding and CNC corner cleaning.",
            "Download the full catalog for every model and specification, or talk to an engineer to design a production line around your output targets.",
        ],
        "intro_ar": [
            "خط روبوتك لتصنيع الأبواب والنوافذ حل متكامل لمصانع الألمنيوم و uPVC: مناشير دقيقة برأسين، محطات عمل ذكية متكاملة، مراكز تشغيل CNC، تجميع زوايا بأربعة رؤوس، لحام PVC بدون فواصل، وتنظيف زوايا CNC.",
            "حمّل الكتالوج الكامل لكل الموديلات والمواصفات، أو كلّم مهندسنا يصمم لك خط إنتاج حسب الطاقة اللي تستهدفها.",
        ],
        "keywords_en": "aluminum window machine Saudi Arabia, uPVC window machine, double head cutting saw, aluminium profile CNC",
        "keywords_ar": "مكائن ألمنيوم, مكينة قص ألمنيوم راسين, مكائن upvc, مكائن تصنيع نوافذ وأبواب",
    },
    {
        "slug": "banding-machine",
        "icon": "bend",
        "en": "Bending Machines & Press Brakes",
        "ar": "مكائن الثني والمكابس",
        "short_en": "CNC press brakes, roll bending and profile bending machines for sheet, tube and beams.",
        "short_ar": "مكابس ثني CNC، مكائن درفلة، ومكائن ثني البروفايل للصاج والمواسير والكمرات.",
        "intro_en": [
            "Electro-hydraulic servo, hybrid and servo-electric CNC press brakes (AD-R series), plus MRB-S roll benders and PBM profile benders for structural work.",
        ],
        "intro_ar": [
            "مكابس ثني CNC هيدروليك سيرفو وهجينة وكهربائية (سلسلة AD-R)، إضافة إلى مكائن الدرفلة MRB-S ومكائن ثني البروفايل PBM للأعمال الإنشائية.",
        ],
        "keywords_en": "press brake Saudi Arabia, CNC bending machine, roll bending machine KSA",
        "keywords_ar": "مكبس ثني CNC, مكينة ثني صاج, مكينة درفلة, مكينة ثني حديد",
    },
    {
        "slug": "laser-marking-machine",
        "icon": "mark",
        "en": "Laser Marking Machines",
        "ar": "مكائن الطباعة والحفر بالليزر",
        "short_en": "Permanent, high-contrast fiber marking on metals and plastics — zero consumables.",
        "short_ar": "حفر وطباعة دائمة وعالية الوضوح على المعادن والبلاستيك — بدون مواد استهلاكية.",
        "intro_en": [
            "LF20 / LF30 / LF50 fiber marking machines for serial numbers, logos, QR codes and jewelry — fast, permanent and maintenance-free.",
        ],
        "intro_ar": [
            "مكائن LF20 / LF30 / LF50 لحفر الأرقام التسلسلية والشعارات وأكواد QR والمجوهرات — سريعة ودائمة وبدون صيانة تُذكر.",
        ],
        "keywords_en": "laser marking machine Saudi Arabia, fiber laser marker, laser engraving metal",
        "keywords_ar": "مكينة حفر ليزر على المعادن, ماركينج ليزر, طباعة ليزر على الذهب",
    },
    {
        "slug": "laser-cleaning-machines",
        "icon": "clean",
        "en": "Laser Cleaning Machines",
        "ar": "مكائن التنظيف بالليزر",
        "short_en": "Remove rust, paint and oil without chemicals or abrasives.",
        "short_ar": "إزالة الصدأ والدهان والزيوت بدون كيماويات أو رمل.",
        "intro_en": [
            "Eco-friendly laser cleaning for rust, paint, oxide and oil removal — no chemical agents, no blasting media and minimal operator exposure.",
        ],
        "intro_ar": [
            "تنظيف صديق للبيئة لإزالة الصدأ والدهان والأكسدة والزيوت — بدون مواد كيميائية ولا رمل، وبأقل تعرّض للمشغّل.",
        ],
        "keywords_en": "laser cleaning machine Saudi Arabia, laser rust removal",
        "keywords_ar": "مكينة تنظيف ليزر, إزالة الصدأ بالليزر",
    },
    {
        "slug": "laser-welding-machines",
        "icon": "weld",
        "en": "Laser Welding Machines",
        "ar": "مكائن اللحام بالليزر",
        "short_en": "Handheld and automated laser welding for stainless, carbon steel and aluminum.",
        "short_ar": "لحام ليزر يدوي وآلي للستانلس والحديد والألمنيوم.",
        "intro_en": [
            "Laser welding produces clean, narrow seams with minimal distortion and little post-finishing — ideal for kitchen equipment, signage and sheet-metal enclosures.",
        ],
        "intro_ar": [
            "اللحام بالليزر يعطي خط لحام نظيف ورفيع بأقل تشوّه وتشطيب بسيط — مثالي لمعدات المطابخ واللوحات وصناديق الصاج.",
        ],
        "keywords_en": "laser welding machine Saudi Arabia, handheld laser welder",
        "keywords_ar": "مكينة لحام ليزر, لحام ليزر يدوي",
    },
    {
        "slug": "robotic-arm",
        "icon": "robot",
        "en": "Industrial Robotic Arms",
        "ar": "الأذرع الروبوتية الصناعية",
        "short_en": "Six-axis HWASHI welding robots and turnkey robotic welding cells.",
        "short_ar": "روبوتات لحام HWASHI بستة محاور وخلايا لحام روبوتية جاهزة.",
        "intro_en": [
            "Six-axis HWASHI industrial robots combine with MIG, TIG, aluminum and laser welding sources, plus ready-made units such as the storage-rack corner welding robot.",
        ],
        "intro_ar": [
            "روبوتات HWASHI الصناعية بستة محاور تعمل مع لحام MIG و TIG والألمنيوم والليزر، إضافة لوحدات جاهزة مثل روبوت لحام زوايا الرفوف.",
        ],
        "keywords_en": "welding robot Saudi Arabia, industrial robot arm KSA",
        "keywords_ar": "روبوت لحام, ذراع روبوت صناعي السعودية",
    },
    {
        "slug": "plasma-cutting-machines",
        "icon": "plasma",
        "en": "Plasma & Oxy-Fuel Cutting",
        "ar": "مكائن قص البلازما والأكسجين",
        "short_en": "CNC plasma and oxy-fuel cutting for thick plate and structural steel.",
        "short_ar": "قص بلازما وأكسجين CNC للصاج السميك والحديد الإنشائي.",
        "intro_en": [
            "Our oxy-plasma cutters serve structural steel fabrication through to agricultural machinery repair — a cost-effective route to thick-plate cutting.",
        ],
        "intro_ar": [
            "مكائن قص البلازما والأكسجين عندنا تخدم من مصانع الحديد الإنشائي إلى ورش صيانة المعدات الزراعية — حل اقتصادي لقص الصاج السميك.",
        ],
        "keywords_en": "CNC plasma cutter Saudi Arabia, oxy fuel cutting machine",
        "keywords_ar": "مكينة بلازما CNC, قص بلازما, مكينة قص أكسجين",
    },
    {
        "slug": "glass-machines",
        "icon": "glass",
        "en": "Glass Cutting Machines",
        "ar": "مكائن قص الزجاج",
        "short_en": "Automatic CNC glass loading, labeling and cutting — model CNC-3826A.",
        "short_ar": "تحميل وترقيم وقص زجاج أوتوماتيكي CNC — موديل CNC-3826A.",
        "intro_en": [
            "The CNC-3826A integrates automatic glass loading, labeling, a telescopic arm and automatic cutting in a single line.",
        ],
        "intro_ar": [
            "موديل CNC-3826A يجمع تحميل الزجاج الأوتوماتيكي والترقيم والذراع التلسكوبي والقص الأوتوماتيكي في خط واحد.",
        ],
        "keywords_en": "CNC glass cutting machine Saudi Arabia",
        "keywords_ar": "مكينة قص زجاج CNC, مكائن زجاج السعودية",
    },
    {
        "slug": "spare-parts-2",
        "icon": "parts",
        "en": "CNC & Laser Spare Parts",
        "ar": "قطع غيار مكائن CNC والليزر",
        "short_en": "Nozzles, lenses, protective windows, laser heads, spindles and drives — in stock locally.",
        "short_ar": "نوزلات، عدسات، زجاج حماية، رؤوس ليزر، سبندلات ودرايفرات — متوفرة محلياً.",
        "intro_en": [
            "Downtime costs more than parts. We hold a large local stock of consumables and critical spares for the machines we sell, with fast dispatch across the Kingdom.",
        ],
        "intro_ar": [
            "التوقف يكلفك أكثر من قطعة الغيار. عندنا مخزون محلي كبير للمواد الاستهلاكية وقطع الغيار الأساسية للمكائن اللي نبيعها، مع شحن سريع لكل مناطق المملكة.",
        ],
        "keywords_en": "laser spare parts Saudi Arabia, CNC spare parts Jeddah",
        "keywords_ar": "قطع غيار ليزر, قطع غيار CNC جدة, عدسة ليزر, نوزل ليزر",
    },
]

# ---------------------------------------------------------------- products
# img: file in static/img/products/ (None -> branded placeholder until real photo is added)
# specs: (label_en, label_ar, value)
P = []

def prod(**k):
    k.setdefault("img", None)
    k.setdefault("features_en", [])
    k.setdefault("features_ar", [])
    k.setdefault("specs", [])
    P.append(k)

# ---- Fiber laser
prod(slug="lf3015ln-fiber-laser-cutting-machine", cat="fiber-laser-machines", model="LF3015LN",
     en="LF3015LN Fiber Laser Cutting Machine", ar="مكينة قص ليزر فايبر LF3015LN",
     sum_en="The workhorse sheet-metal fiber laser: 1500 × 3000 mm bed, 1–3 kW sources, intelligent auto-focus and an aviation-aluminum gantry for fast, accurate cutting.",
     sum_ar="مكينة الصاج الأكثر طلباً: طاولة 1500 × 3000 مم، مصادر ليزر من 1 إلى 3 كيلوواط، فوكس أوتوماتيكي ذكي وجسر من ألمنيوم الطيران لقص سريع ودقيق.",
     features_en=["Intelligent auto-focusing head, 0.01 mm precision", "Cuts 0–20 mm plates of different materials", "3rd-generation aviation aluminum gantry", "Up to 120 m/min idle speed"],
     features_ar=["رأس فوكس أوتوماتيكي ذكي بدقة 0.01 مم", "يقص ألواح من 0 إلى 20 مم بأنواع مختلفة", "جسر ألمنيوم طيران من الجيل الثالث", "سرعة حركة حتى 120 م/دقيقة"],
     specs=[("Working area", "مساحة العمل", "1500 × 3000 mm"), ("Laser power", "قدرة الليزر", "1000 – 3000 W"), ("Idle speed", "سرعة الحركة", "120 m/min"), ("Auto-focus precision", "دقة الفوكس", "0.01 mm")])
prod(slug="whole-cover-fiber-laser-cutting-machine", cat="fiber-laser-machines", model="Whole Cover 20kW",
     en="Whole Cover Fiber Laser Cutting Machine (up to 20 kW)", ar="مكينة ليزر فايبر مغلقة بالكامل (حتى 20 كيلوواط)",
     sum_en="Heavy-industry enclosed fiber laser with a 15-second exchange table and up to 20 kW IPG source — built for continuous, high-volume thick-plate cutting.",
     sum_ar="ليزر فايبر مغلق للصناعات الثقيلة مع طاولة تبديل خلال 15 ثانية ومصدر IPG حتى 20 كيلوواط — مصمم لقص الصاج السميك بإنتاج متواصل.",
     features_en=["Fully enclosed body with CE laser-protective glass", "15-second automatic exchange table", "Internal fume filtration", "Load and unload while cutting"],
     features_ar=["هيكل مغلق بالكامل بزجاج حماية ليزر معتمد CE", "طاولة تبديل أوتوماتيكية خلال 15 ثانية", "فلترة الدخان داخلياً", "تحميل وتفريغ أثناء القص"],
     specs=[("Laser source", "مصدر الليزر", "IPG up to 20 kW"), ("Table exchange", "تبديل الطاولة", "≈ 15 s"), ("Machine weight", "الوزن", "≈ 7500 kg")])
prod(slug="enclosed-fiber-laser-cutting-machine", cat="fiber-laser-machines", model="Enclosed Series",
     en="Enclosed Fiber Laser Cutting Machine", ar="مكينة ليزر فايبر مغلقة",
     sum_en="Precision cutting with full operator protection for production lines that need speed and safety in one machine.",
     sum_ar="قص دقيق مع حماية كاملة للمشغّل، لخطوط الإنتاج اللي تحتاج السرعة والأمان في مكينة وحدة.",
     features_en=["Fully enclosed cutting area", "Exchange table for continuous production", "Smoke extraction and filtration"],
     features_ar=["منطقة قص مغلقة بالكامل", "طاولة تبديل لإنتاج متواصل", "شفط وفلترة الدخان"])
prod(slug="lf60ms-three-chuck-zero-remains", cat="fiber-laser-machines", model="LF60MS",
     en="LF60MS Three-Chuck Zero-Remains Tube Laser", ar="مكينة ليزر مواسير LF60MS بثلاث ظروف (بدون هالك)",
     sum_en="Three-chuck tube laser that uses 100% of every tube — no 20 cm tail scrap like two-chuck machines. Built for high-volume tube fabricators.",
     sum_ar="ليزر مواسير بثلاث ظروف يستغل 100% من الماسورة — بدون هالك 20 سم مثل مكائن الظرفين. مصمم لمصانع المواسير ذات الإنتاج العالي.",
     features_en=["Zero-remains cutting saves material on every tube", "Round, square and profile tubes", "±0.02 mm repeat positioning"],
     features_ar=["قص بدون هالك يوفر الخامة في كل ماسورة", "مواسير دائرية ومربعة وبروفايلات", "دقة تكرار ±0.02 مم"],
     specs=[("Laser power", "قدرة الليزر", "1 / 2 / 3 / 4 / 6 / 8 kW"), ("Tube diameter", "قطر الماسورة", "Φ20 – Φ300 mm"), ("Repeat positioning", "دقة التكرار", "±0.02 mm")])
prod(slug="lf3015mb-coiled-fiber-laser-cutting-machine", cat="fiber-laser-machines", model="LF3015MB",
     en="LF3015MB Coil-Fed Fiber Laser Cutting Machine", ar="مكينة ليزر فايبر LF3015MB بالتغذية من الرول",
     sum_en="Cuts directly from coil: an uncoiling and leveling line feeds 100–1300 mm wide strip straight into the laser for continuous production.",
     sum_ar="يقص مباشرة من الرول: خط فك وتسوية يغذي شريط بعرض 100 إلى 1300 مم مباشرة للّيزر لإنتاج متواصل.",
     specs=[("Coil width", "عرض الرول", "100 – 1300 mm")])
prod(slug="lf1325lc-fiber-co2-dual-use-laser-cutting", cat="fiber-laser-machines", model="LF1325LC",
     en="LF1325LC Fiber & CO2 Dual-Use Laser", ar="مكينة ليزر LF1325LC فايبر و CO2 (استخدام مزدوج)",
     sum_en="Two lasers in one machine: fiber for metal and CO2 for non-metals such as acrylic and wood — ideal for signage and advertising workshops.",
     sum_ar="ليزرين في مكينة وحدة: فايبر للمعادن و CO2 لغير المعادن مثل الأكريليك والخشب — مثالية لمحلات الدعاية والإعلان.")
prod(slug="platform-integrated-fiber-laser", cat="fiber-laser-machines", model="Platform Integrated",
     en="Platform Integrated Fiber Laser", ar="ليزر فايبر بمنصة متكاملة",
     sum_en="A rigid integrated-platform fiber laser designed to streamline workflow from loading to cutting.",
     sum_ar="ليزر فايبر بمنصة متكاملة وصلبة يختصر خطوات العمل من التحميل إلى القص.")

# ---- CO2
prod(slug="lg900n-co2-laser-cutting-machine", cat="co2-machine", model="LG900N",
     en="LG900N CO2 Laser Cutting Machine", ar="مكينة ليزر CO2 موديل LG900N",
     sum_en="900 × 600 mm CO2 laser combining RECI tube technology with US II-VI optics for crisp engraving and clean cuts.",
     sum_ar="ليزر CO2 بمساحة 900 × 600 مم يجمع أنابيب RECI وعدسات II-VI الأمريكية لحفر واضح وقص نظيف.",
     specs=[("Working area", "مساحة العمل", "900 × 600 mm"), ("Laser tube", "الأنبوب", "RECI"), ("Optics", "العدسات", "II-VI (USA)")])
prod(slug="lg6040n-laser-engraving-machine", cat="co2-machine", model="LG6040N",
     en="LG6040N Laser Engraving Machine", ar="مكينة حفر ليزر LG6040N",
     sum_en="Compact 600 × 400 mm engraver for gifts, signage and small-batch production.",
     sum_ar="مكينة حفر مدمجة 600 × 400 مم للهدايا واللوحات والإنتاج بكميات صغيرة.",
     specs=[("Engraving area", "مساحة الحفر", "600 × 400 mm"), ("Laser power", "قدرة الليزر", "40 / 60 / 80 W"), ("Positioning accuracy", "دقة التموضع", "±0.05 mm")])
prod(slug="storm600-co2-laser-cutting-machine", cat="co2-machine", model="STORM600",
     en="STORM600 CO2 Laser Cutting Machine", ar="مكينة ليزر CO2 موديل STORM600",
     sum_en="Compact industrial CO2 laser with a robust chassis and Leadshine drive system for microscopic precision in cutting and engraving.",
     sum_ar="ليزر CO2 صناعي مدمج بهيكل قوي ونظام دفع Leadshine لدقة عالية جداً في القص والحفر.")
prod(slug="1325-co2-laser-cutting-engraving-machine", cat="co2-machine", model="1325",
     en="1325 CO2 Laser Cutting & Engraving Machine", ar="مكينة ليزر CO2 مقاس 1325 للقص والحفر",
     sum_en="Full-sheet 1300 × 2500 mm CO2 laser with high energy-conversion efficiency and stable performance for production workshops.",
     sum_ar="ليزر CO2 بمقاس لوح كامل 1300 × 2500 مم بكفاءة تحويل طاقة عالية وأداء ثابت للورش الإنتاجية.",
     specs=[("Working area", "مساحة العمل", "1300 × 2500 mm")])
prod(slug="1390-co2-laser-cutting-engraving-machine", cat="co2-machine", model="1390",
     en="1390 CO2 Laser Cutting & Engraving Machine", ar="مكينة ليزر CO2 مقاس 1390",
     sum_en="Versatile 1300 × 900 mm CO2 laser with 80–180 W tube options.",
     sum_ar="ليزر CO2 متعدد الاستخدام بمقاس 1300 × 900 مم وأنابيب من 80 إلى 180 واط.",
     specs=[("Working area", "مساحة العمل", "1300 × 900 mm"), ("Tube power", "قدرة الأنبوب", "80 – 180 W")])

# ---- Marking
prod(slug="fiber-laser-marking-machine", cat="laser-marking-machine", model="Fiber Marker",
     en="Fiber Laser Marking Machine", ar="مكينة ماركينج ليزر فايبر",
     sum_en="Permanent, high-contrast marking on metals and plastics with zero consumables, using an ytterbium-doped fiber source.",
     sum_ar="حفر دائم وعالي الوضوح على المعادن والبلاستيك بدون مواد استهلاكية، بمصدر ليزر فايبر.")
prod(slug="lf20-30-50-fiber-marking-machine", cat="laser-marking-machine", model="LF20 / LF30 / LF50",
     en="LF20 / LF30 / LF50 Fiber Marking Machine", ar="مكينة ماركينج فايبر LF20 / LF30 / LF50",
     sum_en="20, 30 or 50 W fiber markers for serial numbers, logos, QR codes, tools and jewelry.",
     sum_ar="ماركينج فايبر بقدرة 20 أو 30 أو 50 واط للأرقام التسلسلية والشعارات وأكواد QR والعدد والمجوهرات.",
     specs=[("Laser power", "قدرة الليزر", "20 / 30 / 50 W")])

# ---- Bending
prod(slug="ad-r-series-cnc-press-brake", cat="banding-machine", model="AD-R Series",
     en="AD-R Series CNC Press Brake", ar="مكبس ثني CNC سلسلة AD-R",
     sum_en="CNC press brake perfectly equipped for sensitive bending — available as electro-hydraulic servo, hybrid or servo-electric.",
     sum_ar="مكبس ثني CNC مجهز للثني الدقيق — متوفر هيدروليك سيرفو أو هجين أو كهربائي سيرفو.")
prod(slug="mrb-s-series-roll-bending-machine", cat="banding-machine", model="MRB-S",
     en="MRB-S Series Roll Bending Machine", ar="مكينة درفلة سلسلة MRB-S",
     sum_en="Hydraulic roll adjustment for precise bending of thinner sheets with high pressure and pinpoint control.",
     sum_ar="ضبط هيدروليكي للدرافيل لثني دقيق للصاج الرقيق بضغط عالي وتحكم دقيق.")
prod(slug="pbm-series-profile-bending-machine", cat="banding-machine", model="PBM",
     en="PBM Series Profile Bending Machine", ar="مكينة ثني البروفايل سلسلة PBM",
     sum_en="Rugged steel frame machined after welding, with large shafts and bearings that minimize deflection — for tube, angle and beam bending.",
     sum_ar="هيكل حديد قوي مشغول بعد اللحام، مع أعمدة ورولمانات كبيرة تقلل الانحراف — لثني المواسير والزوايا والكمرات.")

# ---- Others
prod(slug="oxy-plasma-cutter", cat="plasma-cutting-machines", model="Oxy-Plasma",
     en="CNC Oxy-Plasma Cutter", ar="مكينة قص بلازما وأكسجين CNC",
     sum_en="Plasma and oxy-fuel cutting in one CNC gantry for structural steel and heavy plate.",
     sum_ar="قص بلازما وأكسجين في جسر CNC واحد للحديد الإنشائي والصاج الثقيل.")
prod(slug="storage-rack-corner-welding-robot-unit", cat="robotic-arm", model="Rack Welding Cell",
     en="Storage Rack Corner Welding Robot Unit", ar="وحدة روبوت لحام زوايا الرفوف",
     sum_en="Turnkey robotic cell for welding storage-rack corners with consistent quality and output.",
     sum_ar="خلية روبوت جاهزة للحام زوايا رفوف التخزين بجودة وإنتاجية ثابتة.")
prod(slug="hwashi-six-axis-welding-robot", cat="robotic-arm", model="HWASHI 6-Axis",
     en="HWASHI Six-Axis Welding Robot", ar="روبوت لحام HWASHI بستة محاور",
     sum_en="Six-axis industrial robot that pairs with MIG, TIG, aluminum or laser welding sources.",
     sum_ar="روبوت صناعي بستة محاور يعمل مع مصادر لحام MIG أو TIG أو ألمنيوم أو ليزر.")
prod(slug="cnc-3826a-glass-cutting-machine", cat="glass-machines", model="CNC-3826A",
     en="CNC-3826A Automatic Glass Cutting Machine", ar="مكينة قص زجاج أوتوماتيكية CNC-3826A",
     sum_en="Automatic glass loading, labeling, telescopic arm and CNC cutting integrated in one line.",
     sum_ar="تحميل زجاج أوتوماتيكي وترقيم وذراع تلسكوبي وقص CNC في خط واحد.")
prod(slug="1428-proline-cnc-router", cat="cnc-router-machines", model="1428 Proline",
     en="1428 Proline CNC Router with Auto Discharge", ar="راوتر CNC موديل 1428 Proline بتفريغ أوتوماتيكي",
     sum_en="Production CNC router with automatic discharge for panel processing and furniture manufacturing.",
     sum_ar="راوتر CNC إنتاجي مع تفريغ أوتوماتيكي لتشغيل الألواح وتصنيع الأثاث.")

# ---- Aluminum & uPVC window/door (real catalog photos + specs)
W = "aluminum-upvc-window-door-machines"
prod(slug="cgs-6500-integrated-intelligent-workstation", cat=W, model="CGS-6500", img="cgs-6500.webp",
     en="CGS-6500 Integrated Intelligent Workstation", ar="محطة العمل الذكية المتكاملة CGS-6500",
     sum_en="One machine does it all: drilling, slotting, cutting, corner protection, laser scribing, punching and label printing for frame, sash and mullion profiles — zero turnover, zero sorting.",
     sum_ar="مكينة وحدة تسوي كل شي: تخريم، تفريز، قص، حماية زوايا، تخطيط بالليزر، تثقيب وطباعة ملصقات لبروفايلات الحلق والضلفة والقاطع — بدون قلب ولا فرز.",
     features_en=["ERP real-time interconnection & barcode-driven processing", "Arbitrary-angle cutting −45° to +45°", "Laser drilling/scribing and spindle-linkage milling", "Automatic feeding and labeling"],
     features_ar=["ربط لحظي مع ERP ومعالجة بقراءة الباركود", "قص بأي زاوية من −45° إلى +45°", "تخريم وتخطيط بالليزر وتفريز بالسبندل", "تغذية وطباعة ملصقات أوتوماتيكية"],
     specs=[("Power supply", "الكهرباء", "380V / 50Hz"), ("Total power", "القدرة الكلية", "18.5 – 30 kW"), ("Blade", "المنشار", "Φ550 × Φ30 × 4.4, Z=120"), ("Profile width × height", "عرض × ارتفاع البروفايل", "120 × 155 mm"), ("Feeding length", "طول التغذية", "700 – 6500 mm"), ("Positioning accuracy", "دقة التموضع", "±0.1 mm"), ("Overall dimension", "الأبعاد", "15000 × 3000 × 2600 mm")])
prod(slug="cljzd-cnc-6600-cnc-cutting-center", cat=W, model="CLJZD-CNC-6600", img="cljzd-cnc-6600.webp",
     en="CLJZD-CNC-6600 CNC Cutting Center for Aluminum Profile", ar="مركز قص CNC للألمنيوم CLJZD-CNC-6600",
     sum_en="Fully enclosed CNC cutting center with barcode BOM scanning, ERP link, automatic feeding, label printing and ultra-short 180 mm cutting.",
     sum_ar="مركز قص CNC مغلق بالكامل مع قراءة قائمة المواد بالباركود وربط ERP وتغذية أوتوماتيكية وطباعة ملصقات وقص قطع قصيرة حتى 180 مم.",
     features_en=["HIWIN linear guides on X, Y, Z", "Imported motor directly coupled to the blade", "Spray cooling linked to the program"],
     features_ar=["مجاري HIWIN خطية على المحاور X و Y و Z", "موتور مستورد متصل مباشرة بالمنشار", "تبريد رذاذ مرتبط ببرنامج التشغيل"],
     specs=[("Cutting motor", "موتور القص", "3 × 3.0 kW"), ("Blade", "المنشار", "Φ500 × Φ30 × 4.4, 120T"), ("Cutting length", "طول القص", "180 – 6600 mm"), ("Cutting width / height", "عرض / ارتفاع القص", "30–150 / 30–150 mm"), ("Cutting angle", "زاوية القص", "45°, 90°, −45°"), ("Weight", "الوزن", "≈ 4000 kg")])
prod(slug="cljz2sj-550x4200-double-head-cutting-saw", cat=W, model="CLJZ2SJ-550×4200", img="cljz2sj-550x4200.webp",
     en="CLJZ2SJ-550×4200 Integrated Double-Head Precision Cutting Saw", ar="منشار قص دقيق برأسين CLJZ2SJ-550×4200",
     sum_en="NC double-head saw with ERP connectivity, automatic 45°/90° head switching, barcode label printing and material height measuring.",
     sum_ar="منشار برأسين بتحكم رقمي وربط ERP، تبديل زوايا 45°/90° أوتوماتيكي، طباعة ملصقات باركود وقياس ارتفاع الخامة.",
     specs=[("Cutting motor", "موتور القص", "2 × 3.0 kW, 2800 r/min"), ("Blade", "المنشار", "Φ550 × Φ30 × 4.4, Z=120"), ("Cutting length", "طول القص", "360 – 4200 mm"), ("Max section at 90°", "أقصى مقطع عند 90°", "180 × 200 mm"), ("Weight", "الوزن", "≈ 1850 kg")])
prod(slug="cljz2s-500x4200-cnc-double-head-cutting-saw", cat=W, model="CLJZ2S-500×4200", img="cljz2s-500x4200.webp",
     en="CLJZ2S-500×4200 CNC Double-Head Precision Cutting Saw", ar="منشار CNC دقيق برأسين CLJZ2S-500×4200",
     sum_en="Cuts aluminum curtain-wall, door, window and plastic profiles with rack-and-pinion head movement and carbide blades.",
     sum_ar="يقص بروفايلات الواجهات والأبواب والنوافذ والبلاستيك بحركة رأس بالجريدة المسننة وأسلحة كاربايد.",
     specs=[("Cutting motor", "موتور القص", "2 × 2.2 kW, 2800 r/min"), ("Blade", "المنشار", "Φ500 × Φ30 × 4.4, Z=120"), ("Cutting length", "طول القص", "360 – 4200 mm"), ("Max section at 90°", "أقصى مقطع عند 90°", "150 × 200 mm"), ("Weight", "الوزن", "≈ 1650 kg")])
prod(slug="clyt-cnc-350-glazing-bead-cutting-saw", cat=W, model="CLYT-CNC-350", img="clyt-cnc-350.webp",
     en="CLYT-CNC-350 Glazing Bead CNC Cutting Saw", ar="منشار CNC لقص الكعب (الجليزنج) CLYT-CNC-350",
     sum_en="90° precision cutting of aluminum glazing bead for mass production, with wireless handheld transmission and tool-life detection.",
     sum_ar="قص دقيق بزاوية 90° لكعب الزجاج الألمنيوم للإنتاج الكمي، مع جهاز إرسال يدوي لاسلكي ونظام مراقبة عمر السلاح.",
     specs=[("Cutting motor", "موتور القص", "1.5 kW"), ("Blade", "المنشار", "Φ350 × Φ30 × 3.2 mm"), ("Cutting width / height", "عرض / ارتفاع القص", "70 / 80 mm"), ("Weight", "الوزن", "≈ 500 kg")])
prod(slug="cljja-cnc-500-corner-connector-cutting-saw", cat=W, model="CLJJA-CNC-500", img="cljja-cnc-500.webp",
     en="CLJJA-CNC-500 CNC Corner Connector Cutting Saw", ar="منشار CNC لقص الزوايا (الكورنر) CLJJA-CNC-500",
     sum_en="Continuous cutting of 6 m corner-connector profiles in one clamping, servo + ball-screw positioning and PLC control.",
     sum_ar="قص متواصل لبروفايل الزوايا بطول 6 م في تثبيتة وحدة، بتموضع سيرفو وبول سكرو وتحكم PLC.",
     specs=[("Cutting motor", "موتور القص", "3.0 kW"), ("Blade", "المنشار", "Φ500 × Φ30 × 4.4, Z=120"), ("Cutting width / height", "عرض / ارتفاع القص", "140 / 140 mm"), ("Weight", "الوزن", "≈ 750 kg")])
prod(slug="clxfl-cnc-3000b-gantry-machining-center", cat=W, model="CLXFL-CNC-3000B", img="clxfl-cnc-3000b.webp",
     en="CLXFL-CNC-3000B Gantry 3-Axis CNC Machining Center (Enclosed)", ar="مركز تشغيل CNC ثلاثي المحاور CLXFL-CNC-3000B (مغلق)",
     sum_en="Enclosed gantry machining center for holes, wedge grooves and water slots on door, window and curtain-wall profiles.",
     sum_ar="مركز تشغيل جسري مغلق لتخريم الفتحات ومجاري الصرف والتفريز على بروفايلات الأبواب والنوافذ والواجهات.",
     specs=[("Spindle", "السبندل", "5.5 kW, 18000 r/min"), ("X travel", "مشوار X", "3000 mm"), ("Processing range", "نطاق التشغيل", "160 × 160 × 3200 mm"), ("Weight", "الوزن", "≈ 1200 kg")])
prod(slug="clxfl-cnc-3000-gantry-machining-center", cat=W, model="CLXFL-CNC-3000", img="clxfl-cnc-3000.webp",
     en="CLXFL-CNC-3000 Gantry 3-Axis CNC Machining Center", ar="مركز تشغيل CNC جسري CLXFL-CNC-3000",
     sum_en="Three-station tool magazine and a −90°/0°/+90° rotating table to mill holes on three faces in a single clamping.",
     sum_ar="مخزن عدة بثلاث محطات وطاولة دوارة −90°/0°/+90° لتفريز الفتحات على ثلاثة أوجه في تثبيتة وحدة.",
     specs=[("Spindle", "السبندل", "5.5 kW, 18000 r/min"), ("X / Y / Z travel", "مشوار X / Y / Z", "3000 / 450 / 400 mm"), ("Processing range", "نطاق التشغيل", "160 × 160 × 3200 mm"), ("Weight", "الوزن", "≈ 1000 kg")])
prod(slug="clxf-cnc-3000-high-speed-machining-center", cat=W, model="CLXF-CNC-3000", img="clxf-cnc-3000.webp",
     en="CLXF-CNC-3000 High-Speed CNC Machining Center", ar="مركز تشغيل CNC عالي السرعة CLXF-CNC-3000",
     sum_en="Automatic tool change with 6-station magazine, graphic library import and code-scanning operation — no skilled operator required.",
     sum_ar="تغيير عدة أوتوماتيكي بمخزن 6 محطات، استيراد مكتبة رسومات وتشغيل بقراءة الكود — ما يحتاج مشغّل محترف.",
     specs=[("Spindle", "السبندل", "5.5 kW, 18000 r/min"), ("X feed speed", "سرعة X", "0 – 97 m/min"), ("Processing range", "نطاق التشغيل", "140 × 140 × 3000 mm"), ("Weight", "الوزن", "≈ 1200 kg")])
prod(slug="clxfa-cnc-1200-drilling-milling-machine", cat=W, model="CLXFA-CNC-1200", img="clxfa-cnc-1200.webp",
     en="CLXFA-CNC-1200 CNC Drilling & Milling Machine", ar="مكينة تخريم وتفريز CNC موديل CLXFA-CNC-1200",
     sum_en="Compact CNC driller-miller for grooves, special-shaped and round holes on aluminum and plastic profiles.",
     sum_ar="مكينة تخريم وتفريز CNC مدمجة للمجاري والفتحات الدائرية والخاصة على بروفايلات الألمنيوم والبلاستيك.",
     specs=[("Spindle", "السبندل", "3.5 kW, 18000 r/min"), ("X travel", "مشوار X", "1200 mm"), ("Processing range", "نطاق التشغيل", "100 × 200 × 1000 mm"), ("Weight", "الوزن", "≈ 700 kg")])
prod(slug="cldx7a-cnc-350-7-axis-end-milling-machine", cat=W, model="CLDX7A-CNC-350", img="cldx7a-cnc-350.webp",
     en="CLDX7A-CNC-350 CNC 7-Axis End-Milling Machine", ar="مكينة تفريز أطراف CNC بسبعة محاور CLDX7A-CNC-350",
     sum_en="Seven-axis CNC end-milling for tenon and step faces of mullions with no manual intervention.",
     sum_ar="تفريز أطراف القواطع بسبعة محاور CNC بدون تدخل يدوي.",
     specs=[("Spindle", "السبندل", "3 × 3.0 kW"), ("Milling depth", "عمق التفريز", "75 mm"), ("Repeat accuracy", "دقة التكرار", "±0.02 mm"), ("Weight", "الوزن", "≈ 1200 kg")])
prod(slug="clm4xa-cnc-four-head-corner-crimping-line", cat=W, model="CLM4XA-CNC-100×2200×3000", img="clm4xa-cnc-100x2200x3000.webp",
     en="CLM4XA-CNC Four-Head Corner Crimping Production Line", ar="خط تجميع زوايا CNC بأربعة رؤوس CLM4XA-CNC",
     sum_en="Synchronous four-corner crimping on a continuous assembly line, with servo torque monitoring and barcode printing.",
     sum_ar="تجميع الزوايا الأربع في نفس الوقت على خط تجميع متواصل، مع مراقبة عزم السيرفو وطباعة باركود.",
     specs=[("Max frame", "أكبر إطار", "2200 × 3000 mm"), ("Min frame", "أصغر إطار", "750 × 550 mm"), ("Diagonal error", "خطأ القطر", "≤ 1 mm"), ("Weight", "الوزن", "≈ 3000 kg")])
prod(slug="clm4s-four-head-corner-combining-machine", cat=W, model="CLM4S-100×2500×3500", img="clm4s-100x2500x3500.webp",
     en="CLM4S CNC Four-Head Corner Combining Machine", ar="مكينة تجميع زوايا CNC بأربعة رؤوس CLM4S",
     sum_en="NC-controlled four-corner combining in one cycle, automatic pre-tightening and adjustable cutters for any profile.",
     sum_ar="تجميع الأربع زوايا في دورة وحدة بتحكم رقمي، شد مسبق أوتوماتيكي وسكاكين قابلة للضبط لأي بروفايل.",
     specs=[("Frame size", "مقاس الإطار", "480×480 – 2500×3500 mm"), ("Profile width", "عرض البروفايل", "93 mm"), ("Weight", "الوزن", "≈ 2500 kg")])
prod(slug="clzz6a-13-six-head-combination-drilling-machine", cat=W, model="CLZZ6A-13", img="clzz6a-13.webp",
     en="CLZZ6A-13 Six-Head Combination Drilling Machine", ar="مكينة تخريم مجمّعة بستة رؤوس CLZZ6A-13",
     sum_en="Drills curtain-wall and door/window profiles with six heads at once — customizable from 4 to 8 heads.",
     sum_ar="تخريم بروفايلات الواجهات والأبواب والنوافذ بستة رؤوس في نفس الوقت — قابلة للتخصيص من 4 إلى 8 رؤوس.",
     specs=[("Motor power", "قدرة الموتور", "6 × 1.5 kW"), ("Profile section", "مقطع البروفايل", "Max 250 × 250 mm"), ("Max hole distance", "أقصى مسافة بين الفتحات", "4850 mm"), ("Weight", "الوزن", "≈ 1350 kg")])
prod(slug="cjlzk-1800-double-head-hinge-drilling-machine", cat=W, model="CJLZK-1800", img="cjlzk-1800.webp",
     en="CJLZK-1800 Double-Head Hinge Drilling Machine", ar="مكينة تخريم مفصلات برأسين CJLZK-1800",
     sum_en="Efficient drilling of hinge mounting holes and sliding-support holes on aluminum windows and doors.",
     sum_ar="تخريم سريع لفتحات تركيب المفصلات والدعامات المنزلقة في نوافذ وأبواب الألمنيوم.",
     specs=[("Motor power", "قدرة الموتور", "2 × 1.5 kW"), ("Power drills", "عدد الدريلات", "8"), ("Process length", "طول التشغيل", "300 – 2000 mm"), ("Weight", "الوزن", "≈ 550 kg")])
prod(slug="awcl-200c-four-corner-welding-cleaning-line", cat=W, model="AWCL-200C", img="awcl-200c.webp",
     en="AWCL-200C Fully Automatic uPVC Four-Corner Welding & Cleaning Line", ar="خط لحام وتنظيف زوايا uPVC أوتوماتيكي بالكامل AWCL-200C",
     sum_en="Automatic line that welds all four corners and cleans them in sequence — the backbone of a high-output uPVC window factory.",
     sum_ar="خط أوتوماتيكي يلحم الأربع زوايا وينظفها بالتسلسل — العمود الفقري لمصنع نوافذ uPVC بإنتاج عالي.",
     specs=[("Welding unit power", "قدرة وحدة اللحام", "9.5 kW"), ("Cleaning unit power", "قدرة وحدة التنظيف", "10.5 kW"), ("Profile size", "مقاس البروفايل", "H 20–120, W ≤ 120 mm")])
prod(slug="cjdx-4-4500-seamless-welding-machine", cat=W, model="CJDX-4-4500", img="cjdx-4-4500.webp",
     en="CJDX-4-4500 European-Type Seamless Welding Machine for Colored PVC", ar="مكينة لحام بدون فواصل لبروفايل PVC الملوّن CJDX-4-4500",
     sum_en="High-grade four-head seamless welding for colored PVC profiles, switchable between seamless and standard welding.",
     sum_ar="لحام بأربعة رؤوس بدون فواصل لبروفايل PVC الملوّن، مع إمكانية التبديل بين اللحام بدون فواصل واللحام العادي.",
     specs=[("Input power", "القدرة", "4.5 kW"), ("Frame size", "مقاس الإطار", "450 – 4500 mm"), ("Profile size", "مقاس البروفايل", "H 20–120, W ≤ 120 mm"), ("Weight", "الوزن", "≈ 2200 kg")])
prod(slug="cshz4-120x4500-four-head-welding-machine", cat=W, model="CSHZ4-120×4500", img="cshz4-120x4500.webp",
     en="CSHZ4-120×4500 Four-Head Welding Machine for PVC Profile", ar="مكينة لحام PVC بأربعة رؤوس CSHZ4-120×4500",
     sum_en="Welds a full rectangular frame in one cycle — also available as three-head and two-head versions.",
     sum_ar="تلحم إطار كامل في دورة وحدة — متوفرة أيضاً بثلاثة رؤوس ورأسين.",
     specs=[("Input power", "القدرة", "4.5 kW"), ("Frame size", "مقاس الإطار", "400 – 4500 mm"), ("Weight", "الوزن", "≈ 1500 kg")])
prod(slug="csjmc03-4-6000-cnc-cutting-center-pvc", cat=W, model="CSJMC03-4-6000", img="csjmc03-4-6000.webp",
     en="CSJMC03-4-6000 CNC Cutting Center for PVC Profile", ar="مركز قص CNC لبروفايل PVC موديل CSJMC03-4-6000",
     sum_en="Combined V-notch and length cutting with optimized nesting — up to four profiles at once.",
     sum_ar="قص الطول وقص V في نفس الوقت مع تحسين توزيع القطع — حتى أربع بروفايلات مرة وحدة.",
     specs=[("Input power", "القدرة", "12.5 kW"), ("Cutting length", "طول القص", "300 – 3000 mm"), ("Cutting quantity", "عدد القطع", "Max 120 mm (4 pcs)"), ("Weight", "الوزن", "≈ 3000 kg")])
prod(slug="csqjb-cnc-120-corner-cleaning-machine", cat=W, model="CSQJB-CNC-120", img="csqjb-cnc-120.webp",
     en="CSQJB-CNC-120 CNC Corner Cleaning Machine for PVC Windows", ar="مكينة تنظيف زوايا CNC لنوافذ PVC موديل CSQJB-CNC-120",
     sum_en="Two-axis NC corner cleaner storing many profile programs — clean, accurate weld seams in one pass.",
     sum_ar="منظّف زوايا بتحكم رقمي ثنائي المحاور يخزن برامج بروفايلات متعددة — خط لحام نظيف ودقيق بمرور واحد.",
     specs=[("Profile height", "ارتفاع البروفايل", "30 – 120 mm"), ("Profile width", "عرض البروفايل", "20 – 120 mm"), ("Weight", "الوزن", "≈ 750 kg")])

PRODUCTS = P

FEATURED = [
    "cgs-6500-integrated-intelligent-workstation",
    "lf3015ln-fiber-laser-cutting-machine",
    "cljzd-cnc-6600-cnc-cutting-center",
    "whole-cover-fiber-laser-cutting-machine",
    "cljz2sj-550x4200-double-head-cutting-saw",
    "lf60ms-three-chuck-zero-remains",
    "clm4s-four-head-corner-combining-machine",
    "lg900n-co2-laser-cutting-machine",
]

# ---------------------------------------------------------------- cities
CITIES = [
    ("riyadh", "Riyadh", "الرياض", "the Kingdom's largest industrial hub — from the 2nd and 3rd Industrial Cities to the giga-project supply chains around Riyadh Metro", "أكبر مركز صناعي في المملكة — من المدينة الصناعية الثانية والثالثة إلى سلاسل توريد المشاريع الكبرى"),
    ("jeddah", "Jeddah", "جدة", "our head office in Sharafiya, serving Jeddah's industrial cities, signage, aluminum and furniture workshops", "مقرنا الرئيسي في الشرفية، نخدم المدن الصناعية في جدة ومحلات الدعاية وورش الألمنيوم والأثاث"),
    ("makkah", "Makkah", "مكة المكرمة", "aluminum, signage and construction fabricators supporting the city's continuous development projects", "مصانع الألمنيوم والدعاية والإنشاءات اللي تخدم مشاريع التطوير المستمرة في مكة"),
    ("madinah", "Madinah", "المدينة المنورة", "workshops and factories in Madinah's industrial area and hospitality-driven construction", "الورش والمصانع في المنطقة الصناعية بالمدينة ومشاريع البناء المرتبطة بالضيافة"),
    ("dammam", "Dammam", "الدمام", "the Eastern Province's heavy fabrication base, with our support team on the ground for installation and training", "قاعدة التصنيع الثقيل في المنطقة الشرقية، مع فريق دعم ميداني للتركيب والتدريب"),
    ("khobar", "Al Khobar", "الخبر", "steel, oil-and-gas service and HVAC fabricators across Al Khobar", "مصانع الحديد وخدمات النفط والغاز والتكييف في الخبر"),
    ("dhahran", "Dhahran", "الظهران", "precision fabrication for energy-sector suppliers around Dhahran", "تصنيع دقيق لموردي قطاع الطاقة في الظهران"),
    ("jubail", "Jubail", "الجبيل", "heavy-industry contractors and maintenance shops in Jubail Industrial City", "مقاولي الصناعات الثقيلة وورش الصيانة في مدينة الجبيل الصناعية"),
    ("taif", "Taif", "الطائف", "aluminum, carpentry and signage workshops across Taif", "ورش الألمنيوم والنجارة والدعاية في الطائف"),
    ("tabuk", "Tabuk", "تبوك", "growing fabrication demand linked to NEOM and northern-region projects", "الطلب المتزايد على التصنيع المرتبط بنيوم ومشاريع المنطقة الشمالية"),
    ("buraydah", "Buraydah", "بريدة", "Qassim's metal, agricultural-equipment and furniture manufacturers", "مصانع المعادن والمعدات الزراعية والأثاث في القصيم"),
    ("abha", "Abha", "أبها", "aluminum, signage and construction workshops across the Asir region", "ورش الألمنيوم والدعاية والإنشاءات في منطقة عسير"),
]

# ---------------------------------------------------------------- why us / industries / faq
WHY = [
    ("Engineer-led selection", "اختيار بإشراف مهندسين", "Our engineers size the machine to your materials, thickness and output — not to a sales target.", "مهندسينا يحددون المكينة حسب خاماتك وسماكاتك وإنتاجك — مو حسب هدف مبيعات."),
    ("Installation & training", "تركيب وتدريب", "On-site installation, commissioning and operator training anywhere in the Kingdom.", "تركيب وتشغيل وتدريب المشغّلين في موقعك بأي مكان في المملكة."),
    ("24/7 support", "دعم فني 24/7", "A dedicated support team to resolve issues fast and keep downtime minimal.", "فريق دعم مخصص يحل المشاكل بسرعة ويقلل التوقف لأقل حد."),
    ("Local spare parts", "قطع غيار محلية", "Large local stock of consumables and critical parts — dispatched fast.", "مخزون محلي كبير للمستهلكات والقطع الأساسية — وشحن سريع."),
    ("Certified quality", "جودة معتمدة", "CE, ISO 9001 and FDA certified machines; 90%+ components from known international brands.", "مكائن معتمدة CE و ISO 9001 و FDA، وأكثر من 90% من المكونات من ماركات عالمية معروفة."),
    ("Since 2006", "منذ 2006", "Nearly two decades supplying Saudi industry, with offices in Riyadh, Jeddah and Dammam.", "قرابة عشرين سنة نخدم الصناعة السعودية، بمكاتب في الرياض وجدة والدمام."),
]

INDUSTRIES = [
    ("Metal fabrication", "تشكيل المعادن"), ("Aluminum & uPVC windows", "نوافذ الألمنيوم و uPVC"),
    ("Signage & advertising", "الدعاية والإعلان"), ("Furniture & woodworking", "الأثاث والنجارة"),
    ("Kitchen & HVAC equipment", "معدات المطابخ والتكييف"), ("Construction & giga-projects", "الإنشاءات والمشاريع الكبرى"),
    ("Oil, gas & energy", "النفط والغاز والطاقة"), ("Gifts & jewelry", "الهدايا والمجوهرات"),
]

FAQ = [
    ("How much does a fiber laser cutting machine cost in Saudi Arabia?", "كم سعر مكينة ليزر فايبر في السعودية؟",
     "Price depends mainly on laser power (1–20 kW), bed size, enclosure and automation such as exchange tables. Send us your material, thickness and monthly output and we'll quote the right configuration within one working day.",
     "السعر يعتمد أساساً على قدرة الليزر (من 1 إلى 20 كيلوواط)، ومقاس الطاولة، والهيكل المغلق، والأتمتة مثل طاولة التبديل. أرسل لنا نوع الخامة والسماكة والإنتاج الشهري ونعطيك عرض سعر للمواصفات المناسبة خلال يوم عمل."),
    ("Do you provide installation and training?", "هل توفرون التركيب والتدريب؟",
     "Yes. Every machine includes on-site installation, commissioning and operator training by our engineers, anywhere in the Kingdom.",
     "نعم. كل مكينة تشمل التركيب والتشغيل وتدريب المشغّلين في موقعك على يد مهندسينا، بأي مكان في المملكة."),
    ("Which cities do you cover?", "وش المدن اللي تغطونها؟",
     "All of Saudi Arabia — Riyadh, Jeddah, Makkah, Madinah, Dammam, Al Khobar, Dhahran, Jubail, Taif, Tabuk, Buraydah, Abha and beyond — plus GCC export.",
     "كل مناطق المملكة — الرياض، جدة، مكة، المدينة، الدمام، الخبر، الظهران، الجبيل، الطائف، تبوك، بريدة، أبها وغيرها — مع التصدير لدول الخليج."),
    ("Are spare parts available locally?", "هل قطع الغيار متوفرة محلياً؟",
     "Yes. We keep a large local stock of consumables (nozzles, lenses, protective windows) and critical spares, dispatched fast to minimize downtime.",
     "نعم. عندنا مخزون محلي كبير للمستهلكات (نوزلات، عدسات، زجاج حماية) والقطع الأساسية، ونشحنها بسرعة عشان نقلل التوقف."),
    ("Do you supply complete aluminum and uPVC window production lines?", "هل توفرون خطوط إنتاج كاملة لنوافذ الألمنيوم و uPVC؟",
     "Yes — from double-head saws and CNC machining centers to corner crimping, seamless welding and corner cleaning. Download our catalog or ask for a line layout.",
     "نعم — من المناشير برأسين ومراكز التشغيل CNC إلى تجميع الزوايا واللحام بدون فواصل وتنظيف الزوايا. حمّل الكتالوج أو اطلب تصميم خط إنتاج."),
    ("Are your machines certified?", "هل مكائنكم معتمدة؟",
     "Our machines carry CE certification, and our quality system is ISO 9001 certified, with FDA certification on applicable laser products.",
     "مكائننا حاصلة على شهادة CE، ونظام الجودة معتمد ISO 9001، مع شهادة FDA لمنتجات الليزر المعنية."),
]
