# موقع Robotech CNC الجديد

موقع ثابت (Static) سريع وثنائي اللغة (إنجليزي على `/` وعربي على `/ar/`)، ومبني على تحسين محركات البحث (SEO).

## الهيكل
| الملف | وظيفته |
|---|---|
| `content.py` | **كل المحتوى**: المنتجات، الفئات، المدن، الأسئلة الشائعة، بيانات التواصل. تعدّل هنا فقط. |
| `build.py` | يولّد الموقع كامل في `public/` |
| `static/` | التصميم (CSS)، السكربت (JS)، الصور |
| `public/` | **الموقع الجاهز للرفع**. لا تعدّل فيه يدوياً |

## التعديل وإعادة البناء
```bash
python3 build.py
```

## إضافة صورة لمنتج
1. احفظ الصورة في `static/img/products/` (يفضّل WebP بمقاس 1200×900).
2. في `content.py` أضف `img="اسم-الصورة.webp"` لنفس المنتج.
3. شغّل `python3 build.py`.

المنتجات اللي ما لها صورة تظهر بتصميم بديل (خلفية داكنة مع رقم الموديل) لين تضيف صورتها.

## النشر (مجاني): Cloudflare Pages
1. ارفع المستودع على GitHub (موجود حالياً).
2. Cloudflare → Workers & Pages → Create → Pages → اربط المستودع.
3. Build command: `python3 build.py` ، Output directory: `robotech-website/public` ، Root: `robotech-website`.
4. Custom domains → أضف `robotechcnc.com` و `www.robotechcnc.com`.

ملف `_redirects` يحوّل روابط الموقع القديم (WordPress) تحويل 301، عشان ما تضيع ترتيباتك في Google. ولو استخدمت Vercel بدال Cloudflare، فيه ملف `vercel.json` بنفس التحويلات.

## بعد النشر (مهم للـSEO)
- Google Search Console: أضف الموقع، وأرسل `https://robotechcnc.com/sitemap.xml`.
- Google Business Profile: تأكد إن رابط الموقع ورقم الجوال يطابقون الموقع.
- اربط Google Analytics 4 (الموقع يرسل مسبقاً أحداث `generate_lead` و `contact_click` إذا كان `gtag` موجود).
