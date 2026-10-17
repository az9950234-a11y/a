"use strict";
// زوار الموقع — hectar.sa analytics (GA4) via the site's protected /api/app-stats endpoint.
// The last result per period is kept on the device so the screen opens instantly and offline.

const WEB_DEFAULT_URL = "https://hectar.sa/api/app-stats";
const WEB_RANGES = [{ days: 7, label: "7 أيام" }, { days: 28, label: "28 يوم" }, { days: 90, label: "90 يوم" }];
const rangeLabel = (days) => `آخر ${WEB_RANGES.find((r) => r.days === days)?.label || `${days} يوم`}`;
const CONTACT_LABELS = {
  whatsapp_click: "واتساب",
  phone_click: "اتصال",
  quote_form_submit: "نموذج عرض السعر",
  catalog_download: "تحميل كتالوج",
  directions_click: "الاتجاهات على الخريطة",
  review_click: "صفحة التقييم",
};
const CHANNEL_AR = {
  "Organic Search": "بحث جوجل", Direct: "مباشر", "Organic Social": "سوشال ميديا", Referral: "مواقع أخرى",
  "Paid Search": "إعلانات بحث", "Paid Social": "إعلانات سوشال", "Organic Maps": "خرائط جوجل", "Organic Video": "يوتيوب",
  Email: "بريد", Unassigned: "غير محدد", "Cross-network": "إعلانات متعددة", Display: "إعلانات عرض",
};
const CITY_AR = {
  Jeddah: "جدة", Riyadh: "الرياض", Mecca: "مكة", Medina: "المدينة", Dammam: "الدمام", Taif: "الطائف", Khobar: "الخبر",
  "Al Khobar": "الخبر", Abha: "أبها", Tabuk: "تبوك", Buraidah: "بريدة", Yanbu: "ينبع", Rabigh: "رابغ", "(not set)": "غير محدد",
};
const DEVICE_AR = { mobile: "جوال", desktop: "كمبيوتر", tablet: "تابلت" };
let webDays = 28;

const getWebConfig = async () => (await api.getMeta("webStats")) || { url: WEB_DEFAULT_URL, token: "" };

async function fetchWebStats(days) {
  const cfg = await getWebConfig();
  if (!cfg.token) throw Object.assign(new Error("not_configured"), { code: "setup" });
  let res;
  try {
    res = await fetch(`${cfg.url}?days=${days}`, { headers: { Authorization: `Bearer ${cfg.token}` } });
  } catch {
    throw new Error("لا يوجد اتصال بالإنترنت");
  }
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) throw Object.assign(new Error("المفتاح غير صحيح"), { code: "setup" });
  if (body.error === "not_configured") throw Object.assign(new Error("ربط Google Analytics لم يكتمل في الموقع"), { code: "server" });
  if (!res.ok) throw new Error(body.message || `خطأ ${res.status}`);
  const cache = (await api.getMeta("webStatsCache")) || {};
  cache[days] = body;
  await api.setMeta("webStatsCache", cache);
  return body;
}

const pct = (cur, prev) => (prev ? Math.round(((cur - prev) / prev) * 100) : null);
const deltaTag = (cur, prev) => {
  const p = pct(cur, prev);
  return p == null ? "" : `<span class="d ${p >= 0 ? "up" : "down"}">${p >= 0 ? "▲" : "▼"} ${Math.abs(p)}%</span>`;
};
const minutes = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")} د` : `${Math.round(s)} ث`);
const cleanTitle = (t, path) => (t || path).split(/\s[|–—-]\s/)[0].trim() || path;

async function renderWeb() {
  const cache = (await api.getMeta("webStatsCache")) || {};
  const cfg = await getWebConfig();
  if (!cfg.token) return renderWebSetup();
  drawWeb(cache[webDays] || null, true);
  try {
    const data = await fetchWebStats(webDays);
    if (location.hash.startsWith("#/web") && !location.hash.includes("setup")) drawWeb(data, false);
  } catch (e) {
    if (e.code === "setup") return renderWebSetup(e.message);
    const status = document.getElementById("web-status");
    if (status) status.textContent = cache[webDays] ? `آخر تحديث ${dateTime(cache[webDays].updatedAt)} · تعذر التحديث: ${e.message}` : `تعذر جلب البيانات: ${e.message}`;
  }
}

const dateTime = (iso) => new Date(iso).toLocaleString("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function drawWeb(d, loading) {
  const t = d?.totals;
  const contactsCur = d ? Object.values(d.contacts).reduce((s, c) => s + c.cur, 0) : 0;
  const contactsPrev = d ? Object.values(d.contacts).reduce((s, c) => s + c.prev, 0) : 0;
  const maxOf = (rows, k) => Math.max(1, ...rows.map((r) => r[k]));
  const share = (rows, k) => { const total = rows.reduce((s, r) => s + r[k], 0) || 1; return (v) => `${Math.round((v / total) * 100)}%`; };

  view.innerHTML = `
    <header class="hero" style="padding-bottom:44px">
      <div class="hero-bar">
        <a class="icon-btn" href="#/" aria-label="الرئيسية">${ic("back")}</a>
        <a class="icon-btn" href="#/web/setup" aria-label="إعدادات الربط">${ic("settings")}</a>
      </div>
      <div class="eyebrow">زوار الموقع · hectar.sa</div>
      <div class="hero-figure">
        <small>الزوار · ${rangeLabel(webDays)}</small>
        <b>${t ? num(t.cur.users) : "—"}<span> زائر</span></b>
        ${t && pct(t.cur.users, t.prev.users) != null ? `<span class="delta ${t.cur.users >= t.prev.users ? "up" : "down"}">${t.cur.users >= t.prev.users ? "▲" : "▼"} ${Math.abs(pct(t.cur.users, t.prev.users))}% عن الفترة السابقة</span>` : ""}
      </div>
    </header>

    <div class="segment stats-filter" id="range">
      ${WEB_RANGES.map((r) => `<button data-d="${r.days}" aria-pressed="${r.days === webDays}">${r.label}</button>`).join("")}
    </div>
    <div class="web-status" id="web-status">${loading ? (d ? `جاري التحديث… (المعروض من ${dateTime(d.updatedAt)})` : "جاري جلب البيانات…") : `محدّث ${dateTime(d.updatedAt)}`}</div>

    ${d ? `
    <section class="stat-grid">
      <div class="card stat"><span class="l">طلبات تواصل</span><b>${num(contactsCur)}</b><small>${deltaTag(contactsCur, contactsPrev) || "واتساب + اتصال + نموذج"}</small></div>
      <div class="card stat"><span class="l">الزيارات</span><b>${num(t.cur.sessions)}</b><small>${deltaTag(t.cur.sessions, t.prev.sessions) || "&nbsp;"}</small></div>
      <div class="card stat"><span class="l">مشاهدات الصفحات</span><b>${compact(t.cur.views)}</b><small>${deltaTag(t.cur.views, t.prev.views) || "&nbsp;"}</small></div>
      <div class="card stat"><span class="l">متوسط وقت الزائر</span><b>${minutes(t.cur.engagementPerUser)}</b><small>${deltaTag(t.cur.engagementPerUser, t.prev.engagementPerUser) || "&nbsp;"}</small></div>
    </section>

    <section class="section">
      <div class="card chart-card">
        <div class="chart-head"><h2>الزوار يومياً</h2><span>${rangeLabel(webDays)}</span></div>
        <div class="chart" id="daily"></div>
      </div>
    </section>

    <section class="section">
      <div class="card chart-card">
        <div class="chart-head"><h2>تواصل العملاء</h2><span>مقارنة بالفترة السابقة</span></div>
        ${hbars(Object.entries(d.contacts).filter(([, c]) => c.cur || c.prev).map(([k, c]) => ({ label: CONTACT_LABELS[k] || k, value: c.cur, color: VIZ.accepted, sub: c.prev ? `قبلها ${num(c.prev)}` : "" })), (v) => num(v))}
        ${contactsCur || contactsPrev ? "" : `<div class="muted-note">لا توجد ضغطات على أزرار التواصل في هذه الفترة</div>`}
      </div>
    </section>

    ${d.pages.length ? `<section class="section"><div class="card chart-card">
      <div class="chart-head"><h2>أكثر الصفحات زيارة</h2><span>مشاهدات</span></div>
      ${hbars(d.pages.map((p) => ({ label: cleanTitle(p.title, p.path), value: p.views, color: VIZ.issued })), (v) => num(v))}
    </div></section>` : ""}

    ${d.channels.length ? `<section class="section"><div class="card chart-card">
      <div class="chart-head"><h2>من وين يجون الزوار</h2><span>نسبة الزيارات</span></div>
      ${hbars(d.channels.map((c) => ({ label: CHANNEL_AR[c.name] || c.name, value: c.sessions, color: VIZ.issued })), share(d.channels, "sessions"))}
    </div></section>` : ""}

    <section class="section two-col">
      ${d.cities.length ? `<div class="card chart-card">
        <div class="chart-head"><h2>المدن</h2></div>
        ${hbars(d.cities.map((c) => ({ label: CITY_AR[c.name] || c.name, value: c.users, color: VIZ.issued })), share(d.cities, "users"))}
      </div>` : ""}
      ${d.devices.length ? `<div class="card chart-card">
        <div class="chart-head"><h2>الأجهزة</h2></div>
        ${hbars(d.devices.map((c) => ({ label: DEVICE_AR[c.name] || c.name, value: c.users, color: VIZ.issued })), share(d.devices, "users"))}
      </div>` : ""}
    </section>
    ` : `<div class="empty"><div class="em-ico">${ic("chart")}</div><b>${loading ? "جاري التحميل…" : "لا توجد بيانات"}</b></div>`}`;

  document.getElementById("range").onclick = (e) => {
    const days = Number(e.target.closest("button")?.dataset.d);
    if (days && days !== webDays) { webDays = days; renderWeb(); }
  };
  const daily = document.getElementById("daily");
  if (daily && d.daily.length) {
    drawLine(daily, d.daily);
    const ro = new ResizeObserver(() => { if (document.body.contains(daily)) drawLine(daily, d.daily); else ro.disconnect(); });
    ro.observe(daily);
  }
}

/* ---------- single-series area line with crosshair tooltip ---------- */
function drawLine(el, rows) {
  const W = el.clientWidth || 340, H = 190, pad = { t: 12, r: 10, b: 24, l: 34 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const max = niceMax(Math.max(...rows.map((r) => r.users)));
  const x = (i) => pad.l + (rows.length > 1 ? (i / (rows.length - 1)) * iw : iw / 2);
  const y = (v) => pad.t + ih - (v / max) * ih;
  const pts = rows.map((r, i) => [x(i), y(r.users)]);
  const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  const area = `${line} L${pts.at(-1)[0].toFixed(1)},${pad.t + ih} L${pts[0][0].toFixed(1)},${pad.t + ih} Z`;
  const label = (s) => { const d = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`); return { short: `${d.getDate()}/${d.getMonth() + 1}`, long: dateAr(d) }; };
  const step = Math.ceil(rows.length / 5);
  const last = pts.at(-1);
  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="الزوار يومياً">
      ${[0, 0.5, 1].map((f) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(f * max)}" y2="${y(f * max)}" stroke="${VIZ.grid}"/>
        <text x="${pad.l - 6}" y="${y(f * max) + 4}" text-anchor="end" class="tick">${compact(f * max)}</text>`).join("")}
      <path d="${area}" fill="${VIZ.issued}" opacity="0.1"/>
      <path d="${line}" fill="none" stroke="${VIZ.issued}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${rows.map((r, i) => (i % step === 0 || i === rows.length - 1) && (i === rows.length - 1 || rows.length - 1 - i >= step / 2) ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" class="tick">${label(r.date).short}</text>` : "").join("")}
      <circle cx="${last[0]}" cy="${last[1]}" r="4" fill="${VIZ.issued}" stroke="#fff" stroke-width="2"/>
      <line class="cross" x1="0" x2="0" y1="${pad.t}" y2="${pad.t + ih}" stroke="${VIZ.axis}" stroke-width="1" visibility="hidden"/>
      <circle class="cross-dot" r="4" fill="${VIZ.issued}" stroke="#fff" stroke-width="2" visibility="hidden"/>
      <rect class="hitarea" x="${pad.l}" y="0" width="${iw}" height="${H}" fill="transparent"/>
    </svg>
    <div class="tip" hidden></div>`;

  const svg = el.querySelector("svg"), tip = el.querySelector(".tip");
  const cross = el.querySelector(".cross"), dot = el.querySelector(".cross-dot");
  const move = (e) => {
    const box = svg.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    const i = Math.max(0, Math.min(rows.length - 1, Math.round(((px - pad.l) / iw) * (rows.length - 1))));
    const [cx, cy] = pts[i];
    cross.setAttribute("x1", cx); cross.setAttribute("x2", cx); cross.setAttribute("visibility", "visible");
    dot.setAttribute("cx", cx); dot.setAttribute("cy", cy); dot.setAttribute("visibility", "visible");
    tip.replaceChildren();
    const h = document.createElement("div"); h.className = "tip-h"; h.textContent = label(rows[i].date).long;
    const row = document.createElement("div"); row.className = "tip-r";
    const k = document.createElement("i"); k.style.background = VIZ.issued;
    const v = document.createElement("b"); v.textContent = `${num(rows[i].users)} زائر`;
    const n = document.createElement("span"); n.textContent = `${num(rows[i].sessions)} زيارة`;
    row.append(k, v, n);
    tip.append(h, row);
    tip.hidden = false;
    tip.style.left = `${Math.min(Math.max(cx - tip.offsetWidth / 2, 0), W - tip.offsetWidth)}px`;
  };
  svg.addEventListener("pointermove", move);
  svg.addEventListener("pointerdown", move);
  svg.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse") return;
    tip.hidden = true; cross.setAttribute("visibility", "hidden"); dot.setAttribute("visibility", "hidden");
  });
}

/* ---------- connection setup ---------- */
async function renderWebSetup(problem = "") {
  const cfg = await getWebConfig();
  view.innerHTML = `
    <header class="hero" style="padding-bottom:40px">
      <div class="hero-bar"><a class="icon-btn" href="#/" aria-label="الرئيسية">${ic("back")}</a><img src="${A.markWhite}" alt="" style="width:30px"></div>
      <div class="eyebrow">زوار الموقع</div>
      <h1>ربط إحصائيات hectar.sa</h1>
      <div class="sub">مرة وحدة: الصق المفتاح السري اللي حطيته في Vercel باسم APP_STATS_TOKEN</div>
    </header>
    <form class="sheet form" id="f">
      ${problem ? `<div class="area-chip" style="background:#fbe9e6;color:var(--danger)"><span style="color:inherit">${esc(problem)}</span></div>` : ""}
      <label class="field"><span>المفتاح السري</span><input class="input ltr" name="token" type="password" autocomplete="off" value="${esc(cfg.token)}" required minlength="16"></label>
      <label class="field"><span>رابط الإحصائيات</span><input class="input ltr" name="url" type="url" value="${esc(cfg.url)}"></label>
      <div class="actionbar"><div class="inner"><button class="btn btn-primary">${ic("check")} حفظ وتجربة</button></div></div>
    </form>`;
  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api.setMeta("webStats", { url: fd.get("url").trim() || WEB_DEFAULT_URL, token: fd.get("token").trim() });
    await api.setMeta("webStatsCache", {});
    // the form may sit on #/web itself (shown when no key is saved), where go() would not re-render
    if (location.hash === "#/web") renderWeb(); else go("#/web");
  };
}
