"use strict";
// تسعير المشروع — cost + profit % + contingency % (both on cost) = selling price, optional 15% VAT.

const PROFIT_PRESETS = [15, 20, 30, 45, 50];
const RESERVE_PRESETS = [0, 5, 10, 15];

const getPricing = async () => ({ cost: "", profit: 20, reserve: 10, vat: true, name: "", ...((await api.getMeta("pricingDraft")) || {}) });

const pctTag = (v) => `<bdi>${num(v)}%</bdi>`;

function pricingTotals(p) {
  const cost = Number(p.cost) || 0;
  const profit = cost * (Number(p.profit) || 0) / 100;
  const reserve = cost * (Number(p.reserve) || 0) / 100;
  const price = cost + profit + reserve;
  const vat = p.vat ? price * VAT_RATE : 0;
  return {
    cost, profit, reserve, price, vat, total: price + vat,
    // share of the selling price that is profit (20% on cost = 16.7% of the price)
    margin: price ? (profit / price) * 100 : 0,
    // if the contingency is never used it becomes profit too
    bestProfit: profit + reserve,
  };
}

async function renderPricing() {
  const p = await getPricing();
  const chips = (key, list, unit = "%") => list.map((v) => `<button type="button" class="chip pchip" data-k="${key}" data-v="${v}" aria-pressed="${Number(p[key]) === v}">${v}${unit}</button>`).join("");

  view.innerHTML = `
    <header class="hero" style="padding-bottom:44px">
      <div class="hero-bar"><a class="icon-btn" href="#/" aria-label="الرئيسية">${ic("back")}</a><img src="${A.markWhite}" alt="" style="width:30px"></div>
      <div class="eyebrow">تسعير المشروع</div>
      <div class="hero-figure">
        <small id="h-label">سعر البيع</small>
        <b><span id="h-total" class="num-big">0</span><span> ر.س</span></b>
        <span class="delta" id="h-sub"></span>
      </div>
    </header>

    <form class="sheet form" id="f" autocomplete="off">
      <label class="field"><span>اسم المشروع (اختياري)</span><input class="input" name="name" value="${esc(p.name)}" placeholder="مثال: فيلا العليا – المجلس"></label>

      <div class="mbox big-input"><label for="cost">إجمالي تكلفة المشروع</label>
        <div class="in"><input id="cost" name="cost" type="number" inputmode="decimal" step="any" min="0" placeholder="0" value="${p.cost}"><span class="u">ر.س</span></div>
        <small class="hint">مواد + عمالة + نقل + أي مصاريف</small></div>

      <div class="field"><span>نسبة الربح</span>
        <div class="chips">${chips("profit", PROFIT_PRESETS)}
          <label class="chip chip-input"><input type="number" inputmode="decimal" step="any" min="0" data-custom="profit" placeholder="أخرى" value="${PROFIT_PRESETS.includes(Number(p.profit)) ? "" : p.profit}"><span>%</span></label></div>
      </div>

      <div class="field"><span>الاحتياطي (للطلبات الإضافية والمفاجآت)</span>
        <div class="chips">${chips("reserve", RESERVE_PRESETS)}
          <label class="chip chip-input"><input type="number" inputmode="decimal" step="any" min="0" data-custom="reserve" placeholder="أخرى" value="${RESERVE_PRESETS.includes(Number(p.reserve)) ? "" : p.reserve}"><span>%</span></label></div>
      </div>

      <label class="toggle"><input type="checkbox" name="vat" ${p.vat ? "checked" : ""}><span>إضافة ضريبة القيمة المضافة <bdi>15%</bdi></span></label>

      <div class="card price-break" id="break"></div>
      <div class="insight" id="insight"></div>

      <div class="footer-actions" style="margin-top:0">
        <button type="button" class="btn btn-text btn-danger" id="clear">${ic("refresh", "ico-sm")} حساب جديد</button>
      </div>
      <div class="actionbar"><div class="inner">
        <div class="calc-total"><small>الإجمالي</small><b class="num" id="grand">0.00</b></div>
        <button type="button" class="btn btn-primary" id="toquote">${ic("file")} حوّله لعرض سعر</button>
      </div></div>
    </form>`;

  const form = document.getElementById("f");
  let timer = null;
  const persist = () => { clearTimeout(timer); timer = setTimeout(() => api.setMeta("pricingDraft", p), 300); };

  const render = () => {
    const t = pricingTotals(p);
    const pct = (v) => (t.price ? (v / t.price) * 100 : 0);
    document.getElementById("h-total").textContent = num(Math.round(t.total * 100) / 100);
    document.getElementById("h-label").textContent = p.vat ? "سعر البيع شامل الضريبة" : "سعر البيع";
    document.getElementById("h-sub").innerHTML = t.cost ? `تكلفة ${num(t.cost)} + ربح ${pctTag(p.profit)} + احتياطي ${pctTag(p.reserve)}` : "اكتب تكلفة المشروع";
    document.getElementById("grand").textContent = `${sar(t.total)} ر.س`;
    document.getElementById("break").innerHTML = `
      <div class="stack" aria-label="توزيع سعر البيع">
        <i class="s-cost" style="width:${pct(t.cost)}%"></i><i class="s-profit" style="width:${pct(t.profit)}%"></i><i class="s-reserve" style="width:${pct(t.reserve)}%"></i>
      </div>
      <div class="legend" style="margin:8px 0 4px"><span><i class="s-cost"></i>التكلفة</span><span><i class="s-profit"></i>الربح</span><span><i class="s-reserve"></i>الاحتياطي</span></div>
      <div><span>التكلفة</span><b class="num">${sar(t.cost)}</b></div>
      <div><span>الربح ${pctTag(p.profit)}</span><b class="num">+ ${sar(t.profit)}</b></div>
      <div><span>الاحتياطي ${pctTag(p.reserve)}</span><b class="num">+ ${sar(t.reserve)}</b></div>
      <div class="sub"><span>سعر البيع${p.vat ? " قبل الضريبة" : ""}</span><b class="num">${sar(t.price)}</b></div>
      ${p.vat ? `<div><span>ضريبة القيمة المضافة ${pctTag(15)}</span><b class="num">+ ${sar(t.vat)}</b></div>` : ""}
      <div class="grand"><span>الإجمالي${p.vat ? " شامل الضريبة" : ""}</span><b class="num">${sar(t.total)} ر.س</b></div>`;
    document.getElementById("insight").innerHTML = t.cost ? `
      <div>${ic("chart", "ico-sm")}<span>ربحك <b>${pctTag(Math.round(t.margin * 10) / 10)}</b> من سعر البيع (لأن النسبة محسوبة على التكلفة)</span></div>
      ${t.reserve ? `<div>${ic("shield", "ico-sm")}<span>إذا ما احتجت الاحتياطي، ربحك يصير <b>${sar(t.bestProfit)} ر.س</b></span></div>` : ""}` : "";
  };

  form.addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.custom) {
      const k = el.dataset.custom;
      p[k] = parseFloat(el.value) || 0;
      form.querySelectorAll(`.pchip[data-k="${k}"]`).forEach((c) => c.setAttribute("aria-pressed", "false"));
    } else if (el.name === "cost") p.cost = el.value === "" ? "" : parseFloat(el.value) || 0;
    else if (el.name === "name") p.name = el.value;
    else if (el.name === "vat") p.vat = el.checked;
    render();
    persist();
  });
  form.addEventListener("click", (e) => {
    const c = e.target.closest(".pchip");
    if (!c) return;
    const k = c.dataset.k;
    p[k] = Number(c.dataset.v);
    form.querySelectorAll(`.pchip[data-k="${k}"]`).forEach((x) => x.setAttribute("aria-pressed", x === c));
    form.querySelector(`[data-custom="${k}"]`).value = "";
    render();
    persist();
  });
  document.getElementById("clear").onclick = async () => {
    if (!confirm("بدء حساب جديد؟")) return;
    await api.setMeta("pricingDraft", { cost: "", profit: p.profit, reserve: p.reserve, vat: p.vat, name: "" });
    renderPricing();
  };
  document.getElementById("toquote").onclick = async () => {
    const t = pricingTotals(p);
    if (!t.cost) return toast("اكتب تكلفة المشروع أولاً");
    clearTimeout(timer);
    await api.setMeta("pricingDraft", p);
    // the client sees one line with the selling price; cost, profit and contingency stay internal
    const q = await newQuote({
      vat: p.vat,
      items: [{ id: uid(), desc: p.name ? `تنفيذ مشروع ${p.name}` : "تنفيذ المشروع (توريد وتركيب)", unit: "مقطوعية", qty: 1, price: Math.round(t.price * 100) / 100 }],
    });
    toast(`تم إنشاء ${q.number} — أكمل بيانات العميل`);
    go(`#/q/${q.id}`);
  };
  render();
}
