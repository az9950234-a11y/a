# هكتار | رفع المقاسات

تطبيق ويب خاص لشركة هكتار الحديثة: مشروع جديد ← تصوير الجدار ← المقاسات والمواد ← حفظ ← الجدار اللي بعده ← إقفال المشروع ← تقرير PDF احترافي.

**مجاني بالكامل وما يتوقف:** يشتغل على Google Apps Script، والصور والتقارير تنحفظ في Google Drive حقك (15GB مجاناً). الدخول بحساب Google حقك فقط، وما أحد غيرك يقدر يفتحه.

## وين تنحفظ البيانات
```
📁 هكتار - رفع المقاسات/          ← في Drive حقك
   📊 هكتار - قاعدة البيانات       ← جدول بكل المشاريع والجدران
   📁 فيلا العليا – المجلس/        ← مجلد لكل مشروع
       🖼 جدار التلفزيون.jpg
       📄 MH-2026-XXXX فيلا العليا.pdf
```
تقدر تفتح أي صورة أو تقرير من تطبيق Drive مباشرة، وترسله للعميل من هناك.

## التركيب (10 دقائق، مرة وحدة)

1. ادخل https://script.google.com بحساب Google حقك واضغط **New project** (مشروع جديد)، وسمّه `هكتار - رفع المقاسات`.
2. من ⚙️ **Project Settings** فعّل **Show "appsscript.json" manifest file in editor**.
3. أنشئ الملفات وانسخ محتواها من هذا المجلد. لملفات HTML استخدم **+ ← HTML** واكتب الاسم بدون `.html`:

   | الملف في المحرر | انسخ من |
   |---|---|
   | `Code.gs` (موجود) | `Code.gs` |
   | `appsscript.json` | `appsscript.json` |
   | `index` | `index.html` |
   | `styles` | `styles.html` |
   | `app` | `app.html` |
   | `assets` | `assets.html` |

4. اضغط **Deploy ← New deployment ← ⚙️ Web app**:
   - **Execute as:** Me
   - **Who has access:** Only myself
5. اضغط **Deploy** ووافق على الصلاحيات. Google بيعرض تحذير "unverified app" لأنه تطبيقك الخاص: اضغط **Advanced ← Go to … (unsafe)**.
6. بيطلع لك رابط ينتهي بـ `/exec`. افتحه في جوالك (وأنت مسجّل بنفس حساب Google)، ومن قائمة المشاركة اختر **إضافة إلى الشاشة الرئيسية**.

## التحديث بعد أي تعديل
انسخ الملفات المعدّلة إلى المحرر، ثم **Deploy ← Manage deployments ← ✏️ ← Version: New version ← Deploy**. الرابط يبقى نفسه.

**اختياري للمطورين:** تقدر تستخدم [clasp](https://github.com/google/clasp) بدل النسخ اليدوي: `npx @google/clasp login` ثم `clasp clone <scriptId>` داخل هذا المجلد، وبعدها `clasp push`.

## ملاحظات
- جوجل يعرض شريط صغير أعلى الصفحة ("This application was created by a Google Apps Script user"). هذا طبيعي في الحسابات المجانية.
- كل حفظ ياخذ ثانية إلى ثانيتين لأن الصور تترفع لـ Drive.
- الحذف ينقل الملفات لسلة المهملات في Drive، فتقدر تسترجعها خلال 30 يوم.
- الشعارات مضمّنة في `assets.html`. إذا غيّرت الشعار في `assets/` شغّل `python3 tools/build_assets.py`.
