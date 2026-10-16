"use strict";

// sheet sizes in cm; materials without a size are counted in m² only
const DEFAULT_CATALOG = [
  { name: "بديل خشب", sheet_w: 120, sheet_h: 280, waste: 0 },
  { name: "بديل رخام", sheet_w: 120, sheet_h: 280, waste: 0 },
  { name: "بديل شيبورد", sheet_w: 120, sheet_h: 280, waste: 0 },
  { name: "جبس بورد", sheet_w: 120, sheet_h: 240, waste: 0 },
  { name: "دهان", sheet_w: null, sheet_h: null, waste: 0 },
  { name: "ورق جدران", sheet_w: null, sheet_h: null, waste: 10 },
];
const DEFAULT_ROOMS = ["المجلس", "الصالة", "غرفة النوم", "غرفة الطعام", "المطبخ", "المدخل", "الممر", "دورة المياه"];
const NO_ROOM = "بدون غرفة";
const MAX_IMG = 1600;
const THUMB_IMG = 480;
const IMAGE_ACCEPT = "image/*";
const COMPANY = { ar: "شركة هكتار الحديثة", en: "MODERN HECTAR COMPANY" };

const view = document.getElementById("view");
const A = { logoWhite: "assets/logo-white.png", markWhite: "assets/mark-white.png", mark: "assets/mark.png" };
let listFilter = "all";

/* ---------- local database (IndexedDB on this device) ---------- */
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const nowIso = () => new Date().toISOString();
const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

let dbPromise;
function openDb() {
  return (dbPromise ||= new Promise((res, rej) => {
    const r = indexedDB.open("hectar-measure", 3);
    r.onupgradeneeded = (e) => {
      const db = r.result;
      if (e.oldVersion < 1) {
        db.createObjectStore("projects", { keyPath: "id" });
        db.createObjectStore("walls", { keyPath: "id" }).createIndex("project_id", "project_id");
        db.createObjectStore("files"); // id → Blob (photos, thumbnails, PDF reports)
      }
      if (e.oldVersion < 2) db.createObjectStore("meta"); // settings: materials catalog, company info, counters
      if (e.oldVersion < 3) db.createObjectStore("quotes", { keyPath: "id" });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
}

// fn may only await IndexedDB requests, otherwise the transaction auto-commits
async function tx(stores, mode, fn) {
  const t = (await openDb()).transaction(stores, mode);
  const done = new Promise((res, rej) => { t.oncomplete = res; t.onerror = t.onabort = () => rej(t.error); });
  const s = Object.fromEntries([].concat(stores).map((n) => [n, t.objectStore(n)]));
  const result = await fn(s);
  await done;
  return result;
}

const api = {
  listProjects: () => tx(["projects", "walls"], "readonly", async (s) => {
    const [ps, ws] = await Promise.all([req(s.projects.getAll()), req(s.walls.getAll())]);
    return ps.map((p) => ({ ...p, walls: ws.filter((w) => w.project_id === p.id) }));
  }),

  getProject: (id) => tx(["projects", "walls"], "readonly", async (s) => {
    const project = await req(s.projects.get(id));
    if (!project) throw new Error("المشروع غير موجود");
    const walls = await req(s.walls.index("project_id").getAll(id));
    walls.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return { project, walls };
  }),

  async createProject(d) {
    const p = { id: uid(), name: d.name, client: d.client, location: d.location, status: "open", created_at: nowIso(), closed_at: null, pdf_id: null };
    await tx("projects", "readwrite", (s) => req(s.projects.put(p)));
    navigator.storage?.persist?.();
    return p;
  },

  saveWall: (d) => tx(["walls", "files"], "readwrite", async (s) => {
    const wall = (d.id && (await req(s.walls.get(d.id)))) ||
      { id: uid(), project_id: d.project_id, created_at: nowIso(), photo_id: null, thumb_id: null };
    Object.assign(wall, { name: d.name, room: d.room, width_cm: d.width_cm, height_cm: d.height_cm, materials: d.materials, notes: d.notes });
    if (d.photo) {
      if (wall.photo_id) { s.files.delete(wall.photo_id); s.files.delete(wall.thumb_id); }
      wall.photo_id = uid();
      wall.thumb_id = uid();
      s.files.put(d.photo, wall.photo_id);
      s.files.put(d.thumb, wall.thumb_id);
    }
    await req(s.walls.put(wall));
    return wall;
  }),

  deleteWall: (id) => tx(["walls", "files"], "readwrite", async (s) => {
    const w = await req(s.walls.get(id));
    if (!w) return;
    [w.photo_id, w.thumb_id].filter(Boolean).forEach((f) => s.files.delete(f));
    s.walls.delete(id);
  }),

  deleteProject: (id) => tx(["projects", "walls", "files"], "readwrite", async (s) => {
    const p = await req(s.projects.get(id));
    const walls = await req(s.walls.index("project_id").getAll(id));
    for (const w of walls) {
      [w.photo_id, w.thumb_id].filter(Boolean).forEach((f) => s.files.delete(f));
      s.walls.delete(w.id);
    }
    if (p?.pdf_id) s.files.delete(p.pdf_id);
    s.projects.delete(id);
  }),

  setStatus: (id, status) => tx("projects", "readwrite", async (s) => {
    const p = await req(s.projects.get(id));
    p.status = status;
    await req(s.projects.put(p));
  }),

  saveReport: (id, blob) => tx(["projects", "files"], "readwrite", async (s) => {
    const p = await req(s.projects.get(id));
    p.pdf_id = `pdf:${id}`;
    p.status = "closed";
    p.closed_at = nowIso();
    s.files.put(blob, p.pdf_id);
    await req(s.projects.put(p));
    return p;
  }),

  getFile: (id) => tx("files", "readonly", (s) => req(s.files.get(id))),

  async getCatalog() {
    const saved = await tx("meta", "readonly", (s) => req(s.meta.get("materials")));
    if (saved) return saved;
    // first run: defaults + materials typed in older versions of the app
    let legacy = [];
    try { legacy = JSON.parse(localStorage.getItem("customMaterials") || "[]"); } catch { /* storage unavailable */ }
    return [...DEFAULT_CATALOG, ...legacy.filter((n) => !DEFAULT_CATALOG.some((c) => c.name === n)).map((name) => ({ name, sheet_w: null, sheet_h: null, waste: 0 }))];
  },

  saveCatalog: (list) => tx("meta", "readwrite", (s) => req(s.meta.put(list, "materials"))),

  getMeta: (key) => tx("meta", "readonly", (s) => req(s.meta.get(key))),
  setMeta: (key, value) => tx("meta", "readwrite", (s) => req(s.meta.put(value, key))),

  listQuotes: () => tx("quotes", "readonly", (s) => req(s.quotes.getAll())),
  getQuote: (id) => tx("quotes", "readonly", (s) => req(s.quotes.get(id))),
  saveQuote: (q) => tx("quotes", "readwrite", (s) => req(s.quotes.put(q))),
  deleteQuote: (id) => tx(["quotes", "files"], "readwrite", async (s) => {
    const q = await req(s.quotes.get(id));
    if (q?.pdf_id) s.files.delete(q.pdf_id);
    s.quotes.delete(id);
  }),
  saveQuotePdf: (id, blob) => tx(["quotes", "files"], "readwrite", async (s) => {
    const q = await req(s.quotes.get(id));
    q.pdf_id = `qpdf:${id}`;
    q.pdf_stale = false;
    s.files.put(blob, q.pdf_id);
    await req(s.quotes.put(q));
    return q;
  }),

  // Q-2026-001, Q-2026-002… restarting every year
  nextQuoteNumber: () => tx("meta", "readwrite", async (s) => {
    const year = new Date().getFullYear();
    const seq = (await req(s.meta.get("quoteSeq"))) || {};
    const n = seq.year === year ? seq.n + 1 : 1;
    await req(s.meta.put({ year, n }, "quoteSeq"));
    return `Q-${year}-${String(n).padStart(3, "0")}`;
  }),
};

// object URLs for stored photos, cached for the session
const imageCache = {};
async function images(ids) {
  const missing = [...new Set(ids.filter((id) => id && !imageCache[id]))];
  if (missing.length) {
    const blobs = await tx("files", "readonly", (s) => Promise.all(missing.map((id) => req(s.files.get(id)))));
    missing.forEach((id, i) => { if (blobs[i]) imageCache[id] = URL.createObjectURL(blobs[i]); });
  }
  return imageCache;
}

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
  folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/>',
  upload: '<path d="M12 15V4M7 9l5-5 5 5M5 20h14"/>',
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
  el.innerHTML = `<div><img src="${A.markWhite}" alt=""><div class="msg">${esc(msg)}</div><div class="progress"><i></i></div></div>`;
  document.body.appendChild(el);
  return { set: (m) => (el.querySelector(".msg").textContent = m), done: () => el.remove() };
}

function fail(err) {
  console.error(err);
  toast("حدث خطأ: " + (err?.message || err), 4000);
}


// Resize + compress camera photos (phones produce 4–8 MB images)
function compressImage(file, max = MAX_IMG, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("تعذر ضغط الصورة"))), "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("تعذر قراءة الصورة")); };
    img.src = url;
  });
}

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

// Sheets are counted per wall by width only: 360 cm wall ÷ 120 cm sheet = 3 sheets.
function wallSheets(w, c) {
  if (!c?.sheet_w) return null;
  return w.width_cm ? Math.ceil(w.width_cm / c.sheet_w - 1e-9) : 0;
}

// per material: total sheets (sum of walls) or m² + waste for materials without a sheet size
function quantities(walls, catalog) {
  return materialTotals(walls).map(([name, area]) => {
    const c = catalog.find((x) => x.name === name);
    const own = walls.filter((w) => (w.materials || []).includes(name));
    const bySheet = !!c?.sheet_w;
    const waste = Number(c?.waste) || 0;
    return {
      name, area, waste,
      gross: area * (1 + waste / 100),
      walls: own.length,
      width: own.reduce((t, w) => t + (Number(w.width_cm) || 0), 0),
      sheets: bySheet ? own.reduce((t, w) => t + wallSheets(w, c), 0) : null,
      size: bySheet ? `${c.sheet_w}×${c.sheet_h || "—"}` : null,
    };
  });
}

// rooms in order of first appearance; walls inside a room keep creation order
function groupByRoom(walls) {
  const groups = new Map();
  for (const w of walls) {
    const r = w.room || NO_ROOM;
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(w);
  }
  return [...groups].map(([room, ws]) => ({ room, walls: ws, area: ws.reduce((t, w) => t + areaM2(w), 0) }));
}

const statusPill = (p) => p.status === "closed"
  ? `<span class="pill pill-closed">مقفل</span>`
  : `<span class="pill pill-open">قيد الرفع</span>`;

/* ---------- router ---------- */
async function route() {
  window.scrollTo(0, 0);
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  try {
    if (!parts.length) return await renderHub();
    if (parts[0] === "measure") return await renderProjects();
    if (parts[0] === "q") return await routeQuotes(parts.slice(1));
    if (parts[0] === "company") return await renderCompany();
    if (parts[0] === "new") return renderNewProject();
    if (parts[0] === "settings") return await renderSettings();
    if (parts[0] === "materials") return await renderMaterials();
    if (parts[0] === "p" && parts[1] && parts[2] === "wall") return await renderWallForm(parts[1], parts[3] === "new" ? null : parts[3]);
    if (parts[0] === "p" && parts[1]) return await renderProject(parts[1]);
    return await renderProjects();
  } catch (e) { fail(e); }
}

/* ---------- projects list ---------- */
async function renderProjects() {
  const projects = await api.listProjects();
  projects.sort((a, b) => b.created_at.localeCompare(a.created_at));

  for (const p of projects) {
    p.walls.sort((a, b) => a.created_at.localeCompare(b.created_at));
    p.area = p.walls.reduce((s, w) => s + areaM2(w), 0);
    p.cover = p.walls.find((w) => w.thumb_id)?.thumb_id;
  }
  const covers = await images(projects.map((p) => p.cover));
  const open = projects.filter((p) => p.status !== "closed").length;
  const totalArea = projects.reduce((s, p) => s + p.area, 0);

  const card = (p) => `
    <a class="card pcard" href="#/p/${p.id}" data-status="${p.status}" data-q="${esc([p.name, p.client, p.location].join(" ").toLowerCase())}">
      <div class="thumb">${covers[p.cover] ? `<img src="${covers[p.cover]}" alt="" loading="lazy">` : `<img class="ph" src="${A.markWhite}" alt="">`}</div>
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
        <a class="icon-btn" href="#/" aria-label="الرئيسية">${ic("back")}</a>
        <div class="hero-brand"><div style="text-align:left"><div class="t">${COMPANY.ar}</div><div class="s">MEASUREMENTS</div></div><img src="${A.markWhite}" alt=""></div>
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
      <div class="hero-bar"><a class="icon-btn" href="#/measure" aria-label="رجوع">${ic("back")}</a><img src="${A.markWhite}" alt="" style="width:30px"></div>
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
    const btn = e.target.querySelector("button");
    btn.disabled = true;
    try {
      const data = await api.createProject({
        name: fd.get("name").trim(),
        client: fd.get("client").trim() || null,
        location: fd.get("location").trim() || null,
      });
      history.replaceState(null, "", `#/p/${data.id}`);
      go(`#/p/${data.id}/wall/new`);
    } catch (err) { btn.disabled = false; fail(err); }
  };
}

/* ---------- project detail ---------- */
const loadProject = (id) => api.getProject(id);

async function renderProject(id) {
  const [{ project: p, walls }, catalog] = await Promise.all([loadProject(id), api.getCatalog()]);
  const urls = await images(walls.map((w) => w.thumb_id));
  const total = walls.reduce((s, w) => s + areaM2(w), 0);
  const closed = p.status === "closed";
  const qty = quantities(walls, catalog);
  const maxMat = Math.max(1, ...qty.map((q) => q.area));
  const rooms = groupByRoom(walls);
  const ordered = rooms.flatMap((g) => g.walls);
  // loaded up front so the share button runs inside the tap (iOS requires a direct user gesture)
  const pdfBlob = closed && p.pdf_id ? await api.getFile(p.pdf_id) : null;

  view.innerHTML = `
    <header class="hero">
      <div class="hero-bar"><a class="icon-btn" href="#/measure" aria-label="المشاريع">${ic("back")}</a>${statusPill(p)}</div>
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
        <div class="kpi"><div class="v">${rooms.length}</div><div class="l">غرف</div></div>
      </div>
    </header>

    ${qty.length ? `
    <section class="section">
      <div class="section-title"><h2>الكميات المطلوبة</h2><a class="count" href="#/materials">مقاسات الألواح</a></div>
      <div class="card mats">
        ${qty.map((q) => `
          <div class="mat">
            <div class="row">
              <span>${esc(q.name)}</span>
              ${q.sheets != null ? `<b class="sheets"><span class="num">${q.sheets}</span> لوح</b>` : `<b class="num">${num(q.gross)} m²</b>`}
            </div>
            <div class="bar"><i style="width:${(q.area / maxMat) * 100}%"></i></div>
            <div class="mat-meta">${q.sheets != null
              ? `${q.walls} جدار · مجموع العرض <span class="num">${num(q.width)} cm</span> · لوح <span class="num">${q.size}</span>`
              : `<span class="num">${num(q.area)} m²</span>${q.waste ? ` + هدر ${q.waste}% = <span class="num">${num(q.gross)} m²</span>` : ""}`}</div>
          </div>`).join("")}
      </div>
    </section>` : ""}

    <section class="section">
      <div class="section-title"><h2>الجدران حسب الغرفة</h2><span class="count">${walls.length} جدار</span></div>
      ${walls.length ? rooms.map((g) => `
        <div class="room-head"><b>${esc(g.room)}</b><span>${g.walls.length} جدار · <span class="num">${num(g.area)} m²</span></span></div>
        <div class="wlist">
        ${g.walls.map((w) => `
          <a class="card wcard" href="#/p/${p.id}/wall/${w.id}">
            <div class="photo">${urls[w.thumb_id] ? `<img src="${urls[w.thumb_id]}" alt="">` : ic("camera")}<span class="code">${code(ordered.indexOf(w))}</span></div>
            <div class="body">
              <div class="name">${esc(w.name)}</div>
              <div class="dims num" style="text-align:right">${dims(w)} <small>cm</small></div>
              ${w.materials?.length ? `<div class="tags">${w.materials.map((m) => { const n = wallSheets(w, catalog.find((c) => c.name === m)); return `<span class="tag">${esc(m)}${n ? ` · ${n} لوح` : ""}</span>`; }).join("")}</div>` : ""}
            </div>
            <div class="area"><b class="num">${num(areaM2(w))}</b><span>m²</span></div>
          </a>`).join("")}
        </div>`).join("") : `<div class="card empty"><div class="em-ico">${ic("camera")}</div><b>لا توجد جدران بعد</b>اضغط «إضافة جدار» وابدأ التصوير</div>`}
    </section>

    ${walls.length ? `<section class="section"><button class="card quote-cta" id="toquote">
      <span class="qi">${ic("file")}</span><span><b>إنشاء عرض سعر من هذا المشروع</b><small>الكميات والأسعار تنتقل تلقائياً</small></span>${ic("chev", "ico-sm")}
    </button></section>` : ""}

    <div class="footer-actions">
      ${closed ? `<button class="btn btn-text" id="reopen">${ic("unlock", "ico-sm")} إعادة فتح المشروع</button>` : ""}
      <button class="btn btn-text btn-danger" id="del">${ic("trash", "ico-sm")} حذف المشروع</button>
    </div>

    <div class="actionbar"><div class="inner">
      ${closed
        ? `<button class="btn btn-primary grow" id="share">${ic("share")} مشاركة التقرير</button><button class="btn" id="pdf" aria-label="تحميل">${ic("download")}</button><button class="btn" id="regen" aria-label="إعادة إصدار">${ic("refresh")}</button>`
        : `<button class="btn btn-primary grow" id="add">${ic("camera")} إضافة جدار</button>${walls.length ? `<button class="btn btn-accent" id="close">${ic("lock")} إقفال</button>` : ""}`}
    </div></div>`;

  const on = (sel, fn) => { const el = document.getElementById(sel); if (el) el.onclick = fn; };
  on("add", () => go(`#/p/${p.id}/wall/new`));
  on("close", () => { if (confirm("إقفال المشروع وإصدار التقرير PDF؟")) closeProject(p, walls, catalog); });
  on("regen", () => { if (confirm("إعادة إصدار التقرير؟")) closeProject(p, walls, catalog); });
  on("share", () => (pdfBlob ? shareFile(pdfBlob, pdfName(p)) : toast("لا يوجد تقرير محفوظ — اضغط إعادة الإصدار")));
  on("pdf", () => (pdfBlob ? saveBlob(pdfBlob, pdfName(p)) : toast("لا يوجد تقرير محفوظ — اضغط إعادة الإصدار")));
  on("reopen", async () => {
    try { await api.setStatus(p.id, "open"); route(); } catch (e) { fail(e); }
  });
  on("del", () => deleteProject(p));
  on("toquote", () => quoteFromProject(p, walls, catalog));
}

async function deleteProject(p) {
  if (!confirm(`حذف «${p.name}» مع كل الصور والتقرير نهائياً؟`)) return;
  const b = busy("جاري الحذف…");
  try {
    await api.deleteProject(p.id);
    go("#/measure");
  } catch (e) { fail(e); } finally { b.done(); }
}

/* ---------- wall form ---------- */
async function renderWallForm(projectId, wallId) {
  const [{ project, walls }, catalog] = await Promise.all([loadProject(projectId), api.getCatalog()]);
  const wall = wallId ? walls.find((w) => w.id === wallId) : null;
  if (wallId && !wall) return go(`#/p/${projectId}`);
  const ordered = groupByRoom(walls).flatMap((g) => g.walls);
  const idx = wall ? ordered.indexOf(wall) : walls.length;
  const urls = wall?.photo_id ? await images([wall.photo_id]) : {};
  const selected = new Set(wall?.materials || []);
  const options = [...new Set([...catalog.map((c) => c.name), ...selected])];
  // a new wall starts in the room of the last wall you saved, so a room is measured in one go
  let room = wall ? wall.room || null : walls.at(-1)?.room || null;
  const roomOptions = [...new Set([...walls.map((w) => w.room).filter(Boolean), ...DEFAULT_ROOMS, ...(room ? [room] : [])])];
  const photoUrl = urls[wall?.photo_id];
  let photo = null, thumb = null;

  view.innerHTML = `
    <label class="capture" id="cap">
      <input type="file" accept="${IMAGE_ACCEPT}" capture="environment" id="cam">
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
      <div class="field"><span>الغرفة</span>
        <div class="chips" id="rooms">
          ${roomOptions.map((r) => `<button type="button" class="chip chip-room" aria-pressed="${r === room}" data-r="${esc(r)}">${esc(r)}</button>`).join("")}
        </div>
        <div class="chip-add"><input class="input" type="text" id="newroom" placeholder="غرفة أخرى…"><button type="button" class="btn btn-soft" id="addroom">${ic("plus", "ico-sm")} إضافة</button></div>
      </div>
      <div class="measure">
        <div class="mbox"><label for="w">العرض</label><div class="in"><input id="w" name="width" type="number" inputmode="decimal" step="any" min="0" placeholder="0" value="${wall?.width_cm ?? ""}"><span class="u">cm</span></div></div>
        <div class="mbox"><label for="h">الارتفاع</label><div class="in"><input id="h" name="height" type="number" inputmode="decimal" step="any" min="0" placeholder="0" value="${wall?.height_cm ?? ""}"><span class="u">cm</span></div></div>
      </div>
      <div class="area-chip"><span>المساحة</span><b class="num" id="area">0 m²</b></div>
      <div class="sheet-live" id="sheetlive" hidden></div>
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
    const counts = [...selected].map((m) => [m, wallSheets({ width_cm: w, height_cm: h }, catalog.find((c) => c.name === m))]).filter(([, n]) => n);
    const live = document.getElementById("sheetlive");
    live.hidden = !counts.length;
    live.innerHTML = counts.map(([m, n]) => `<span>${esc(m)}: <b class="num">${n}</b> لوح</span>`).join("");
  };
  form.width.oninput = form.height.oninput = update;
  update();

  cam.onchange = async () => {
    const file = cam.files[0];
    if (!file) return;
    try {
      [photo, thumb] = await Promise.all([compressImage(file), compressImage(file, THUMB_IMG, 0.75)]);
      cap.querySelectorAll(":scope > img, .empty-cam").forEach((el) => el.remove());
      cap.insertAdjacentHTML("afterbegin", `<img src="${URL.createObjectURL(photo)}" alt="">`);
      document.getElementById("retake").hidden = false;
      update();
      form.width.focus();
    } catch (e) { fail(e); }
  };
  // a click on the top bar buttons must not open the camera
  cap.querySelector(".topbar").onclick = (e) => { if (e.target.closest(".icon-btn")) e.stopPropagation(); else e.preventDefault(); };
  if (!wall) setTimeout(() => cam.click(), 300);

  const roomsEl = document.getElementById("rooms");
  const pickRoom = (r) => {
    room = room === r ? null : r;
    roomsEl.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c.dataset.r === room));
  };
  roomsEl.onclick = (e) => { const c = e.target.closest(".chip"); if (c) pickRoom(c.dataset.r); };
  const addRoom = () => {
    const inp = document.getElementById("newroom");
    const r = inp.value.trim();
    if (!r) return;
    if (!roomsEl.querySelector(`[data-r="${CSS.escape(r)}"]`)) {
      roomsEl.insertAdjacentHTML("beforeend", `<button type="button" class="chip chip-room" aria-pressed="false" data-r="${esc(r)}">${esc(r)}</button>`);
    }
    room = null;
    pickRoom(r);
    inp.value = "";
  };
  document.getElementById("addroom").onclick = addRoom;
  document.getElementById("newroom").onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); addRoom(); } };

  const chips = document.getElementById("chips");
  chips.onclick = (e) => {
    const c = e.target.closest(".chip");
    if (!c) return;
    const on = c.getAttribute("aria-pressed") !== "true";
    c.setAttribute("aria-pressed", on);
    on ? selected.add(c.dataset.m) : selected.delete(c.dataset.m);
    update();
  };
  const addMat = async () => {
    const inp = document.getElementById("newmat");
    const m = inp.value.trim();
    if (!m) return;
    if (!catalog.some((c) => c.name === m)) {
      catalog.push({ name: m, sheet_w: null, sheet_h: null, waste: 0 });
      await api.saveCatalog(catalog);
      toast("أضيفت المادة — حدّد مقاس لوحها من ⚙️ مقاسات الألواح");
    }
    selected.add(m);
    update();
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
    try { await api.deleteWall(wall.id); go(`#/p/${projectId}`); } catch (err) { fail(err); }
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const next = e.submitter?.value === "next";
    const b = busy("جاري الحفظ…");
    try {
      const row = {
        id: wall?.id || null,
        project_id: projectId,
        name: form.name.value.trim() || `جدار ${idx + 1}`,
        room,
        width_cm: parseFloat(form.width.value) || null,
        height_cm: parseFloat(form.height.value) || null,
        materials: [...selected],
        notes: form.notes.value.trim() || null,
        photo,
        thumb,
      };
      const saved = await api.saveWall(row);
      if (photo) Object.assign(imageCache, { [saved.photo_id]: URL.createObjectURL(photo), [saved.thumb_id]: URL.createObjectURL(thumb) });
      toast(`تم حفظ ${row.name} ✓`);
      if (next) {
        // hashchange won't fire for the same hash, so re-render directly
        if (location.hash === `#/p/${projectId}/wall/new`) route(); else go(`#/p/${projectId}/wall/new`);
      } else go(`#/p/${projectId}`);
    } catch (err) { fail(err); } finally { b.done(); }
  };
}

/* ---------- PDF report ---------- */

// html2canvas draws each text run at (text box top + its own baseline estimate). The estimate is
// off by a few px on iPhone (≈1px on Chrome), which pushes text down inside badges. Measure the
// real baseline in this browser for every font html2canvas uses, and shift fillText by the error.
const baselineErrors = new Map();
function baselineError(font) {
  if (baselineErrors.has(font)) return baselineErrors.get(font);
  const probe = document.createElement("div");
  probe.style.font = font;
  const { fontFamily, fontSize } = probe.style;
  const host = document.createElement("div");
  host.style.cssText = "position:absolute;left:-9999px;top:0;white-space:nowrap";
  host.style.font = font;
  const text = document.createTextNode("Hidden Text");
  const mark = document.createElement("span");
  mark.style.cssText = "display:inline-block;width:1px;height:0;vertical-align:baseline";
  host.append(text, mark);
  // same measurement html2canvas does (FontMetrics.parseMetrics)
  const box = document.createElement("div");
  box.style.cssText = "visibility:hidden;margin:0;padding:0;white-space:nowrap";
  Object.assign(box.style, { fontFamily, fontSize });
  const span = document.createElement("span");
  Object.assign(span.style, { fontFamily, fontSize, margin: "0", padding: "0" });
  span.textContent = "Hidden Text";
  const img = document.createElement("img");
  img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  img.width = img.height = 1;
  img.style.cssText = "margin:0;padding:0;vertical-align:baseline";
  box.append(span, img);
  document.body.append(host, box);
  const range = document.createRange();
  range.setStart(text, 0);
  range.setEnd(text, text.length);
  const actual = mark.getBoundingClientRect().top - range.getBoundingClientRect().top;
  const estimate = img.offsetTop - span.offsetTop + 2;
  host.remove();
  box.remove();
  const err = Number.isFinite(estimate - actual) && Math.abs(estimate - actual) < 40 ? estimate - actual : 0;
  baselineErrors.set(font, err);
  return err;
}

async function withBaselineFix(render) {
  const proto = CanvasRenderingContext2D.prototype;
  const fillText = proto.fillText;
  proto.fillText = function (text, x, y, ...rest) {
    return fillText.call(this, text, x, this.textBaseline === "alphabetic" ? y - baselineError(this.font) : y, ...rest);
  };
  try { return await render(); } finally { proto.fillText = fillText; }
}
// Each A4 page is built as HTML and rasterised separately: keeps Arabic shaping
// correct and stays under mobile canvas size limits for large projects.
async function buildPdf(p, walls, catalog, onProgress) {

  const photos = {};
  const withPhoto = walls.filter((w) => w.photo_id);
  onProgress("تجهيز الصور…");
  await images(withPhoto.map((w) => w.photo_id));
  for (const w of withPhoto) {
    const src = imageCache[w.photo_id];
    if (src) photos[w.id] = { src, ...(await imgSize(src)) };
  }

  const total = walls.reduce((s, w) => s + areaM2(w), 0);
  const qty = quantities(walls, catalog);
  const rooms = groupByRoom(walls);
  const ordered = rooms.flatMap((g) => g.walls);
  const codeOf = (w) => code(ordered.indexOf(w));
  const no = reportNo(p);
  const issued = dateAr(new Date());

  // schedule = room header rows + wall rows, paginated so long projects never overflow a page
  const ROWS_PER_PAGE = 22;
  const schedRows = rooms.flatMap((g) => [{ g }, ...g.walls.map((w) => ({ w }))]);
  const schedChunks = [];
  for (let i = 0; i < schedRows.length; i += ROWS_PER_PAGE) schedChunks.push(schedRows.slice(i, i + ROWS_PER_PAGE));
  // wall details: each room starts on its own page, two walls per page
  const wallPages = rooms.flatMap((g) => {
    const out = [];
    for (let i = 0; i < g.walls.length; i += 2) out.push({ g, pair: g.walls.slice(i, i + 2), part: i / 2 });
    return out;
  });
  // rooms summary moves off the summary page when there are many materials and rooms
  const roomsOwnPage = qty.length + rooms.length > 13;
  const pageCount = 2 + (roomsOwnPage ? 1 : 0) + schedChunks.length + wallPages.length;

  const head = () => `
    <div class="ph-head">
      <div class="ph-brand"><img src="${A.mark}" alt=""><div><div class="t">${COMPANY.ar}</div><div class="s">${COMPANY.en}</div></div></div>
      <div class="ph-meta"><b>${esc(p.name)}</b><br>تقرير رفع مقاسات · <span class="num">${no}</span></div>
    </div>`;
  const foot = (n) => `
    <div class="pg-foot"><span>${issued} · ${esc([p.client, p.location].filter(Boolean).join(" · "))}</span><span class="pn">${n} / ${pageCount}</span></div>
    <div class="pg-band"></div>`;
  const pages = [];
  const addPage = (body) => pages.push(`${head()}<div class="pg-body">${body}</div>${foot(pages.length + 1)}`);
  const sign = `<div class="sign"><div>أعدّه</div><div>اعتمده</div><div>التاريخ</div></div>`;

  // 1 — cover
  pages.push(`
    <div class="cv-top">
      <div class="cv-stripes"></div><div class="cv-glow"></div>
      <img class="cv-mark" src="${A.markWhite}" alt="">
      <img class="cv-logo" src="${A.logoWhite}" alt="">
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
        <div class="cv-item"><div class="k">الغرف / الجدران</div><div class="v">${rooms.length} غرف · ${walls.length} جدار</div></div>
        <div class="cv-item"><div class="k">إجمالي المساحة</div><div class="v num" style="text-align:right">${num(total)} m²</div></div>
      </div>
      <div class="cv-foot"><span><b>${COMPANY.ar}</b> · ${COMPANY.en}</span><span>وثيقة خاصة</span></div>
    </div>
    <div class="cv-band"></div>`);

  const roomsTable = `
    <h3 class="h-sec">ملخص الغرف <small>ROOMS</small></h3>
    <table class="tbl">
      <thead><tr><th>الغرفة</th><th>الجدران</th><th>المواد</th><th class="c-num">المساحة m²</th></tr></thead>
      <tbody>${rooms.map((g) => `<tr><td><b>${esc(g.room)}</b></td><td>${g.walls.map(codeOf).join("، ")}</td>
        <td>${esc([...new Set(g.walls.flatMap((w) => w.materials || []))].join(" + ") || "—")}</td><td class="c-num">${num(g.area)}</td></tr>`).join("")}</tbody>
      <tfoot><tr><td colspan="3">الإجمالي</td><td class="c-num">${num(total)}</td></tr></tfoot>
    </table>`;

  // 2 — summary: quantities to order + rooms
  addPage(`
    <h3 class="h-sec">ملخص المشروع <small>SUMMARY</small></h3>
    <div class="kp-row">
      <div class="kp dark"><div class="k">إجمالي المساحة</div><div class="v num" style="text-align:right">${num(total)} <small>m²</small></div></div>
      <div class="kp"><div class="k">الغرف</div><div class="v">${rooms.length}</div></div>
      <div class="kp"><div class="k">الجدران</div><div class="v">${walls.length}</div></div>
    </div>
    ${qty.length ? `
    <h3 class="h-sec">الكميات المطلوبة للتوريد <small>QUANTITIES</small></h3>
    <table class="tbl qty">
      <thead><tr><th>المادة</th><th class="c-num">الجدران</th><th class="c-num">مجموع العرض cm</th><th class="c-num">المساحة m²</th><th class="c-num">مقاس اللوح</th><th class="c-num">الكمية</th></tr></thead>
      <tbody>${qty.map((q) => `<tr><td><b>${esc(q.name)}</b></td><td class="c-num">${q.walls}</td><td class="c-num">${num(q.width)}</td>
        <td class="c-num">${num(q.area)}</td><td class="c-num">${q.size || "—"}</td>
        <td class="c-num q-cell">${q.sheets != null ? `${q.sheets} لوح` : `${num(q.gross)} m²${q.waste ? ` (+${q.waste}%)` : ""}`}</td></tr>`).join("")}</tbody>
    </table>` : ""}
    ${roomsOwnPage ? "" : roomsTable}
    ${sign}`);
  if (roomsOwnPage) addPage(roomsTable);

  // 3 — wall schedule grouped by room
  schedChunks.forEach((rows, ci) => {
    const last = ci === schedChunks.length - 1;
    addPage(`
      <h3 class="h-sec">جدول الجدران${ci ? " (تابع)" : ""} <small>SCHEDULE</small></h3>
      <table class="tbl">
        <thead><tr><th>الرمز</th><th>الجدار</th><th>المواد</th><th class="c-num">العرض × الارتفاع (cm)</th><th class="c-num">المساحة m²</th></tr></thead>
        <tbody>${rows.map((r) => r.g
          ? `<tr class="room-row"><td colspan="4">${esc(r.g.room)} <span>· ${r.g.walls.length} جدار</span></td><td class="c-num">${num(r.g.area)}</td></tr>`
          : `<tr><td class="c-code">${codeOf(r.w)}</td><td>${esc(r.w.name)}</td><td>${esc((r.w.materials || []).join(" + ") || "—")}</td>
             <td class="c-num">${dims(r.w)}</td><td class="c-num">${num(areaM2(r.w))}</td></tr>`).join("")}</tbody>
        ${last ? `<tfoot><tr><td colspan="4">الإجمالي</td><td class="c-num">${num(total)}</td></tr></tfoot>` : ""}
      </table>`);
  });

  // 4 — wall details, by room
  const BOX_W = 430, BOX_H = 330;
  wallPages.forEach(({ g, pair, part }) => {
    const body = `<h3 class="h-sec">${esc(g.room)}${part ? " (تابع)" : ""} <small>${g.walls.length} جدار · ${num(g.area)} m²</small></h3>` + pair.map((w) => {
      const ph = photos[w.id];
      let photo = `<span class="none">لا توجد صورة</span>`;
      if (ph) {
        const sc = Math.min(BOX_W / ph.w, BOX_H / ph.h);
        const W = Math.round(ph.w * sc), H = Math.round(ph.h * sc);
        photo = `<div class="wb-photo" style="width:${W}px;height:${H}px">
          <img src="${ph.src}" width="${W}" height="${H}" alt="">
          ${w.width_cm ? `<div class="pdim pw"><span class="lab" style="left:50%;top:-12px;transform:translateX(-50%)">${num(w.width_cm)} cm</span></div>` : ""}
          ${w.height_cm ? `<div class="pdim ph"><span class="lab" style="top:50%;left:-34px;transform:translateY(-50%) rotate(-90deg)">${num(w.height_cm)} cm</span></div>` : ""}
        </div>`;
      }
      return `
        <div class="wb">
          <div class="wb-head"><span class="wb-code">${codeOf(w)}</span><span class="wb-name">${esc(w.name)}</span><span class="wb-area">${num(areaM2(w))} m²</span></div>
          <div class="wb-main">
            <div class="wb-frame">${photo}</div>
            <div class="wb-side">
              <div class="spec">
                <div><span>الغرفة</span><b style="direction:rtl">${esc(g.room)}</b></div>
                <div><span>العرض</span><b>${w.width_cm ? num(w.width_cm) + " cm" : "—"}</b></div>
                <div><span>الارتفاع</span><b>${w.height_cm ? num(w.height_cm) + " cm" : "—"}</b></div>
                <div><span>المساحة</span><b>${num(areaM2(w))} m²</b></div>
              </div>
              ${w.materials?.length ? `<div><div class="wb-k">المواد</div><div class="mtags">${w.materials.map((m) => { const n = wallSheets(w, catalog.find((c) => c.name === m)); return `<span>${esc(m)}${n ? ` · ${n} لوح` : ""}</span>`; }).join("")}</div></div>` : ""}
              ${w.notes ? `<div><div class="wb-k">ملاحظات</div><div class="wb-notes">${esc(w.notes)}</div></div>` : ""}
            </div>
          </div>
        </div>`;
    }).join("");
    addPage(body);
  });

  return renderPages(pages, { title: `${p.name} — ${no}`, subject: "Site measurement report" }, onProgress);
}

// rasterise A4 page HTML snippets one by one into a PDF blob
async function renderPages(pages, props, onProgress) {
  const stage = document.getElementById("pdf-stage");
  await Promise.all(["400", "500", "600", "700"].map((w) => document.fonts.load(`${w} 16px "Readex Pro"`, "عربي MH")));
  const pdf = new jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  pdf.setProperties({ author: COMPANY.en, ...props });
  for (const [i, html] of pages.entries()) {
    onProgress(`إنشاء الصفحة ${i + 1} / ${pages.length}`);
    const el = document.createElement("div");
    el.className = "pg";
    el.innerHTML = html;
    stage.appendChild(el);
    await Promise.all([...el.querySelectorAll("img")].map((im) => (im.complete ? null : new Promise((r) => { im.onload = im.onerror = r; }))));
    const canvas = await withBaselineFix(() => html2canvas(el, { scale: 2, backgroundColor: "#ffffff", logging: false, useCORS: true }));
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

// share sheet on phones (WhatsApp, Files, Drive…), plain download elsewhere
async function shareFile(blob, name) {
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  saveBlob(blob, name);
}

async function closeProject(p, walls, catalog) {
  const b = busy("جاري إصدار التقرير…");
  try {
    const blob = await buildPdf(p, walls, catalog, b.set);
    await api.saveReport(p.id, blob);
    toast("تم إقفال المشروع وحفظ التقرير ✓");
    route();
  } catch (e) { fail(e); } finally { b.done(); }
}

/* ---------- settings: storage + backup ---------- */
const fmtMB = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;
let backupBlob = null;

async function renderSettings() {
  const est = (await navigator.storage?.estimate?.()) || {};
  const persisted = (await navigator.storage?.persisted?.()) || false;
  const projects = await api.listProjects();
  const stamp = new Date().toISOString().slice(0, 10);

  view.innerHTML = `
    <header class="hero" style="padding-bottom:40px">
      <div class="hero-bar"><a class="icon-btn" href="#/" aria-label="رجوع">${ic("back")}</a><img src="${A.markWhite}" alt="" style="width:30px"></div>
      <div class="eyebrow">الإعدادات</div>
      <h1>البيانات والنسخ الاحتياطي</h1>
      <div class="sub">كل المشاريع والصور محفوظة على هذا الجهاز فقط</div>
    </header>
    <div class="sheet form">
      <div class="kpis" style="margin:0;grid-template-columns:repeat(2,1fr)">
        <div class="kpi" style="background:var(--bg);border-color:var(--line)"><div class="v" style="color:var(--navy)">${projects.length}</div><div class="l" style="color:var(--muted)">مشروع محفوظ</div></div>
        <div class="kpi" style="background:var(--bg);border-color:var(--line)"><div class="v num" style="color:var(--navy);text-align:right">${est.usage != null ? fmtMB(est.usage) : "—"}</div><div class="l" style="color:var(--muted)">المساحة المستخدمة</div></div>
      </div>
      <div class="area-chip" style="background:${persisted ? "var(--ok-soft)" : "var(--copper-soft)"};color:${persisted ? "var(--ok)" : "var(--copper)"}">
        <span style="color:inherit">${persisted ? "البيانات محمية من الحذف التلقائي" : "الحماية من الحذف التلقائي غير مفعّلة"}</span>${ic(persisted ? "shield" : "lock")}
      </div>
      ${persisted ? "" : `<button class="btn btn-soft" id="persist">${ic("shield")} تفعيل الحماية</button>`}

      <a class="btn" href="#/materials" style="justify-content:space-between">${ic("ruler")} المواد والأسعار ومقاسات الألواح ${ic("chev", "ico-sm")}</a>
      <a class="btn" href="#/company" style="justify-content:space-between">${ic("file")} بيانات الشركة وشروط العرض ${ic("chev", "ico-sm")}</a>

      <div class="field"><span>نسخة احتياطية</span>
        <button class="btn btn-primary" id="export">${ic("download")} تجهيز نسخة احتياطية</button>
        <div class="muted" style="font-size:12.5px;color:var(--muted)">ملف واحد فيه كل المشاريع والصور والتقارير. احفظه في Drive أو الملفات بشكل دوري.</div>
      </div>
      <div class="field"><span>استرجاع</span>
        <label class="btn">${ic("upload")} استرجاع من نسخة احتياطية<input type="file" id="import" accept=".json,application/json" hidden></label>
      </div>
      <div class="muted" style="font-size:12.5px;color:var(--muted);line-height:1.8">
        💡 على الآيفون: افتح التطبيق دائماً من أيقونته في الشاشة الرئيسية، لأن بيانات Safari منفصلة عن بيانات الأيقونة.
      </div>
    </div>`;

  const persistBtn = document.getElementById("persist");
  if (persistBtn) persistBtn.onclick = async () => {
    const ok = await navigator.storage?.persist?.();
    toast(ok ? "تم تفعيل الحماية ✓" : "المتصفح رفض — أضف التطبيق للشاشة الرئيسية ثم حاول مرة ثانية");
    route();
  };

  const exportBtn = document.getElementById("export");
  exportBtn.onclick = async () => {
    // two taps: build first, then share inside a fresh user gesture (required on iOS)
    if (backupBlob) return shareFile(backupBlob, `hectar-backup-${stamp}.json`);
    const b = busy("تجهيز النسخة الاحتياطية…");
    try {
      backupBlob = await exportBackup();
      exportBtn.innerHTML = `${ic("share")} حفظ النسخة (${fmtMB(backupBlob.size)})`;
      exportBtn.classList.replace("btn-primary", "btn-accent");
    } catch (e) { fail(e); } finally { b.done(); }
  };

  document.getElementById("import").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file || !confirm("استرجاع النسخة؟ المشاريع الموجودة تبقى، والمكررة تُستبدل.")) return;
    const b = busy("جاري الاسترجاع…");
    try {
      const n = await importBackup(file);
      toast(`تم استرجاع ${n} مشروع وعرض ✓`);
      go("#/");
    } catch (err) { fail(err); } finally { b.done(); }
  };
}

/* ---------- materials catalog: sheet sizes + waste ---------- */
async function renderMaterials() {
  const catalog = await api.getCatalog();
  const row = (c) => `
    <div class="card matrow">
      <div class="matrow-top">
        <input class="input" name="name" value="${esc(c.name)}" placeholder="اسم المادة" required>
        <button type="button" class="icon-btn del" aria-label="حذف">${ic("trash")}</button>
      </div>
      <div class="matrow-grid">
        <label><span>عرض اللوح</span><div class="in"><input name="w" type="number" inputmode="decimal" step="any" min="0" value="${c.sheet_w ?? ""}" placeholder="—"><i>cm</i></div></label>
        <label><span>طول اللوح</span><div class="in"><input name="h" type="number" inputmode="decimal" step="any" min="0" value="${c.sheet_h ?? ""}" placeholder="—"><i>cm</i></div></label>
        <label><span>هدر (للمتر)</span><div class="in"><input name="waste" type="number" inputmode="decimal" step="any" min="0" value="${c.waste ?? 0}"><i>%</i></div></label>
        <label><span>السعر (لوح أو م²)</span><div class="in"><input name="price" type="number" inputmode="decimal" step="any" min="0" value="${c.price ?? ""}" placeholder="—"><i>ر.س</i></div></label>
      </div>
    </div>`;

  view.innerHTML = `
    <header class="hero" style="padding-bottom:40px">
      <div class="hero-bar"><a class="icon-btn" href="#/settings" aria-label="رجوع">${ic("back")}</a><img src="${A.markWhite}" alt="" style="width:30px"></div>
      <div class="eyebrow">المواد</div>
      <h1>المواد والأسعار</h1>
      <div class="sub">الألواح تنحسب بعرض الجدار ÷ عرض اللوح، مقرّبة للأعلى (360 ÷ 120 = 3 ألواح). اترك العرض فاضي للمواد اللي تنحسب بالمتر (مثل الدهان).</div>
    </header>
    <form class="sheet form" id="f">
      <div id="list" class="wlist">${catalog.map(row).join("")}</div>
      <button type="button" class="btn btn-soft" id="add">${ic("plus")} إضافة مادة</button>
      <div class="actionbar"><div class="inner"><button class="btn btn-primary">${ic("check")} حفظ</button></div></div>
    </form>`;

  const list = document.getElementById("list");
  list.onclick = (e) => { if (e.target.closest(".del")) e.target.closest(".matrow").remove(); };
  document.getElementById("add").onclick = () => {
    list.insertAdjacentHTML("beforeend", row({ name: "", sheet_w: null, sheet_h: null, waste: 10 }));
    list.lastElementChild.querySelector("input").focus();
  };
  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const items = [...list.querySelectorAll(".matrow")].map((r) => {
      const v = (n) => r.querySelector(`[name=${n}]`).value.trim();
      return { name: v("name"), sheet_w: parseFloat(v("w")) || null, sheet_h: parseFloat(v("h")) || null, waste: parseFloat(v("waste")) || 0, price: parseFloat(v("price")) || null };
    }).filter((c) => c.name);
    try {
      await api.saveCatalog(items);
      toast("تم حفظ المواد ✓");
      history.back();
    } catch (err) { fail(err); }
  };
}

const blobToDataUrl = (blob) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(blob);
});

async function exportBackup() {
  const { projects, walls, quotes, keys, blobs, metaKeys, metaVals } = await tx(["projects", "walls", "quotes", "files", "meta"], "readonly", async (s) => {
    const [projects, walls, quotes, keys, metaKeys, metaVals] = await Promise.all([
      req(s.projects.getAll()), req(s.walls.getAll()), req(s.quotes.getAll()), req(s.files.getAllKeys()), req(s.meta.getAllKeys()), req(s.meta.getAll()),
    ]);
    const blobs = await Promise.all(keys.map((k) => req(s.files.get(k))));
    return { projects, walls, quotes, keys, blobs, metaKeys, metaVals };
  });
  const files = {};
  for (const [i, k] of keys.entries()) files[k] = await blobToDataUrl(blobs[i]);
  const meta = Object.fromEntries(metaKeys.map((k, i) => [k, metaVals[i]]));
  const data = { app: "hectar-measure", version: 3, exported_at: nowIso(), projects, walls, quotes, files, meta, materials: await api.getCatalog() };
  return new Blob([JSON.stringify(data)], { type: "application/json" });
}

async function importBackup(file) {
  const data = JSON.parse(await file.text());
  if (data.app !== "hectar-measure") throw new Error("هذا الملف ليس نسخة احتياطية من التطبيق");
  const files = await Promise.all(Object.entries(data.files || {}).map(async ([k, url]) => [k, await (await fetch(url)).blob()]));
  await tx(["projects", "walls", "quotes", "files", "meta"], "readwrite", async (s) => {
    data.projects.forEach((p) => s.projects.put(p));
    data.walls.forEach((w) => s.walls.put(w));
    (data.quotes || []).forEach((q) => s.quotes.put(q));
    files.forEach(([k, blob]) => s.files.put(blob, k));
    // company info, terms, counters — keep anything already set on this device
    for (const [k, v] of Object.entries(data.meta || {})) if (k !== "materials" && v != null) s.meta.put(v, k);
  });
  if (data.materials) {
    const current = await api.getCatalog();
    const merged = [...current.filter((c) => !data.materials.some((m) => m.name === c.name)), ...data.materials];
    await api.saveCatalog(merged);
  }
  return data.projects.length + (data.quotes || []).length;
}

