"use strict";

const BUCKET = "photos";
const DEFAULT_MATERIALS = ["بديل خشب", "بديل رخام", "بديل شيبورد", "جبس بورد", "دهان", "ورق جدران"];
const MAX_IMG = 1600;
const COMPANY = { ar: "شركة هكتار الحديثة", en: "MODERN HECTAR COMPANY" };

const cfg = window.APP_CONFIG || {};
const view = document.getElementById("view");
const sb = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY
  ? supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
  : null;
let user = null;
let listFilter = "all";

/* ---------- icons ---------- */
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  back: '<path d="M9 6l6 6-6 6"/>',
  chev: '<path d="M15 6l-6 6 6 6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  wall: '<path d="M3 5h18v14H3zM3 10h18M3 15h18M9 5v5M15 10v5M9 15v4"/>',
  area: '<path d="M4 4h16v16H4z"/><path d="M4 9h4M4 14h2M9 4v4M14 4v2"/>',
  file: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
  trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  ruler: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
};
const ic = (n, cls = "") => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (n) => Number(n || 0).toLocaleString("en", { maximumFractionDigits: 2 });
const areaM2 = (w) => (w.width_cm && w.height_cm ? (w.width_cm * w.height_cm) / 10000 : 0);
const dims = (w) => (w.width_cm || w.height_cm ? `${num(w.width_cm)} × ${num(w.height_cm)}` : "—");
const code = (i) => `W-${String(i + 1).padStart(2, "0")}`;
const reportNo = (p) => `MH-${new Date(p.created_at).getFullYear()}-${p.id.slice(0, 4).toUpperCase()}`;
const dateAr = (d) => new Date(d).toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", { year: "numeric", month: "long", day: "numeric" });
const go = (hash) => { location.hash = hash; };

function toast(msg, ms = 2600) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.hidden = true), ms);
}

function busy(msg) {
  const el = document.createElement("div");
  el.className = "overlay";
  el.innerHTML = `<div><img src="assets/mark-white.png" alt=""><div class="msg">${esc(msg)}</div><div class="progress"><i></i></div></div>`;
  document.body.appendChild(el);
  return { set: (m) => (el.querySelector(".msg").textContent = m), done: () => el.remove() };
}

function fail(err) {
  console.error(err);
  toast("حدث خطأ: " + (err?.message || err), 4000);
}

function customMaterials() {
  try { return JSON.parse(localStorage.getItem("customMaterials") || "[]"); } catch { return []; }
}
function saveCustomMaterial(m) {
  try {
    const list = customMaterials();
    if (!list.includes(m)) localStorage.setItem("customMaterials", JSON.stringify([...list, m]));
  } catch { /* storage unavailable */ }
}

// Resize + compress a camera photo before upload (phones produce 4–8 MB images)
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, MAX_IMG / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("تعذر ضغط الصورة"))), "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("تعذر قراءة الصورة")); };
    img.src = url;
  });
}

async function signedUrls(paths) {
  const list = [...new Set(paths.filter(Boolean))];
  if (!list.length) return {};
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(list, 3600);
  if (error) throw error;
  return Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
}

const blobToDataUrl = (blob) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(blob);
});

const imgSize = (src) => new Promise((res) => {
  const i = new Image();
  i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight });
  i.onerror = () => res({ w: 4, h: 3 });
  i.src = src;
});

function materialTotals(walls) {
  const totals = {};
  for (const w of walls) for (const m of w.materials || []) totals[m] = (totals[m] || 0) + areaM2(w);
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

const statusPill = (p) => p.status === "closed"
  ? `<span class="pill pill-closed">مقفل</span>`
  : `<span class="pill pill-open">قيد الرفع</span>`;

/* ---------- router ---------- */
async function route() {
  window.scrollTo(0, 0);
  if (!sb) return renderSetup();
  if (!user) return renderLogin();
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  try {
    if (parts[0] === "new") return renderNewProject();
    if (parts[0] === "p" && parts[1] && parts[2] === "wall") return await renderWallForm(parts[1], parts[3] === "new" ? null : parts[3]);
    if (parts[0] === "p" && parts[1]) return await renderProject(parts[1]);
    return await renderProjects();
  } catch (e) { fail(e); }
}

function renderSetup() {
  view.innerHTML = `<div class="setup"><div class="empty"><div class="em-ico">${ic("shield")}</div>
    <b>التطبيق غير مربوط بقاعدة البيانات</b>أضف SUPABASE_URL و SUPABASE_ANON_KEY في ملف config.js</div></div>`;
}

/* ---------- login ---------- */
function renderLogin() {
  view.innerHTML = `
    <section class="login">
      <div class="brand"><img src="assets/logo-white.png" alt="${COMPANY.ar}"></div>
      <form class="panel form" id="f">
        <div><h2>تسجيل الدخول</h2><p class="lead">بوابة رفع المقاسات الخاصة</p></div>
        <label class="field"><span>البريد الإلكتروني</span>
          <div class="input-icon">${ic("user")}<input class="input ltr" type="email" name="email" autocomplete="username" required></div></label>
        <label class="field"><span>كلمة المرور</span>
          <div class="input-icon">${ic("lock")}<input class="input ltr" type="password" name="password" autocomplete="current-password" required></div></label>
        <button class="btn btn-primary btn-block">دخول</button>
        <div class="secure">${ic("shield", "ico-sm")} وصول خاص ومشفّر</div>
      </form>
    </section>`;
  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector("button");
    btn.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: fd.get("email"), password: fd.get("password") });
    btn.disabled = false;
    if (error) toast("بيانات الدخول غير صحيحة");
  };
}

/* ---------- projects list ---------- */
async function renderProjects() {
  const { data: projects, error } = await sb
    .from("projects")
    .select("*, walls(photo_path, width_cm, height_cm, created_at)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  for (const p of projects) {
    p.walls.sort((a, b) => a.created_at.localeCompare(b.created_at));
    p.area = p.walls.reduce((s, w) => s + areaM2(w), 0);
    p.cover = p.walls.find((w) => w.photo_path)?.photo_path;
  }
  const covers = await signedUrls(projects.map((p) => p.cover));
  const open = projects.filter((p) => p.status !== "closed").length;
  const totalArea = projects.reduce((s, p) => s + p.area, 0);

  const card = (p) => `
    <a class="card pcard" href="#/p/${p.id}" data-status="${p.status}" data-q="${esc([p.name, p.client, p.location].join(" ").toLowerCase())}">
      <div class="thumb">${covers[p.cover] ? `<img src="${covers[p.cover]}" alt="" loading="lazy">` : `<img class="ph" src="assets/mark-white.png" alt="">`}</div>
      <div class="body">
        <div class="name">${esc(p.name)}</div>
        <div class="meta">${esc([p.client, p.location].filter(Boolean).join(" · ") || dateAr(p.created_at))}</div>
        <div class="facts">
          <span>${ic("wall", "ico-sm")} ${p.walls.length}</span>
          <span>${ic("area", "ico-sm")} <span class="num">${num(p.area)} m²</span></span>
          ${statusPill(p)}
        </div>
      </div>
      <span class="chev">${ic("chev")}</span>
    </a>`;

  view.innerHTML = `
    <header class="hero" style="padding-bottom:44px">
      <div class="hero-bar">
        <div class="hero-brand"><img src="assets/mark-white.png" alt=""><div><div class="t">${COMPANY.ar}</div><div class="s">MEASUREMENTS</div></div></div>
        <button class="icon-btn" id="logout" aria-label="خروج">${ic("logout")}</button>
      </div>
      <div class="eyebrow">لوحة المشاريع</div>
      <h1>رفع المقاسات</h1>
      <div class="kpis">
        <div class="kpi"><div class="v">${projects.length}</div><div class="l">إجمالي المشاريع</div></div>
        <div class="kpi"><div class="v">${open}</div><div class="l">قيد الرفع</div></div>
        <div class="kpi"><div class="v num">${num(Math.round(totalArea))}<small>m²</small></div><div class="l">مساحة مرفوعة</div></div>
      </div>
    </header>
    <label class="search">${ic("search")}<input type="search" id="q" placeholder="ابحث بالمشروع، العميل أو الموقع"></label>
    <div class="segment" id="seg">
      <button data-f="all">الكل</button><button data-f="open">قيد الرفع</button><button data-f="closed">مقفلة</button>
    </div>
    <div class="plist" id="list">${projects.map(card).join("")}</div>
    <div class="empty" id="empty" hidden><div class="em-ico">${ic("ruler")}</div><b>${projects.length ? "لا توجد نتائج" : "ابدأ أول مشروع"}</b>${projects.length ? "جرّب كلمة بحث أخرى" : "أنشئ مشروعاً وصوّر أول جدار خلال ثوانٍ"}</div>
    <div class="actionbar"><div class="inner"><a class="btn btn-primary" href="#/new">${ic("plus")} مشروع جديد</a></div></div>`;

  document.getElementById("logout").onclick = () => { if (confirm("تسجيل الخروج؟")) sb.auth.signOut(); };
  const q = document.getElementById("q");
  const seg = document.getElementById("seg");
  const apply = () => {
    const v = q.value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll("#list .pcard").forEach((el) => {
      const ok = el.dataset.q.includes(v) && (listFilter === "all" || el.dataset.status === listFilter);
      el.hidden = !ok;
      if (ok) shown++;
    });
    seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.f === listFilter));
    document.getElementById("empty").hidden = shown > 0;
  };
  q.oninput = apply;
  seg.onclick = (e) => { if (e.target.dataset.f) { listFilter = e.target.dataset.f; apply(); } };
  apply();
}

function renderNewProject() {
  view.innerHTML = `
    <header class="hero" style="padding-bottom:40px">
      <div class="hero-bar"><a class="icon-btn" href="#/" aria-label="رجوع">${ic("back")}</a><img src="assets/mark-white.png" alt="" style="width:30px"></div>
      <div class="eyebrow">مشروع جديد</div>
      <h1>بيانات المشروع</h1>
      <div class="sub">بعد الإنشاء تفتح الكاميرا مباشرة لتصوير أول جدار</div>
    </header>
    <form class="sheet form" id="f">
      <label class="field"><span>اسم المشروع *</span><input class="input" type="text" name="name" required placeholder="مثال: فيلا العليا – المجلس الرئيسي"></label>
      <label class="field"><span>العميل</span><div class="input-icon">${ic("user")}<input class="input" type="text" name="client" placeholder="اسم العميل"></div></label>
      <label class="field"><span>الموقع</span><div class="input-icon">${ic("pin")}<input class="input" type="text" name="location" placeholder="الحي / المدينة"></div></label>
      <div class="actionbar"><div class="inner"><button class="btn btn-primary">${ic("camera")} إنشاء والبدء بالتصوير</button></div></div>
    </form>`;
  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { data, error } = await sb.from("projects").insert({
      name: fd.get("name").trim(),
      client: fd.get("client").trim() || null,
      location: fd.get("location").trim() || null,
    }).select().single();
    if (error) return fail(error);
    history.replaceState(null, "", `#/p/${data.id}`);
    go(`#/p/${data.id}/wall/new`);
  };
}

/* ---------- project detail ---------- */
async function loadProject(id) {
  const [{ data: project, error: e1 }, { data: walls, error: e2 }] = await Promise.all([
    sb.from("projects").select("*").eq("id", id).single(),
    sb.from("walls").select("*").eq("project_id", id).order("created_at"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return { project, walls };
}

async function renderProject(id) {
  const { project: p, walls } = await loadProject(id);
  const urls = await signedUrls(walls.map((w) => w.photo_path));
  const total = walls.reduce((s, w) => s + areaM2(w), 0);
  const closed = p.status === "closed";
  const mats = materialTotals(walls);
  const maxMat = mats[0]?.[1] || 1;

  view.innerHTML = `
    <header class="hero">
      <div class="hero-bar"><a class="icon-btn" href="#/" aria-label="المشاريع">${ic("back")}</a>${statusPill(p)}</div>
      <div class="eyebrow num" style="text-align:right">${reportNo(p)}</div>
      <h1>${esc(p.name)}</h1>
      <div class="sub">
        ${p.client ? `<span>${ic("user", "ico-sm")} ${esc(p.client)}</span>` : ""}
        ${p.location ? `<span>${ic("pin", "ico-sm")} ${esc(p.location)}</span>` : ""}
        <span>${ic("calendar", "ico-sm")} ${dateAr(p.created_at)}</span>
      </div>
      <div class="kpis">
        <div class="kpi"><div class="v">${walls.length}</div><div class="l">جدار</div></div>
        <div class="kpi"><div class="v num">${num(total)}<small>m²</small></div><div class="l">إجمالي المساحة</div></div>
        <div class="kpi"><div class="v">${mats.length}</div><div class="l">مواد</div></div>
      </div>
    </header>

    ${mats.length ? `
    <section class="section">
      <div class="section-title"><h2>الكميات حسب المادة</h2></div>
      <div class="card mats">
        ${mats.map(([m, a]) => `<div class="mat"><div class="row"><span>${esc(m)}</span><b class="num">${num(a)} m²</b></div><div class="bar"><i style="width:${(a / maxMat) * 100}%"></i></div></div>`).join("")}
      </div>
    </section>` : ""}

    <section class="section">
      <div class="section-title"><h2>الجدران</h2><span class="count">${walls.length} جدار</span></div>
      ${walls.length ? `<div class="wlist">
        ${walls.map((w, i) => `
          <a class="card wcard" href="${closed ? (urls[w.photo_path] || "#") : `#/p/${p.id}/wall/${w.id}`}" ${closed ? 'target="_blank" rel="noopener"' : ""}>
            <div class="photo">${urls[w.photo_path] ? `<img src="${urls[w.photo_path]}" alt="" loading="lazy">` : ic("camera")}<span class="code">${code(i)}</span></div>
            <div class="body">
              <div class="name">${esc(w.name)}</div>
              <div class="dims num" style="text-align:right">${dims(w)} <small>cm</small></div>
              ${w.materials?.length ? `<div class="tags">${w.materials.map((m) => `<span class="tag">${esc(m)}</span>`).join("")}</div>` : ""}
            </div>
            <div class="area"><b class="num">${num(areaM2(w))}</b><span>m²</span></div>
          </a>`).join("")}
      </div>` : `<div class="card empty"><div class="em-ico">${ic("camera")}</div><b>لا توجد جدران بعد</b>اضغط «إضافة جدار» وابدأ التصوير</div>`}
    </section>

    <div class="footer-actions">
      ${closed ? `<button class="btn btn-text" id="reopen">${ic("unlock", "ico-sm")} إعادة فتح المشروع</button>` : ""}
      <button class="btn btn-text btn-danger" id="del">${ic("trash", "ico-sm")} حذف المشروع</button>
    </div>

    <div class="actionbar"><div class="inner">
      ${closed
        ? `<button class="btn btn-primary grow" id="pdf">${ic("download")} تحميل التقرير PDF</button><button class="btn" id="regen" aria-label="إعادة إصدار">${ic("refresh")}</button>`
        : `<button class="btn btn-primary grow" id="add">${ic("camera")} إضافة جدار</button>${walls.length ? `<button class="btn btn-accent" id="close">${ic("lock")} إقفال</button>` : ""}`}
    </div></div>`;

  const on = (sel, fn) => { const el = document.getElementById(sel); if (el) el.onclick = fn; };
  on("add", () => go(`#/p/${p.id}/wall/new`));
  on("close", () => { if (confirm("إقفال المشروع وإصدار التقرير PDF؟")) closeProject(p, walls); });
  on("regen", () => { if (confirm("إعادة إصدار التقرير؟")) closeProject(p, walls); });
  on("pdf", () => downloadPdf(p));
  on("reopen", async () => {
    const { error } = await sb.from("projects").update({ status: "open" }).eq("id", p.id);
    if (error) return fail(error);
    route();
  });
  on("del", () => deleteProject(p));
}

async function deleteProject(p) {
  if (!confirm(`حذف «${p.name}» نهائياً مع كل الصور والتقرير؟`)) return;
  const b = busy("جاري الحذف…");
  try {
    const folder = `${user.id}/${p.id}`;
    const { data: files } = await sb.storage.from(BUCKET).list(folder, { limit: 1000 });
    if (files?.length) await sb.storage.from(BUCKET).remove(files.map((f) => `${folder}/${f.name}`));
    const { error } = await sb.from("projects").delete().eq("id", p.id);
    if (error) throw error;
    go("#/");
  } catch (e) { fail(e); } finally { b.done(); }
}

/* ---------- wall form ---------- */
async function renderWallForm(projectId, wallId) {
  const { project, walls } = await loadProject(projectId);
  const wall = wallId ? walls.find((w) => w.id === wallId) : null;
  if (wallId && !wall) return go(`#/p/${projectId}`);
  const idx = wall ? walls.indexOf(wall) : walls.length;
  const urls = wall?.photo_path ? await signedUrls([wall.photo_path]) : {};
  const selected = new Set(wall?.materials || []);
  const options = [...new Set([...DEFAULT_MATERIALS, ...customMaterials(), ...selected])];
  const photoUrl = urls[wall?.photo_path];
  let photoBlob = null;

  view.innerHTML = `
    <label class="capture" id="cap">
      <input type="file" accept="image/*" capture="environment" id="cam">
      <div class="topbar">
        <a class="icon-btn" href="#/p/${projectId}" aria-label="رجوع">${ic("back")}</a>
        ${wall ? `<button type="button" class="icon-btn" id="delw" aria-label="حذف">${ic("trash")}</button>` : ""}
      </div>
      ${photoUrl ? `<img src="${photoUrl}" alt="">` : `<div class="empty-cam"><div><div class="cam-btn">${ic("camera")}</div>اضغط لتصوير الجدار</div></div>`}
      <div class="dim dim-w" id="dw" hidden><span class="lab"></span></div>
      <div class="dim dim-h" id="dh" hidden><span class="lab"></span></div>
      <span class="retake" id="retake" ${photoUrl ? "" : "hidden"}>${ic("camera", "ico-sm")} إعادة التصوير</span>
    </label>

    <form class="sheet form" id="f">
      <div style="display:flex;align-items:center;gap:10px">
        <span class="code" style="background:var(--navy);color:#fff;border-radius:8px;padding:4px 9px">${code(idx)}</span>
        <input class="input" type="text" name="name" value="${esc(wall?.name || `جدار ${idx + 1}`)}" style="font-weight:600">
      </div>
      <div class="measure">
        <div class="mbox"><label for="w">العرض</label><div class="in"><input id="w" name="width" type="number" inputmode="decimal" step="any" min="0" placeholder="0" value="${wall?.width_cm ?? ""}"><span class="u">cm</span></div></div>
        <div class="mbox"><label for="h">الارتفاع</label><div class="in"><input id="h" name="height" type="number" inputmode="decimal" step="any" min="0" placeholder="0" value="${wall?.height_cm ?? ""}"><span class="u">cm</span></div></div>
      </div>
      <div class="area-chip"><span>المساحة</span><b class="num" id="area">0 m²</b></div>
      <div class="field"><span>المواد المطلوبة</span>
        <div class="chips" id="chips">
          ${options.map((m) => `<button type="button" class="chip" aria-pressed="${selected.has(m)}" data-m="${esc(m)}">${esc(m)}</button>`).join("")}
        </div>
        <div class="chip-add"><input class="input" type="text" id="newmat" placeholder="مادة أخرى…"><button type="button" class="btn btn-soft" id="addmat">${ic("plus", "ico-sm")} إضافة</button></div>
      </div>
      <label class="field"><span>ملاحظات</span><textarea class="input" name="notes" placeholder="فتحات، أفياش، مكيف، لون، تفاصيل التنفيذ…">${esc(wall?.notes || "")}</textarea></label>
      <div class="actionbar"><div class="inner">
        ${wall
          ? `<button class="btn btn-primary" value="back">${ic("check")} حفظ التعديلات</button>`
          : `<button class="btn" value="back">حفظ</button><button class="btn btn-primary grow" value="next">${ic("camera")} حفظ + الجدار التالي</button>`}
      </div></div>
    </form>
    <div style="text-align:center;color:var(--muted);font-size:12.5px;margin-top:14px">${esc(project.name)}</div>`;

  const form = document.getElementById("f");
  const cam = document.getElementById("cam");
  const cap = document.getElementById("cap");
  const dw = document.getElementById("dw"), dh = document.getElementById("dh");

  const update = () => {
    const w = parseFloat(form.width.value), h = parseFloat(form.height.value);
    const hasPhoto = !!cap.querySelector(":scope > img");
    document.getElementById("area").textContent = `${num(w > 0 && h > 0 ? (w * h) / 10000 : 0)} m²`;
    dw.hidden = !(hasPhoto && w > 0);
    dh.hidden = !(hasPhoto && h > 0);
    dw.querySelector(".lab").textContent = `${num(w)} cm`;
    dh.querySelector(".lab").textContent = `${num(h)} cm`;
  };
  form.width.oninput = form.height.oninput = update;
  update();

  cam.onchange = async () => {
    const file = cam.files[0];
    if (!file) return;
    try {
      photoBlob = await compressImage(file);
      cap.querySelectorAll(":scope > img, .empty-cam").forEach((el) => el.remove());
      cap.insertAdjacentHTML("afterbegin", `<img src="${URL.createObjectURL(photoBlob)}" alt="">`);
      document.getElementById("retake").hidden = false;
      update();
      form.width.focus();
    } catch (e) { fail(e); }
  };
  // a click on the top bar buttons must not open the camera
  cap.querySelector(".topbar").onclick = (e) => { if (e.target.closest(".icon-btn")) e.stopPropagation(); else e.preventDefault(); };
  if (!wall) setTimeout(() => cam.click(), 300);

  const chips = document.getElementById("chips");
  chips.onclick = (e) => {
    const c = e.target.closest(".chip");
    if (!c) return;
    const on = c.getAttribute("aria-pressed") !== "true";
    c.setAttribute("aria-pressed", on);
    on ? selected.add(c.dataset.m) : selected.delete(c.dataset.m);
  };
  const addMat = () => {
    const inp = document.getElementById("newmat");
    const m = inp.value.trim();
    if (!m) return;
    saveCustomMaterial(m);
    selected.add(m);
    const existing = chips.querySelector(`[data-m="${CSS.escape(m)}"]`);
    if (existing) existing.setAttribute("aria-pressed", "true");
    else chips.insertAdjacentHTML("beforeend", `<button type="button" class="chip" aria-pressed="true" data-m="${esc(m)}">${esc(m)}</button>`);
    inp.value = "";
  };
  document.getElementById("addmat").onclick = addMat;
  document.getElementById("newmat").onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); addMat(); } };

  if (wall) document.getElementById("delw").onclick = async (e) => {
    e.preventDefault();
    if (!confirm("حذف هذا الجدار؟")) return;
    if (wall.photo_path) await sb.storage.from(BUCKET).remove([wall.photo_path]);
    const { error } = await sb.from("walls").delete().eq("id", wall.id);
    if (error) return fail(error);
    go(`#/p/${projectId}`);
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const next = e.submitter?.value === "next";
    const b = busy("جاري الحفظ…");
    try {
      let photo_path = wall?.photo_path || null;
      if (photoBlob) {
        const newPath = `${user.id}/${projectId}/${crypto.randomUUID()}.jpg`;
        const { error } = await sb.storage.from(BUCKET).upload(newPath, photoBlob, { contentType: "image/jpeg" });
        if (error) throw error;
        if (photo_path) await sb.storage.from(BUCKET).remove([photo_path]);
        photo_path = newPath;
      }
      const row = {
        project_id: projectId,
        name: form.name.value.trim() || `جدار ${idx + 1}`,
        width_cm: parseFloat(form.width.value) || null,
        height_cm: parseFloat(form.height.value) || null,
        materials: [...selected],
        notes: form.notes.value.trim() || null,
        photo_path,
      };
      const { error } = wall
        ? await sb.from("walls").update(row).eq("id", wall.id)
        : await sb.from("walls").insert(row);
      if (error) throw error;
      toast(`تم حفظ ${row.name} ✓`);
      if (next) {
        // hashchange won't fire for the same hash, so re-render directly
        if (location.hash === `#/p/${projectId}/wall/new`) route(); else go(`#/p/${projectId}/wall/new`);
      } else go(`#/p/${projectId}`);
    } catch (err) { fail(err); } finally { b.done(); }
  };
}

/* ---------- PDF report ---------- */
// Each A4 page is built as HTML and rasterised separately: keeps Arabic shaping
// correct and stays under mobile canvas size limits for large projects.
async function buildPdf(p, walls, onProgress) {
  const stage = document.getElementById("pdf-stage");
  await Promise.all(["400", "500", "600", "700"].map((w) => document.fonts.load(`${w} 16px "Readex Pro"`, "عربي MH")));

  const photos = {};
  for (const [i, w] of walls.entries()) {
    onProgress(`تجهيز الصور ${i + 1} / ${walls.length}`);
    if (!w.photo_path) continue;
    const { data, error } = await sb.storage.from(BUCKET).download(w.photo_path);
    if (error) continue;
    const src = await blobToDataUrl(data);
    photos[w.id] = { src, ...(await imgSize(src)) };
  }

  const total = walls.reduce((s, w) => s + areaM2(w), 0);
  const mats = materialTotals(walls);
  const no = reportNo(p);
  const issued = dateAr(new Date());

  // wall schedule rows are paginated so long projects never overflow a page
  const firstRows = Math.max(4, 13 - mats.length);
  const scheduleChunks = [walls.slice(0, firstRows)];
  for (let i = firstRows; i < walls.length; i += 24) scheduleChunks.push(walls.slice(i, i + 24));
  const wallPairs = [];
  for (let i = 0; i < walls.length; i += 2) wallPairs.push(walls.slice(i, i + 2));
  const pageCount = 1 + scheduleChunks.length + wallPairs.length;

  const head = () => `
    <div class="ph-head">
      <div class="ph-brand"><img src="assets/mark.png" alt=""><div><div class="t">${COMPANY.ar}</div><div class="s">${COMPANY.en}</div></div></div>
      <div class="ph-meta"><b>${esc(p.name)}</b><br>تقرير رفع مقاسات · <span class="num">${no}</span></div>
    </div>`;
  const foot = (n) => `
    <div class="pg-foot"><span>${issued} · ${esc([p.client, p.location].filter(Boolean).join(" · "))}</span><span class="pn">${n} / ${pageCount}</span></div>
    <div class="pg-band"></div>`;
  const page = (n, body) => `${head()}<div class="pg-body">${body}</div>${foot(n)}`;

  const scheduleTable = (rows, offset, withTotal) => `
    <table class="tbl">
      <thead><tr><th>الرمز</th><th>الجدار</th><th>المواد</th><th class="c-num">العرض × الارتفاع (cm)</th><th class="c-num">المساحة m²</th></tr></thead>
      <tbody>${rows.map((w, i) => `<tr>
        <td class="c-code">${code(offset + i)}</td><td>${esc(w.name)}</td>
        <td>${esc((w.materials || []).join(" + ") || "—")}</td>
        <td class="c-num">${dims(w)}</td><td class="c-num">${num(areaM2(w))}</td></tr>`).join("")}</tbody>
      ${withTotal ? `<tfoot><tr><td colspan="4">الإجمالي</td><td class="c-num">${num(total)}</td></tr></tfoot>` : ""}
    </table>`;

  const pages = [];

  // 1 — cover
  pages.push(`
    <div class="cv-top">
      <div class="cv-stripes"></div><div class="cv-glow"></div>
      <img class="cv-mark" src="assets/mark-white.png" alt="">
      <img class="cv-logo" src="assets/logo-white.png" alt="">
      <div class="cv-title-block">
        <div class="cv-kicker">تقرير رفع مقاسات</div>
        <div class="cv-title">${esc(p.name)}</div>
        <div class="cv-en">SITE MEASUREMENT REPORT</div>
      </div>
    </div>
    <div class="cv-body">
      <div class="cv-grid">
        <div class="cv-item"><div class="k">العميل</div><div class="v">${esc(p.client || "—")}</div></div>
        <div class="cv-item"><div class="k">الموقع</div><div class="v">${esc(p.location || "—")}</div></div>
        <div class="cv-item"><div class="k">رقم التقرير</div><div class="v num" style="text-align:right">${no}</div></div>
        <div class="cv-item"><div class="k">تاريخ الإصدار</div><div class="v">${issued}</div></div>
        <div class="cv-item"><div class="k">عدد الجدران</div><div class="v">${walls.length}</div></div>
        <div class="cv-item"><div class="k">إجمالي المساحة</div><div class="v num" style="text-align:right">${num(total)} m²</div></div>
      </div>
      <div class="cv-foot"><span><b>${COMPANY.ar}</b> · ${COMPANY.en}</span><span>وثيقة خاصة</span></div>
    </div>
    <div class="cv-band"></div>`);

  // 2 — summary + schedule (continued on extra pages when long)
  scheduleChunks.forEach((rows, ci) => {
    const offset = ci === 0 ? 0 : firstRows + (ci - 1) * 24;
    const last = ci === scheduleChunks.length - 1;
    const body = ci === 0 ? `
      <h3 class="h-sec">ملخص المشروع <small>SUMMARY</small></h3>
      <div class="kp-row">
        <div class="kp dark"><div class="k">إجمالي المساحة</div><div class="v num" style="text-align:right">${num(total)} <small>m²</small></div></div>
        <div class="kp"><div class="k">عدد الجدران</div><div class="v">${walls.length}</div></div>
        <div class="kp"><div class="k">أنواع المواد</div><div class="v">${mats.length}</div></div>
      </div>
      ${mats.length ? `
      <h3 class="h-sec">الكميات حسب المادة <small>QUANTITIES</small></h3>
      <table class="tbl">
        <thead><tr><th>المادة</th><th class="c-num">المساحة m²</th><th style="width:40%">النسبة من الإجمالي</th></tr></thead>
        <tbody>${mats.map(([m, a]) => {
          const pct = total ? Math.round((a / total) * 100) : 0;
          return `<tr><td><b>${esc(m)}</b></td><td class="c-num">${num(a)}</td><td><div class="share"><span>${pct}%</span><div class="b"><i style="width:${pct}%"></i></div></div></td></tr>`;
        }).join("")}</tbody>
      </table>` : ""}
      <h3 class="h-sec">جدول الجدران <small>SCHEDULE</small></h3>
      ${scheduleTable(rows, 0, last)}
      ${last ? `<div class="sign"><div>أعدّه</div><div>اعتمده</div><div>التاريخ</div></div>` : ""}`
      : `<h3 class="h-sec">جدول الجدران (تابع) <small>SCHEDULE</small></h3>${scheduleTable(rows, offset, last)}
         ${last ? `<div class="sign"><div>أعدّه</div><div>اعتمده</div><div>التاريخ</div></div>` : ""}`;
    pages.push(page(pages.length + 1, body));
  });

  // 3 — wall detail pages, two walls per page
  const BOX_W = 430, BOX_H = 330;
  wallPairs.forEach((pair) => {
    const body = `<h3 class="h-sec">تفاصيل الجدران <small>WALL DETAILS</small></h3>` + pair.map((w) => {
      const i = walls.indexOf(w);
      const ph = photos[w.id];
      let photo = `<span class="none">لا توجد صورة</span>`;
      if (ph) {
        const s = Math.min(BOX_W / ph.w, BOX_H / ph.h);
        const W = Math.round(ph.w * s), H = Math.round(ph.h * s);
        photo = `<div class="wb-photo" style="width:${W}px;height:${H}px">
          <img src="${ph.src}" width="${W}" height="${H}" alt="">
          ${w.width_cm ? `<div class="pdim pw"><span class="lab" style="left:50%;top:-12px;transform:translateX(-50%)">${num(w.width_cm)} cm</span></div>` : ""}
          ${w.height_cm ? `<div class="pdim ph"><span class="lab" style="top:50%;left:-34px;transform:translateY(-50%) rotate(-90deg)">${num(w.height_cm)} cm</span></div>` : ""}
        </div>`;
      }
      return `
        <div class="wb">
          <div class="wb-head"><span class="wb-code">${code(i)}</span><span class="wb-name">${esc(w.name)}</span><span class="wb-area">${num(areaM2(w))} m²</span></div>
          <div class="wb-main">
            <div class="wb-frame">${photo}</div>
            <div class="wb-side">
              <div class="spec">
                <div><span>العرض</span><b>${w.width_cm ? num(w.width_cm) + " cm" : "—"}</b></div>
                <div><span>الارتفاع</span><b>${w.height_cm ? num(w.height_cm) + " cm" : "—"}</b></div>
                <div><span>المساحة</span><b>${num(areaM2(w))} m²</b></div>
              </div>
              ${w.materials?.length ? `<div><div class="wb-k">المواد</div><div class="mtags">${w.materials.map((m) => `<span>${esc(m)}</span>`).join("")}</div></div>` : ""}
              ${w.notes ? `<div><div class="wb-k">ملاحظات</div><div class="wb-notes">${esc(w.notes)}</div></div>` : ""}
            </div>
          </div>
        </div>`;
    }).join("");
    pages.push(page(pages.length + 1, body));
  });

  const pdf = new jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  pdf.setProperties({ title: `${p.name} — ${no}`, author: COMPANY.en, subject: "Site measurement report" });
  for (const [i, html] of pages.entries()) {
    onProgress(`إنشاء الصفحة ${i + 1} / ${pages.length}`);
    const el = document.createElement("div");
    el.className = "pg";
    el.innerHTML = html;
    stage.appendChild(el);
    await Promise.all([...el.querySelectorAll("img")].map((im) => (im.complete ? null : new Promise((r) => { im.onload = im.onerror = r; }))));
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", logging: false, useCORS: true });
    stage.removeChild(el);
    if (i > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 210, 297, undefined, "FAST");
  }
  return pdf.output("blob");
}

const pdfName = (p) => `${reportNo(p)} ${p.name.replace(/[\\/:*?"<>|]+/g, "-")}.pdf`;

function saveBlob(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

async function closeProject(p, walls) {
  const b = busy("جاري إصدار التقرير…");
  try {
    const blob = await buildPdf(p, walls, b.set);
    b.set("حفظ التقرير…");
    const path = `${user.id}/${p.id}/report.pdf`;
    const { error: upErr } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: "application/pdf", upsert: true });
    if (upErr) throw upErr;
    const { error } = await sb.from("projects").update({ status: "closed", closed_at: new Date().toISOString(), pdf_path: path }).eq("id", p.id);
    if (error) throw error;
    saveBlob(blob, pdfName(p));
    toast("تم إقفال المشروع وحفظ التقرير ✓");
    route();
  } catch (e) { fail(e); } finally { b.done(); }
}

async function downloadPdf(p) {
  if (!p.pdf_path) return toast("لا يوجد تقرير محفوظ — اضغط إعادة الإصدار");
  const b = busy("جاري التحميل…");
  try {
    const { data, error } = await sb.storage.from(BUCKET).download(p.pdf_path);
    if (error) throw error;
    saveBlob(data, pdfName(p));
  } catch (e) { fail(e); } finally { b.done(); }
}

/* ---------- boot ---------- */
window.addEventListener("hashchange", route);
if (sb) {
  let first = true;
  sb.auth.onAuthStateChange((_event, session) => {
    const prev = user?.id;
    user = session?.user || null;
    // only re-render on real login/logout — SIGNED_IN also fires on tab refocus and would wipe an open form.
    // defer: calling supabase inside this callback can deadlock the auth lock
    if (first || prev !== user?.id) setTimeout(route, 0);
    first = false;
  });
} else {
  route();
}
