"use strict";
// حاسبة الكميات — quick pricing: sheets × price, cabinets by m² (width × height), trims by linear metre.
// The open calculation is kept as a draft, and can be turned into a quote in one tap.

const CALC_KINDS = {
  "لوح": { label: "بالعدد", fields: ["count"] },
  "قطعة": { label: "بالعدد", fields: ["count"] },
  "م²": { label: "عرض × ارتفاع", fields: ["w", "h", "count"] },
  "م.ط": { label: "بالطول", fields: ["len", "count"] },
};

const DEFAULT_PRESETS = [
  { name: "دولاب خشب", unit: "م²", price: 250 },
  { name: "دولاب خشب + زجاج", unit: "م²", price: 350 },
  { name: "بديل رخام — مطابخ", unit: "لوح", price: 180 },
  { name: "بديل رخام — حمامات", unit: "لوح", price: 200 },
  { name: "بديل شيبورد", unit: "لوح", price: 190 },
  { name: "بديل خشب مع التركيب", unit: "لوح", price: 45 },
  { name: "بروفايل / زوايا", unit: "م.ط", price: 15 },
];

const getPresets = async () => (await api.getMeta("calcPresets")) || DEFAULT_PRESETS.map((p) => ({ id: uid(), ...p }));
const getDraft = async () => (await api.getMeta("calcDraft")) || { lines: [], vat: false };

// quantity in the line's unit: sheets/pieces, m² or linear metres
function lineQty(l) {
  const n = Number(l.count) || 0;
  if (l.unit === "م²") return ((Number(l.w) || 0) * (Number(l.h) || 0) / 10000) * n;
  if (l.unit === "م.ط") return ((Number(l.len) || 0) / 100) * n;
  return n;
}
const lineTotal = (l) => lineQty(l) * (Number(l.price) || 0);

function calcTotals(d) {
  const subtotal = (d.lines || []).reduce((t, l) => t + lineTotal(l), 0);
  const vat = d.vat ? subtotal * VAT_RATE : 0;
  return { subtotal, vat, total: subtotal + vat };
}

// "120 × 240 سم × 2 = 5.76 م²" — plain text for quote items, <bdi> keeps number groups in order on screen
function lineDetail(l, html = false) {
  const n = Number(l.count) || 0;
  const b = (x) => (html ? `<bdi>${x}</bdi>` : x);
  if (l.unit === "م²") return `${b(num(l.w))} × ${b(num(l.h))} سم${n !== 1 ? ` × ${b(num(n))}` : ""} = ${b(num(lineQty(l)))} م²`;
  if (l.unit === "م.ط") return `${b(num(l.len))} سم${n !== 1 ? ` × ${b(num(n))}` : ""} = ${b(num(lineQty(l)))} م.ط`;
  return `${b(num(n))} ${l.unit}`;
}

async function renderCalc() {
  const [presets, draft] = await Promise.all([getPresets(), getDraft()]);

  const field = (l, k) => {
    const meta = { w: ["العرض", "سم"], h: ["الارتفاع", "سم"], len: ["الطول", "سم"], count: [l.unit === "لوح" ? "عدد الألواح" : l.unit === "قطعة" ? "العدد" : "العدد", ""] }[k];
    return `<label><span>${meta[0]}</span><div class="in"><input data-k="${k}" type="number" inputmode="decimal" step="any" min="0" value="${l[k] ?? ""}" placeholder="0">${meta[1] ? `<i>${meta[1]}</i>` : ""}</div></label>`;
  };
  const lineCard = (l) => `
    <div class="card cline" data-id="${l.id}">
      <div class="cline-top">
        <input class="input" data-k="name" value="${esc(l.name)}" placeholder="اسم البند">
        <select class="unit-badge" data-k="unit" aria-label="الوحدة">${Object.keys(CALC_KINDS).map((u) => `<option ${u === l.unit ? "selected" : ""}>${u}</option>`).join("")}</select>
        <button type="button" class="icon-btn del" aria-label="حذف">${ic("trash")}</button>
      </div>
      <div class="cline-grid f${CALC_KINDS[l.unit]?.fields.length || 1}">
        ${(CALC_KINDS[l.unit]?.fields || ["count"]).map((k) => field(l, k)).join("")}
        <label><span>السعر / ${esc(l.unit)}</span><div class="in"><input data-k="price" type="number" inputmode="decimal" step="any" min="0" value="${l.price ?? ""}" placeholder="0"><i>ر.س</i></div></label>
      </div>
      <div class="cline-sum"><span data-detail>${lineDetail(l, true)}</span><b class="num" data-total>${sar(lineTotal(l))}</b></div>
    </div>`;

  view.innerHTML = `
    <header class="hero" style="padding-bottom:40px">
      <div class="hero-bar">
        <a class="icon-btn" href="#/" aria-label="الرئيسية">${ic("back")}</a>
        <a class="icon-btn" href="#/calc/prices" aria-label="قائمة الأسعار">${ic("settings")}</a>
      </div>
      <div class="eyebrow">حاسبة الكميات</div>
      <h1>احسب بسرعة</h1>
      <div class="sub">اختر البند، اكتب العدد أو المقاس، والسعر يطلع مباشرة</div>
    </header>

    <div class="sheet form">
      <div class="field"><span>اختر البند</span>
        <div class="preset-grid" id="presets">
          ${presets.map((p) => `<button type="button" class="preset" data-id="${p.id}"><b>${esc(p.name)}</b><small class="num">${sar(p.price)} / ${esc(p.unit)}</small></button>`).join("")}
          <button type="button" class="preset preset-new" id="custom"><b>${ic("plus", "ico-sm")} بند آخر</b><small>اسم وسعر يدوي</small></button>
        </div>
      </div>
      <div class="wlist" id="lines">${draft.lines.map(lineCard).join("")}</div>
      <div class="empty" id="empty" ${draft.lines.length ? "hidden" : ""} style="padding:18px 8px"><b style="font-size:15px">ابدأ باختيار بند من فوق</b>مثال: دولاب خشب 120 × 240 = 2.88 م² × 250 = 720 ر.س</div>
      <label class="toggle"><input type="checkbox" id="vat" ${draft.vat ? "checked" : ""}><span>إضافة ضريبة القيمة المضافة 15%</span></label>
      <div class="card totals" id="totals"></div>
      <div class="footer-actions" style="margin-top:0">
        <button type="button" class="btn btn-text btn-danger" id="clear">${ic("trash", "ico-sm")} مسح الحساب</button>
      </div>
    </div>

    <div class="actionbar"><div class="inner">
      <div class="calc-total"><small>الإجمالي</small><b class="num" id="grand">0.00</b></div>
      <button class="btn btn-primary" id="toquote">${ic("file")} حوّله لعرض سعر</button>
    </div></div>`;

  const linesEl = document.getElementById("lines");
  let timer = null;
  const persist = () => { clearTimeout(timer); timer = setTimeout(() => api.setMeta("calcDraft", draft), 300); };
  const renderTotals = () => {
    const t = calcTotals(draft);
    document.getElementById("empty").hidden = draft.lines.length > 0;
    document.getElementById("grand").textContent = `${sar(t.total)} ر.س`;
    document.getElementById("totals").innerHTML = `
      <div><span>عدد البنود</span><b class="num">${draft.lines.length}</b></div>
      ${draft.vat ? `<div><span>قبل الضريبة</span><b class="num">${sar(t.subtotal)}</b></div><div><span>ضريبة 15%</span><b class="num">${sar(t.vat)}</b></div>` : ""}
      <div class="grand"><span>الإجمالي${draft.vat ? " شامل الضريبة" : ""}</span><b class="num">${sar(t.total)} ر.س</b></div>`;
  };

  const addLine = (l) => {
    draft.lines.unshift(l);
    linesEl.insertAdjacentHTML("afterbegin", lineCard(l));
    renderTotals();
    persist();
    const first = linesEl.firstElementChild.querySelector(`[data-k="${CALC_KINDS[l.unit]?.fields[0] || "count"}"]`);
    first.focus();
  };
  document.getElementById("presets").onclick = (e) => {
    const b = e.target.closest(".preset");
    if (!b || b.id === "custom") return;
    const p = presets.find((x) => x.id === b.dataset.id);
    addLine({ id: uid(), name: p.name, unit: p.unit, price: p.price, count: 1, w: "", h: "", len: "" });
  };
  document.getElementById("custom").onclick = () => {
    addLine({ id: uid(), name: "", unit: "م²", price: 0, count: 1, w: "", h: "", len: "" });
    linesEl.firstElementChild.querySelector('[data-k="name"]').focus();
  };

  linesEl.addEventListener("input", (e) => {
    const row = e.target.closest(".cline");
    const l = draft.lines.find((x) => x.id === row.dataset.id);
    const k = e.target.dataset.k;
    if (k === "unit") {
      // different unit → different inputs; redraw just this card
      l.unit = e.target.value;
      row.outerHTML = lineCard(l);
      renderTotals();
      persist();
      return;
    }
    l[k] = k === "name" ? e.target.value : parseFloat(e.target.value) || 0;
    row.querySelector("[data-detail]").innerHTML = lineDetail(l, true);
    row.querySelector("[data-total]").textContent = sar(lineTotal(l));
    renderTotals();
    persist();
  });
  linesEl.onclick = (e) => {
    if (!e.target.closest(".del")) return;
    const row = e.target.closest(".cline");
    draft.lines = draft.lines.filter((x) => x.id !== row.dataset.id);
    row.remove();
    renderTotals();
    persist();
  };
  document.getElementById("vat").onchange = (e) => { draft.vat = e.target.checked; renderTotals(); persist(); };
  document.getElementById("clear").onclick = async () => {
    if (!draft.lines.length || !confirm("مسح كل البنود؟")) return;
    draft.lines = [];
    await api.setMeta("calcDraft", draft);
    renderCalc();
  };
  document.getElementById("toquote").onclick = async () => {
    const lines = draft.lines.filter((l) => lineQty(l) > 0);
    if (!lines.length) return toast("أضف بند فيه كمية أولاً");
    clearTimeout(timer);
    const q = await newQuote({
      vat: draft.vat,
      items: lines.map((l) => ({
        id: uid(),
        desc: l.unit === "م²" || l.unit === "م.ط" ? `${l.name} (${lineDetail(l).split(" = ")[0]})` : l.name,
        unit: l.unit,
        qty: Math.round(lineQty(l) * 100) / 100,
        price: Number(l.price) || 0,
      })),
    });
    // the calculation now lives in the quote; start the next one clean
    await api.setMeta("calcDraft", { lines: [], vat: draft.vat });
    toast(`تم إنشاء ${q.number} — أكمل بيانات العميل`);
    go(`#/q/${q.id}`);
  };
  renderTotals();
}

/* ---------- price list ---------- */
async function renderCalcPrices() {
  const presets = await getPresets();
  const units = Object.keys(CALC_KINDS);
  const row = (p) => `
    <div class="card matrow">
      <div class="matrow-top">
        <input class="input" name="name" value="${esc(p.name)}" placeholder="اسم البند" required>
        <button type="button" class="icon-btn del" aria-label="حذف">${ic("trash")}</button>
      </div>
      <div class="matrow-grid" style="grid-template-columns:1fr 1fr">
        <label><span>الوحدة</span><div class="in"><select name="unit">${units.map((u) => `<option ${u === p.unit ? "selected" : ""}>${u}</option>`).join("")}</select></div></label>
        <label><span>السعر</span><div class="in"><input name="price" type="number" inputmode="decimal" step="any" min="0" value="${p.price ?? ""}"><i>ر.س</i></div></label>
      </div>
    </div>`;

  view.innerHTML = `
    <header class="hero" style="padding-bottom:40px">
      <div class="hero-bar"><a class="icon-btn" href="#/calc" aria-label="رجوع">${ic("back")}</a><img src="${A.markWhite}" alt="" style="width:30px"></div>
      <div class="eyebrow">حاسبة الكميات</div>
      <h1>قائمة الأسعار</h1>
      <div class="sub">م² = يُحسب بالعرض × الارتفاع · لوح وقطعة = بالعدد · م.ط = بالطول</div>
    </header>
    <form class="sheet form" id="f">
      <div id="list" class="wlist">${presets.map(row).join("")}</div>
      <button type="button" class="btn btn-soft" id="add">${ic("plus")} إضافة بند</button>
      <button type="button" class="btn btn-text" id="reset">${ic("refresh", "ico-sm")} استعادة الأسعار الافتراضية</button>
      <div class="actionbar"><div class="inner"><button class="btn btn-primary">${ic("check")} حفظ</button></div></div>
    </form>`;

  const list = document.getElementById("list");
  document.getElementById("reset").onclick = () => {
    if (!confirm("استبدال القائمة بالأسعار الافتراضية؟ (لا تُحفظ إلا بعد الضغط على حفظ)")) return;
    list.innerHTML = DEFAULT_PRESETS.map(row).join("");
  };
  list.onclick = (e) => { if (e.target.closest(".del")) e.target.closest(".matrow").remove(); };
  document.getElementById("add").onclick = () => {
    list.insertAdjacentHTML("beforeend", row({ name: "", unit: "م²", price: "" }));
    list.lastElementChild.querySelector("input").focus();
  };
  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const items = [...list.querySelectorAll(".matrow")].map((r) => ({
      id: uid(),
      name: r.querySelector("[name=name]").value.trim(),
      unit: r.querySelector("[name=unit]").value,
      price: parseFloat(r.querySelector("[name=price]").value) || 0,
    })).filter((p) => p.name);
    try {
      await api.setMeta("calcPresets", items);
      toast("تم حفظ الأسعار ✓");
      go("#/calc");
    } catch (err) { fail(err); }
  };
}
