"use strict";
// الإحصائيات — dashboard over quotes, measurement projects and walls. Read-only; every number
// comes from the same period filter so the tiles, charts and tables always agree.

// chart colours: brand navy stepped lighter + brand copper (validated: lightness band, chroma,
// CVD ΔE 23, normal-vision ΔE 29, ≥3:1 on the card surface)
const VIZ = { issued: "#2e64a0", accepted: "#c67710", grid: "#e9edf2", axis: "#8592a3" };
const STATUS_VIZ = {
  draft: { color: "#a3adba" },
  sent: { color: "#2e64a0" },
  accepted: { color: "#1e8a5a" },
  rejected: { color: "#c2412d" },
};
const PERIODS = [
  { key: "month", label: "هذا الشهر" },
  { key: "q", label: "3 أشهر" },
  { key: "year", label: "هذه السنة" },
  { key: "all", label: "الكل" },
];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
let statsPeriod = "month";

const compact = (n) => (Math.abs(n) >= 1e6 ? `${num(Math.round(n / 1e5) / 10)}M` : Math.abs(n) >= 1e3 ? `${num(Math.round(n / 100) / 10)}K` : num(Math.round(n)));
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

function periodRange(key, now = new Date()) {
  const y = now.getFullYear(), m = now.getMonth();
  if (key === "month") return { from: new Date(y, m, 1), to: new Date(y, m + 1, 1), prev: { from: new Date(y, m - 1, 1), to: new Date(y, m, 1) }, months: 6 };
  if (key === "q") return { from: new Date(y, m - 2, 1), to: new Date(y, m + 1, 1), prev: { from: new Date(y, m - 5, 1), to: new Date(y, m - 2, 1) }, months: 6 };
  if (key === "year") return { from: new Date(y, 0, 1), to: new Date(y + 1, 0, 1), prev: { from: new Date(y - 1, 0, 1), to: new Date(y, 0, 1) }, months: 12 };
  return { from: new Date(2000, 0, 1), to: new Date(y + 1, 0, 1), prev: null, months: 12 };
}
const inRange = (iso, r) => { const d = new Date(iso); return d >= r.from && d < r.to; };

function quoteMetrics(quotes, r) {
  const qs = quotes.filter((q) => inRange(q.created_at, r));
  const val = (list) => list.reduce((t, q) => t + quoteTotals(q).total, 0);
  const issued = qs.filter((q) => q.status !== "draft");
  const accepted = qs.filter((q) => q.status === "accepted");
  const decided = qs.filter((q) => q.status === "accepted" || q.status === "rejected" || q.status === "sent");
  return {
    qs, issued, accepted,
    acceptedValue: val(accepted),
    issuedValue: val(issued),
    conversion: decided.length ? accepted.length / decided.length : null,
    avg: issued.length ? val(issued) / issued.length : 0,
  };
}

async function renderStats() {
  const [quotes, projects, catalog] = await Promise.all([api.listQuotes(), api.listProjects(), api.getCatalog()]);
  const walls = projects.flatMap((p) => p.walls);
  const r = periodRange(statsPeriod);
  const cur = quoteMetrics(quotes, r);
  const prev = r.prev ? quoteMetrics(quotes, r.prev) : null;
  const delta = prev && prev.acceptedValue ? (cur.acceptedValue - prev.acceptedValue) / prev.acceptedValue : null;
  const pipeline = quotes.filter((q) => q.status === "draft" || q.status === "sent");
  const pipelineValue = pipeline.reduce((t, q) => t + quoteTotals(q).total, 0);
  const periodProjects = projects.filter((p) => inRange(p.created_at, r));
  const periodWalls = walls.filter((w) => inRange(w.created_at, r));
  const m2 = periodWalls.reduce((t, w) => t + areaM2(w), 0);
  const periodLabel = PERIODS.find((p) => p.key === statsPeriod).label;

  // monthly series for the column chart (always ends with the current month)
  const now = new Date();
  const months = [...Array(r.months)].map((_, i) => new Date(now.getFullYear(), now.getMonth() - (r.months - 1 - i), 1));
  const monthly = months.map((d) => {
    const k = monthKey(d);
    const qs = quotes.filter((q) => monthKey(new Date(q.created_at)) === k);
    return {
      label: MONTHS_AR[d.getMonth()],
      full: `${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`,
      issued: qs.filter((q) => q.status !== "draft").reduce((t, q) => t + quoteTotals(q).total, 0),
      accepted: qs.filter((q) => q.status === "accepted").reduce((t, q) => t + quoteTotals(q).total, 0),
    };
  });

  // quote pipeline by status (value + count), period-scoped
  const byStatus = Object.keys(QUOTE_STATUS).map((s) => {
    const list = cur.qs.filter((q) => q.status === s);
    return { s, label: QUOTE_STATUS[s].label, count: list.length, value: list.reduce((t, q) => t + quoteTotals(q).total, 0) };
  });

  // top items by value — accepted quotes, or all issued when nothing is accepted yet
  const itemSource = cur.accepted.length ? cur.accepted : cur.issued;
  const itemTotals = {};
  for (const q of itemSource) for (const it of q.items || []) {
    const key = (it.desc || "—").split(" — ")[0].split(" (")[0].trim();
    itemTotals[key] = (itemTotals[key] || 0) + (Number(it.qty) || 0) * (Number(it.price) || 0);
  }
  const topItems = Object.entries(itemTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // measured demand: sheets per material (one scale); m²-only materials are listed under the chart
  const q = quantities(periodWalls, catalog);
  const demand = q.filter((d) => d.sheets != null).sort((a, b) => b.sheets - a.sheets).slice(0, 6);
  const demandM2 = q.filter((d) => d.sheets == null);

  // top clients by accepted value
  const clients = {};
  for (const q of cur.accepted) { const c = q.client || "بدون اسم"; clients[c] = (clients[c] || { value: 0, n: 0 }); clients[c].value += quoteTotals(q).total; clients[c].n++; }
  const topClients = Object.entries(clients).sort((a, b) => b[1].value - a[1].value).slice(0, 5);

  const hasData = quotes.length || projects.length;

  view.innerHTML = `
    <header class="hero" style="padding-bottom:44px">
      <div class="hero-bar">
        <a class="icon-btn" href="#/" aria-label="الرئيسية">${ic("back")}</a>
        <div class="hero-brand"><div style="text-align:left"><div class="t">${COMPANY.ar}</div><div class="s">DASHBOARD</div></div><img src="${A.markWhite}" alt=""></div>
      </div>
      <div class="eyebrow">الإحصائيات · ${periodLabel}</div>
      <div class="hero-figure">
        <small>المبيعات (عروض مقبولة)</small>
        <b>${num(Math.round(cur.acceptedValue))}<span> ر.س</span></b>
        ${delta != null ? `<span class="delta ${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "▲" : "▼"} ${Math.abs(Math.round(delta * 100))}% عن الفترة السابقة</span>` : prev ? `<span class="delta">لا توجد مبيعات في الفترة السابقة للمقارنة</span>` : ""}
      </div>
    </header>

    <div class="segment stats-filter" id="period">
      ${PERIODS.map((p) => `<button data-p="${p.key}" aria-pressed="${p.key === statsPeriod}">${p.label}</button>`).join("")}
    </div>

    ${hasData ? `
    <section class="stat-grid">
      <div class="card stat"><span class="l">عروض صادرة</span><b>${cur.issued.length}</b><small>${num(Math.round(cur.issuedValue))} ر.س</small></div>
      <div class="card stat"><span class="l">نسبة التعميد</span><b>${cur.conversion == null ? "—" : `${Math.round(cur.conversion * 100)}%`}</b><small>${cur.accepted.length} مقبول</small></div>
      <div class="card stat"><span class="l">قيد المتابعة</span><b>${compact(pipelineValue)}</b><small>${pipeline.length} عرض · كل الفترات</small></div>
      <div class="card stat"><span class="l">مشاريع مقاسات</span><b>${periodProjects.length}</b><small>${num(Math.round(m2))} م² مرفوعة</small></div>
    </section>

    <section class="section">
      <div class="card chart-card">
        <div class="chart-head"><h2>العروض شهرياً</h2><span>آخر ${r.months} أشهر · ر.س</span></div>
        <div class="legend"><span><i style="background:${VIZ.issued}"></i>الصادرة</span><span><i style="background:${VIZ.accepted}"></i>المقبولة</span></div>
        <div class="chart" id="monthly"></div>
        <details class="chart-table"><summary>عرض الأرقام</summary>
          <table><thead><tr><th>الشهر</th><th>الصادرة</th><th>المقبولة</th></tr></thead>
          <tbody>${monthly.map((m) => `<tr><td>${m.full}</td><td class="num">${num(Math.round(m.issued))}</td><td class="num">${num(Math.round(m.accepted))}</td></tr>`).join("")}</tbody></table>
        </details>
      </div>
    </section>

    <section class="section">
      <div class="card chart-card">
        <div class="chart-head"><h2>حالة العروض</h2><span>${periodLabel}</span></div>
        ${hbars(byStatus.map((b) => ({ label: b.label, value: b.value, color: STATUS_VIZ[b.s].color, sub: `${b.count} عرض` })), (v) => `${num(Math.round(v))} ر.س`)}
      </div>
    </section>

    ${topItems.length ? `<section class="section">
      <div class="card chart-card">
        <div class="chart-head"><h2>أكثر البنود قيمة</h2><span>${cur.accepted.length ? "من العروض المقبولة" : "من العروض الصادرة"}</span></div>
        ${hbars(topItems.map(([label, value]) => ({ label, value, color: VIZ.accepted })), (v) => `${num(Math.round(v))} ر.س`)}
      </div>
    </section>` : ""}

    ${demand.length || demandM2.length ? `<section class="section">
      <div class="card chart-card">
        <div class="chart-head"><h2>الطلب على المواد</h2><span>عدد الألواح من المقاسات · ${periodLabel}</span></div>
        ${demand.length ? hbars(demand.map((d) => ({ label: d.name, value: d.sheets, color: VIZ.issued })), (v) => `${num(v)} لوح`) : ""}
        ${demandM2.length ? `<div class="m2-list">${demandM2.map((d) => `<span>${esc(d.name)}: <b>${num(Math.round(d.gross * 10) / 10)} م²</b></span>`).join("")}</div>` : ""}
      </div>
    </section>` : ""}

    ${topClients.length ? `<section class="section">
      <div class="card chart-card">
        <div class="chart-head"><h2>أهم العملاء</h2><span>حسب المبيعات</span></div>
        <div class="rank">${topClients.map(([c, v], i) => `<div><span class="i">${i + 1}</span><span class="n">${esc(c)}<small>${v.n} عرض مقبول</small></span><b>${num(Math.round(v.value))} ر.س</b></div>`).join("")}</div>
      </div>
    </section>` : ""}

    <div class="stats-foot">متوسط قيمة العرض: <b>${num(Math.round(cur.avg))} ر.س</b></div>
    ` : `<div class="empty"><div class="em-ico">${ic("chart")}</div><b>لا توجد بيانات بعد</b>الإحصائيات تظهر بعد أول مشروع مقاسات أو عرض سعر</div>`}`;

  document.getElementById("period").onclick = (e) => {
    const p = e.target.closest("button")?.dataset.p;
    if (p && p !== statsPeriod) { statsPeriod = p; renderStats(); }
  };
  const chartEl = document.getElementById("monthly");
  if (chartEl) {
    drawColumns(chartEl, monthly);
    // redraw on rotation / resize so the SVG always fits the card
    const ro = new ResizeObserver(() => { if (document.body.contains(chartEl)) drawColumns(chartEl, monthly); else ro.disconnect(); });
    ro.observe(chartEl);
  }
}

/* ---------- horizontal bars (HTML): label, bar, value at the tip ---------- */
function hbars(rows, fmt) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return `<div class="hbars">${rows.map((r) => `
    <div class="hbar">
      <div class="hbar-label"><span>${esc(r.label)}</span>${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</div>
      <div class="hbar-track"><i style="width:calc((100% - 104px) * ${Math.max(r.value ? 0.02 : 0, r.value / max)});background:${r.color}"></i><b>${esc(fmt(r.value, r))}</b></div>
    </div>`).join("")}</div>`;
}

/* ---------- grouped columns (SVG) with tap/hover tooltip ---------- */
function niceMax(v) {
  if (v <= 0) return 1000;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v);
}

function drawColumns(el, data) {
  const W = el.clientWidth || 340, H = 210, pad = { t: 14, r: 8, b: 26, l: 40 };
  const max = niceMax(Math.max(...data.map((d) => Math.max(d.issued, d.accepted))));
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const band = iw / data.length;
  const barW = Math.min(14, (band - 10) / 2);
  const y = (v) => pad.t + ih - (v / max) * ih;
  // column with a 4px rounded top, square at the baseline
  const col = (x, v, color) => {
    const h = (v / max) * ih;
    if (h <= 0) return "";
    const r = Math.min(4, h, barW / 2), top = y(v), base = pad.t + ih;
    return `<path d="M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${base} Z" fill="${color}"/>`;
  };
  const ticks = [0, 0.5, 1].map((f) => f * max);
  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="العروض الصادرة والمقبولة شهرياً">
      ${ticks.map((t) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}" stroke="${VIZ.grid}" stroke-width="1"/>
        <text x="${pad.l - 6}" y="${y(t) + 4}" text-anchor="end" class="tick">${compact(t)}</text>`).join("")}
      ${data.map((d, i) => {
        const cx = pad.l + band * i + band / 2;
        return `<g class="colgroup" data-i="${i}">
          <rect class="hit" x="${pad.l + band * i}" y="${pad.t}" width="${band}" height="${ih + pad.b}" fill="transparent"/>
          ${col(cx - barW - 1, d.issued, VIZ.issued)}${col(cx + 1, d.accepted, VIZ.accepted)}
          <text x="${cx}" y="${H - 8}" text-anchor="middle" class="tick">${data.length > 6 ? d.label.slice(0, 3) : d.label}</text>
        </g>`;
      }).join("")}
    </svg>
    <div class="tip" hidden></div>`;

  const tip = el.querySelector(".tip");
  const show = (g) => {
    el.querySelectorAll(".colgroup").forEach((x) => x.classList.toggle("on", x === g));
    const d = data[+g.dataset.i];
    // labels go in with textContent; values lead, series name follows
    tip.replaceChildren();
    const head = document.createElement("div");
    head.className = "tip-h";
    head.textContent = d.full;
    tip.append(head);
    for (const [k, name] of [["issued", "الصادرة"], ["accepted", "المقبولة"]]) {
      const row = document.createElement("div");
      row.className = "tip-r";
      const key = document.createElement("i");
      key.style.background = VIZ[k];
      const v = document.createElement("b");
      v.textContent = `${num(Math.round(d[k]))} ر.س`;
      const n = document.createElement("span");
      n.textContent = name;
      row.append(key, v, n);
      tip.append(row);
    }
    tip.hidden = false;
    const box = g.querySelector(".hit").getBBox();
    const left = Math.min(Math.max(box.x + box.width / 2 - tip.offsetWidth / 2, 0), W - tip.offsetWidth);
    tip.style.left = `${left}px`;
  };
  el.querySelectorAll(".colgroup").forEach((g) => {
    g.addEventListener("pointerenter", () => show(g));
    g.addEventListener("click", () => show(g));
  });
  el.querySelector("svg").addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { tip.hidden = true; el.querySelectorAll(".colgroup").forEach((x) => x.classList.remove("on")); } });
}
