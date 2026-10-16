"use strict";
// عروض الأسعار — quotations app. Shares the database, icons, helpers and PDF renderer from app.js.

const UNITS = ["لوح", "م²", "م.ط", "قطعة", "مقطوعية"];
const VAT_RATE = 0.15;
const QUOTE_STATUS = {
  draft: { label: "مسودة", cls: "pill-draft" },
  sent: { label: "أُرسل", cls: "pill-open" },
  accepted: { label: "مقبول", cls: "pill-closed" },
  rejected: { label: "مرفوض", cls: "pill-rejected" },
};
const DEFAULT_TERMS = [
  "الأسعار بالريال السعودي.",
  "دفعة مقدمة 50% عند التعميد، والباقي عند التسليم.",
  "مدة التنفيذ تُحدد بعد اعتماد العرض واستلام الدفعة.",
  "العرض لا يشمل أي أعمال غير مذكورة أعلاه.",
].join("\n");

const sar = (n) => Number(n || 0).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qPill = (q) => `<span class="pill ${QUOTE_STATUS[q.status]?.cls || "pill-draft"}">${QUOTE_STATUS[q.status]?.label || "مسودة"}</span>`;

function quoteTotals(q) {
  const subtotal = (q.items || []).reduce((t, it) => t + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const discount = Math.min(Number(q.discount) || 0, subtotal);
  const net = subtotal - discount;
  const vat = q.vat === false ? 0 : net * VAT_RATE;
  return { subtotal, discount, net, vat, total: net + vat };
}

const getCompany = async () => (await api.getMeta("company")) || {};
const getTerms = async () => (await api.getMeta("quoteTerms")) ?? DEFAULT_TERMS;

async function newQuote(fields = {}) {
  const q = {
    id: uid(), number: await api.nextQuoteNumber(), status: "draft", created_at: nowIso(),
    client: "", phone: "", location: "", project_id: null, project_ref: null,
    items: [], discount: 0, vat: true, validity_days: 15, terms: await getTerms(),
    pdf_id: null, pdf_stale: true, ...fields,
  };
  await api.saveQuote(q);
  return q;
}

// measurement project → quote: sheet materials by sheet count, the rest by m²
async function quoteFromProject(p, walls, catalog) {
  const items = quantities(walls, catalog).map((it) => {
    const c = catalog.find((x) => x.name === it.name);
    return it.sheets != null
      ? { id: uid(), desc: `${it.name} — لوح ${it.size}`, unit: "لوح", qty: it.sheets, price: c?.price || 0 }
      : { id: uid(), desc: it.name, unit: "م²", qty: Math.round(it.gross * 100) / 100, price: c?.price || 0 };
  });
  const q = await newQuote({ client: p.client || "", location: p.location || "", project_id: p.id, project_ref: `${reportNo(p)} · ${p.name}`, items });
  toast(items.some((i) => !i.price) ? "تم إنشاء العرض — أكمل الأسعار الناقصة" : "تم إنشاء العرض من المشروع ✓");
  go(`#/q/${q.id}`);
}

async function routeQuotes(parts) {
  if (parts[0] === "new") return renderNewQuote();
  if (parts[0]) return renderQuoteEditor(parts[0]);
  return renderQuotes();
}

/* ---------- list ---------- */
let quoteFilter = "all";

async function renderQuotes() {
  const quotes = (await api.listQuotes()).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const withTotals = quotes.map((q) => ({ q, t: quoteTotals(q) }));
  const sum = (st) => withTotals.filter(({ q }) => st.includes(q.status)).reduce((t, { t: x }) => t + x.total, 0);

  view.innerHTML = `
    <header class="hero" style="padding-bottom:44px">
      <div class="hero-bar">
        <a class="icon-btn" href="#/" aria-label="الرئيسية">${ic("back")}</a>
        <div class="hero-brand"><div style="text-align:left"><div class="t">${COMPANY.ar}</div><div class="s">QUOTATIONS</div></div><img src="${A.markWhite}" alt=""></div>
      </div>
      <div class="eyebrow">عروض الأسعار</div>
      <h1>العروض</h1>
      <div class="kpis">
        <div class="kpi"><div class="v">${quotes.length}</div><div class="l">إجمالي العروض</div></div>
        <div class="kpi"><div class="v num">${num(Math.round(sum(["draft", "sent"])))}</div><div class="l">قيد المتابعة (ر.س)</div></div>
        <div class="kpi"><div class="v num">${num(Math.round(sum(["accepted"])))}</div><div class="l">مقبولة (ر.س)</div></div>
      </div>
    </header>
    <label class="search">${ic("search")}<input type="search" id="q" placeholder="ابحث برقم العرض أو العميل"></label>
    <div class="segment" id="seg">
      <button data-f="all">الكل</button>${Object.entries(QUOTE_STATUS).map(([k, v]) => `<button data-f="${k}">${v.label}</button>`).join("")}
    </div>
    <div class="plist" id="list">
      ${withTotals.map(({ q, t }) => `
        <a class="card pcard qcard" href="#/q/${q.id}" data-status="${q.status}" data-q="${esc([q.number, q.client, q.location].join(" ").toLowerCase())}">
          <div class="qnum num">${esc(q.number)}</div>
          <div class="body">
            <div class="name">${esc(q.client || "بدون اسم عميل")}</div>
            <div class="meta">${esc([q.location, dateAr(q.created_at)].filter(Boolean).join(" · "))}</div>
            <div class="facts"><span><b class="num">${sar(t.total)}</b> ر.س</span>${qPill(q)}</div>
          </div>
          <span class="chev">${ic("chev")}</span>
        </a>`).join("")}
    </div>
    <div class="empty" id="empty" hidden><div class="em-ico">${ic("file")}</div><b>${quotes.length ? "لا توجد نتائج" : "لا توجد عروض بعد"}</b>${quotes.length ? "جرّب كلمة بحث أخرى" : "أنشئ عرضاً فارغاً أو من مشروع مقاسات"}</div>
    <div class="actionbar"><div class="inner"><a class="btn btn-primary" href="#/q/new">${ic("plus")} عرض سعر جديد</a></div></div>`;

  const q = document.getElementById("q");
  const seg = document.getElementById("seg");
  const apply = () => {
    const v = q.value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll("#list .qcard").forEach((el) => {
      const ok = el.dataset.q.includes(v) && (quoteFilter === "all" || el.dataset.status === quoteFilter);
      el.hidden = !ok;
      if (ok) shown++;
    });
    seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.f === quoteFilter));
    document.getElementById("empty").hidden = shown > 0;
  };
  q.oninput = apply;
  seg.onclick = (e) => { if (e.target.dataset.f) { quoteFilter = e.target.dataset.f; apply(); } };
  apply();
}

/* ---------- new: blank or from a measurement project ---------- */
async function renderNewQuote() {
  const projects = (await api.listProjects()).sort((a, b) => b.created_at.localeCompare(a.created_at));
  view.innerHTML = `
    <header class="hero" style="padding-bottom:40px">
      <div class="hero-bar"><a class="icon-btn" href="#/q" aria-label="رجوع">${ic("back")}</a><img src="${A.markWhite}" alt="" style="width:30px"></div>
      <div class="eyebrow">عرض سعر جديد</div>
      <h1>من وين نبدأ؟</h1>
      <div class="sub">اختر مشروع مقاسات لتنتقل الكميات تلقائياً، أو ابدأ عرضاً فارغاً</div>
    </header>
    <div class="sheet form">
      <button class="btn btn-soft" id="blank">${ic("plus")} عرض فارغ</button>
      ${projects.length ? `<div class="field"><span>من مشروع مقاسات</span>
        <div class="wlist">${projects.map((p) => `
          <button class="card pcard pick" data-id="${p.id}" style="text-align:right;border:0;width:100%;font:inherit">
            <div class="body"><div class="name">${esc(p.name)}</div>
            <div class="meta">${esc([p.client, `${p.walls.length} جدار`].filter(Boolean).join(" · "))}</div></div>
            <span class="chev">${ic("chev")}</span>
          </button>`).join("")}</div></div>` : ""}
    </div>`;
  document.getElementById("blank").onclick = async () => { const q = await newQuote(); history.replaceState(null, "", "#/q"); go(`#/q/${q.id}`); };
  view.querySelectorAll(".pick").forEach((b) => (b.onclick = async () => {
    const [{ project, walls }, catalog] = await Promise.all([api.getProject(b.dataset.id), api.getCatalog()]);
    history.replaceState(null, "", "#/q");
    quoteFromProject(project, walls, catalog);
  }));
}

/* ---------- editor ---------- */
async function renderQuoteEditor(id) {
  const [q, catalog] = await Promise.all([api.getQuote(id), api.getCatalog()]);
  if (!q) return go("#/q");
  // loaded up front so the share button runs inside the tap (iOS requires a direct user gesture)
  let pdfBlob = q.pdf_id && !q.pdf_stale ? await api.getFile(q.pdf_id) : null;

  const itemRow = (it) => `
    <div class="card qitem" data-id="${it.id}">
      <div class="qitem-top">
        <input class="input" data-k="desc" value="${esc(it.desc)}" placeholder="وصف البند">
        <button type="button" class="icon-btn del" aria-label="حذف البند">${ic("trash")}</button>
      </div>
      <div class="qitem-grid">
        <label><span>الوحدة</span><select data-k="unit">${[...new Set([...UNITS, it.unit])].map((u) => `<option ${u === it.unit ? "selected" : ""}>${esc(u)}</option>`).join("")}</select></label>
        <label><span>الكمية</span><input data-k="qty" type="number" inputmode="decimal" step="any" min="0" value="${it.qty ?? ""}"></label>
        <label><span>سعر الوحدة</span><input data-k="price" type="number" inputmode="decimal" step="any" min="0" value="${it.price || ""}" placeholder="0"></label>
        <label><span>الإجمالي</span><output class="num" data-total>${sar((Number(it.qty) || 0) * (Number(it.price) || 0))}</output></label>
      </div>
    </div>`;

  view.innerHTML = `
    <header class="hero" style="padding-bottom:40px">
      <div class="hero-bar"><a class="icon-btn" href="#/q" aria-label="العروض">${ic("back")}</a>${qPill(q)}</div>
      <div class="eyebrow num" style="text-align:right">${esc(q.number)}</div>
      <h1>${esc(q.client || "عرض سعر")}</h1>
      <div class="sub">${q.project_ref ? `<span>${ic("ruler", "ico-sm")} ${esc(q.project_ref)}</span>` : ""}<span>${ic("calendar", "ico-sm")} ${dateAr(q.created_at)}</span></div>
    </header>

    <form class="sheet form" id="f" autocomplete="off">
      <div class="field"><span>حالة العرض</span>
        <div class="segment" id="status" style="margin:0">${Object.entries(QUOTE_STATUS).map(([k, v]) => `<button type="button" data-s="${k}" aria-pressed="${q.status === k}">${v.label}</button>`).join("")}</div>
      </div>
      <label class="field"><span>العميل</span><div class="input-icon">${ic("user")}<input class="input" name="client" value="${esc(q.client)}" placeholder="اسم العميل"></div></label>
      <div class="row">
        <label class="field"><span>الجوال</span><input class="input ltr" name="phone" type="tel" value="${esc(q.phone)}" placeholder="05xxxxxxxx"></label>
        <label class="field"><span>الموقع</span><input class="input" name="location" value="${esc(q.location)}" placeholder="الحي / المدينة"></label>
      </div>

      <div class="section-title" style="margin:8px 0 0"><h2>البنود</h2><span class="count" id="count"></span></div>
      <div class="wlist" id="items">${q.items.map(itemRow).join("")}</div>
      <button type="button" class="btn btn-soft" id="additem">${ic("plus")} بند جديد</button>
      ${catalog.length ? `<div class="field"><span>إضافة سريعة من المواد</span><div class="chips" id="quick">${catalog.map((c) => `<button type="button" class="chip" data-n="${esc(c.name)}">${esc(c.name)}</button>`).join("")}</div></div>` : ""}

      <div class="row">
        <label class="field"><span>خصم (ر.س)</span><input class="input ltr" name="discount" type="number" inputmode="decimal" step="any" min="0" value="${q.discount || ""}" placeholder="0"></label>
        <label class="field"><span>صلاحية العرض (يوم)</span><input class="input ltr" name="validity_days" type="number" inputmode="numeric" min="1" value="${q.validity_days || 15}"></label>
      </div>
      <label class="toggle"><input type="checkbox" name="vat" ${q.vat !== false ? "checked" : ""}><span>إضافة ضريبة القيمة المضافة 15%</span></label>

      <div class="card totals" id="totals"></div>

      <label class="field"><span>الشروط والملاحظات</span><textarea class="input" name="terms" rows="5">${esc(q.terms || "")}</textarea></label>

      <div class="footer-actions" style="margin-top:6px">
        <button type="button" class="btn btn-text" id="dup">${ic("plus", "ico-sm")} نسخ العرض</button>
        <button type="button" class="btn btn-text btn-danger" id="del">${ic("trash", "ico-sm")} حذف العرض</button>
      </div>

      <div class="actionbar"><div class="inner" id="actions"></div></div>
    </form>`;

  const form = document.getElementById("f");
  const itemsEl = document.getElementById("items");
  const name = () => `${q.number} ${(q.client || "عرض سعر").replace(/[\\/:*?"<>|]+/g, "-")}.pdf`;

  const renderTotals = () => {
    const t = quoteTotals(q);
    document.getElementById("count").textContent = `${q.items.length} بند`;
    document.getElementById("totals").innerHTML = `
      <div><span>المجموع</span><b class="num">${sar(t.subtotal)}</b></div>
      ${t.discount ? `<div><span>الخصم</span><b class="num">− ${sar(t.discount)}</b></div>` : ""}
      ${q.vat !== false ? `<div><span>ضريبة القيمة المضافة 15%</span><b class="num">${sar(t.vat)}</b></div>` : ""}
      <div class="grand"><span>الإجمالي ${q.vat !== false ? "شامل الضريبة" : ""}</span><b class="num">${sar(t.total)} ر.س</b></div>`;
  };

  const renderActions = () => {
    document.getElementById("actions").innerHTML = pdfBlob
      ? `<button type="button" class="btn btn-primary grow" id="share">${ic("share")} مشاركة العرض</button><button type="button" class="btn" id="dl" aria-label="تحميل">${ic("download")}</button><button type="button" class="btn" id="regen" aria-label="إعادة إصدار">${ic("refresh")}</button>`
      : `<button type="button" class="btn btn-primary grow" id="pdf">${ic(q.pdf_id ? "refresh" : "file")} ${q.pdf_id ? "تحديث عرض السعر PDF" : "إصدار عرض السعر PDF"}</button>`;
    on("pdf", issue);
    on("regen", issue);
    on("share", () => shareFile(pdfBlob, name()));
    on("dl", () => saveBlob(pdfBlob, name()));
  };

  // autosave: every edit is stored right away and marks the issued PDF as outdated
  let timer = null;
  const save = () => {
    q.pdf_stale = true;
    if (pdfBlob) { pdfBlob = null; renderActions(); }
    clearTimeout(timer);
    timer = setTimeout(() => api.saveQuote(q), 400);
  };

  form.addEventListener("input", (e) => {
    const t = e.target;
    const row = t.closest(".qitem");
    if (row) {
      const it = q.items.find((x) => x.id === row.dataset.id);
      it[t.dataset.k] = t.type === "number" ? parseFloat(t.value) || 0 : t.value;
      row.querySelector("[data-total]").textContent = sar((Number(it.qty) || 0) * (Number(it.price) || 0));
    } else if (t.name) {
      q[t.name] = t.type === "checkbox" ? t.checked : t.type === "number" ? parseFloat(t.value) || 0 : t.value;
    }
    renderTotals();
    save();
  });

  const addItem = (it) => {
    q.items.push(it);
    itemsEl.insertAdjacentHTML("beforeend", itemRow(it));
    renderTotals();
    save();
    return itemsEl.lastElementChild;
  };
  document.getElementById("additem").onclick = () => addItem({ id: uid(), desc: "", unit: "م²", qty: 1, price: 0 }).querySelector("input").focus();
  const quick = document.getElementById("quick");
  if (quick) quick.onclick = (e) => {
    const c = catalog.find((x) => x.name === e.target.closest(".chip")?.dataset.n);
    if (!c) return;
    const row = addItem({ id: uid(), desc: c.sheet_w ? `${c.name} — لوح ${c.sheet_w}×${c.sheet_h || "—"}` : c.name, unit: c.sheet_w ? "لوح" : "م²", qty: 1, price: c.price || 0 });
    row.querySelector('[data-k="qty"]').select();
  };
  itemsEl.onclick = (e) => {
    if (!e.target.closest(".del")) return;
    const row = e.target.closest(".qitem");
    q.items = q.items.filter((x) => x.id !== row.dataset.id);
    row.remove();
    renderTotals();
    save();
  };
  document.getElementById("status").onclick = async (e) => {
    const s = e.target.closest("button")?.dataset.s;
    if (!s) return;
    q.status = s;
    await api.saveQuote(q);
    renderQuoteEditor(id);
  };

  const on = (sel, fn) => { const el = document.getElementById(sel); if (el) el.onclick = fn; };
  const issue = async () => {
    clearTimeout(timer);
    const b = busy("جاري إصدار عرض السعر…");
    try {
      await api.saveQuote(q);
      const blob = await buildQuotePdf(q, b.set);
      await api.saveQuotePdf(q.id, blob);
      if (q.status === "draft") { q.status = "sent"; q.pdf_stale = false; q.pdf_id = `qpdf:${q.id}`; await api.saveQuote(q); }
      toast("تم إصدار عرض السعر ✓");
      renderQuoteEditor(id);
    } catch (err) { fail(err); } finally { b.done(); }
  };
  on("del", async () => {
    if (!confirm(`حذف العرض ${q.number}؟`)) return;
    await api.deleteQuote(q.id);
    go("#/q");
  });
  on("dup", async () => {
    const copy = await newQuote({ client: q.client, phone: q.phone, location: q.location, project_id: q.project_id, project_ref: q.project_ref,
      items: q.items.map((it) => ({ ...it, id: uid() })), discount: q.discount, vat: q.vat, validity_days: q.validity_days, terms: q.terms });
    toast(`تم إنشاء ${copy.number}`);
    go(`#/q/${copy.id}`);
  });
  renderTotals();
  renderActions();
}

/* ---------- quote PDF ---------- */
async function buildQuotePdf(q, onProgress) {
  const company = await getCompany();
  const t = quoteTotals(q);
  const issued = dateAr(new Date());
  const validUntil = dateAr(new Date(Date.now() + (q.validity_days || 15) * 86400000));
  const terms = (q.terms || "").split("\n").map((l) => l.trim()).filter(Boolean);

  // items paginate (≈37px per row); the totals/terms/signature block takes the space of ~9 rows
  const FIRST = 17, NEXT = 22, TAIL = 9;
  const chunks = [q.items.slice(0, FIRST)];
  for (let i = FIRST; i < q.items.length; i += NEXT) chunks.push(q.items.slice(i, i + NEXT));
  const lastCap = chunks.length === 1 ? FIRST : NEXT;
  const tailOwnPage = chunks.at(-1).length > lastCap - TAIL;
  const pageCount = chunks.length + (tailOwnPage ? 1 : 0);

  const contact = [company.phone && `هاتف ${company.phone}`, company.email, company.vat && `الرقم الضريبي ${company.vat}`, company.cr && `س.ت ${company.cr}`].filter(Boolean);
  const foot = (n) => `
    <div class="qp-foot"><span>${esc(contact.join(" · ") || COMPANY.ar)}${company.address ? `<br>${esc(company.address)}` : ""}</span><span class="pn">${n} / ${pageCount}</span></div>
    <div class="pg-band"></div>`;
  const header = `
    <div class="qp-top">
      <div class="cv-stripes"></div>
      <img class="qp-logo" src="${A.logoWhite}" alt="">
      <div class="qp-title"><div class="t">عرض سعر</div><div class="s">QUOTATION</div><div class="n num">${esc(q.number)}</div></div>
    </div>
    <div class="qp-info">
      <div class="qp-box"><div class="k">مقدم إلى</div><div class="v">${esc(q.client || "—")}</div>
        <div class="d">${esc([q.phone, q.location].filter(Boolean).join(" · "))}</div></div>
      <div class="qp-box"><div class="k">تفاصيل العرض</div>
        <div class="kv"><span>التاريخ</span><b>${issued}</b></div>
        <div class="kv"><span>صالح حتى</span><b>${validUntil}</b></div>
        ${q.project_ref ? `<div class="kv"><span>مرجع المقاسات</span><b class="num">${esc(q.project_ref.split(" · ")[0])}</b></div>` : ""}
      </div>
    </div>`;
  const smallHeader = `
    <div class="ph-head">
      <div class="ph-brand"><img src="${A.mark}" alt=""><div><div class="t">${COMPANY.ar}</div><div class="s">${COMPANY.en}</div></div></div>
      <div class="ph-meta"><b>عرض سعر <span class="num">${esc(q.number)}</span></b><br>${esc(q.client || "")}</div>
    </div>`;
  const table = (rows, offset) => `
    <table class="tbl qtbl">
      <thead><tr><th style="width:34px">#</th><th>البند</th><th>الوحدة</th><th class="c-num">الكمية</th><th class="c-num">سعر الوحدة</th><th class="c-num">الإجمالي (ر.س)</th></tr></thead>
      <tbody>${rows.map((it, i) => `<tr><td class="c-code" style="color:#8592a3">${offset + i + 1}</td><td><b>${esc(it.desc || "—")}</b></td><td>${esc(it.unit)}</td>
        <td class="c-num">${num(it.qty)}</td><td class="c-num">${sar(it.price)}</td><td class="c-num"><b>${sar((Number(it.qty) || 0) * (Number(it.price) || 0))}</b></td></tr>`).join("")}</tbody>
    </table>`;
  const tail = `
    <div class="qp-tail">
      <div class="qp-terms">${terms.length ? `<div class="k">الشروط والأحكام</div><div class="qp-list">${terms.map((l, i) => `<div><span class="num">${i + 1}.</span><span>${esc(l.replace(/^[-•]\s*/, ""))}</span></div>`).join("")}</div>` : ""}</div>
      <div class="qp-totals">
        <div><span>المجموع</span><b class="num">${sar(t.subtotal)}</b></div>
        ${t.discount ? `<div><span>الخصم</span><b class="num">${sar(t.discount)}</b></div><div><span>بعد الخصم</span><b class="num">${sar(t.net)}</b></div>` : ""}
        ${q.vat !== false ? `<div><span>ضريبة القيمة المضافة 15%</span><b class="num">${sar(t.vat)}</b></div>` : ""}
        <div class="grand"><span>الإجمالي${q.vat !== false ? " شامل الضريبة" : ""}</span><b class="num">${sar(t.total)} ر.س</b></div>
      </div>
    </div>
    <div class="sign"><div>توقيع وختم الشركة</div><div>اعتماد العميل</div><div>التاريخ</div></div>`;

  const pages = chunks.map((rows, ci) => {
    const offset = ci === 0 ? 0 : FIRST + (ci - 1) * NEXT;
    const last = ci === chunks.length - 1;
    const body = `${table(rows, offset)}${last && !tailOwnPage ? tail : ""}`;
    return ci === 0
      ? `${header}<div class="pg-body" style="padding-top:22px">${body}</div>${foot(1)}`
      : `${smallHeader}<div class="pg-body">${body}</div>${foot(ci + 1)}`;
  });
  if (tailOwnPage) pages.push(`${smallHeader}<div class="pg-body">${tail}</div>${foot(pageCount)}`);

  return renderPages(pages, { title: `عرض سعر ${q.number}`, subject: "Quotation" }, onProgress);
}

/* ---------- company info + default terms ---------- */
async function renderCompany() {
  const [c, terms] = await Promise.all([getCompany(), getTerms()]);
  view.innerHTML = `
    <header class="hero" style="padding-bottom:40px">
      <div class="hero-bar"><a class="icon-btn" href="#/settings" aria-label="رجوع">${ic("back")}</a><img src="${A.markWhite}" alt="" style="width:30px"></div>
      <div class="eyebrow">الإعدادات</div>
      <h1>بيانات الشركة</h1>
      <div class="sub">تظهر في أسفل عروض الأسعار</div>
    </header>
    <form class="sheet form" id="f">
      <div class="row">
        <label class="field"><span>الهاتف</span><input class="input ltr" name="phone" type="tel" value="${esc(c.phone || "")}"></label>
        <label class="field"><span>البريد</span><input class="input ltr" name="email" type="email" value="${esc(c.email || "")}"></label>
      </div>
      <div class="row">
        <label class="field"><span>الرقم الضريبي</span><input class="input ltr" name="vat" inputmode="numeric" value="${esc(c.vat || "")}"></label>
        <label class="field"><span>السجل التجاري</span><input class="input ltr" name="cr" inputmode="numeric" value="${esc(c.cr || "")}"></label>
      </div>
      <label class="field"><span>العنوان</span><input class="input" name="address" value="${esc(c.address || "")}"></label>
      <label class="field"><span>الشروط الافتراضية للعروض الجديدة (سطر لكل شرط)</span><textarea class="input" name="terms" rows="6">${esc(terms)}</textarea></label>
      <div class="actionbar"><div class="inner"><button class="btn btn-primary">${ic("check")} حفظ</button></div></div>
    </form>`;
  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    const { terms: t, ...company } = fd;
    try {
      await Promise.all([api.setMeta("company", company), api.setMeta("quoteTerms", t)]);
      toast("تم الحفظ ✓");
      history.back();
    } catch (err) { fail(err); }
  };
}
