"use strict";
// الرئيسية — app launcher. Each tile is one app inside هكتار; add new apps to APPS.

// Each app: icon tile on the home grid. badge() → small count on the icon (0 hides it);
// glance() → one line in the "quick look" list under the grid (empty hides it).
const APPS = [
  {
    href: "#/measure", icon: "ruler", title: "المقاسات", tone: "navy",
    badge: async () => (await api.listProjects()).filter((p) => p.status !== "closed").length,
    glance: async () => {
      const open = (await api.listProjects()).filter((p) => p.status !== "closed").length;
      return open ? `${open} مشروع قيد الرفع` : "";
    },
  },
  {
    href: "#/q", icon: "file", title: "عروض الأسعار", tone: "copper",
    badge: async () => (await api.listQuotes()).filter((q) => q.status === "draft" || q.status === "sent").length,
    glance: async () => {
      const pending = (await api.listQuotes()).filter((q) => q.status === "draft" || q.status === "sent");
      return pending.length ? `${pending.length} عرض قيد المتابعة · ${num(Math.round(pending.reduce((t, q) => t + quoteTotals(q).total, 0)))} ر.س` : "";
    },
  },
  {
    href: "#/calc", icon: "calc", title: "الحاسبة", tone: "slate",
    glance: async () => {
      const d = await api.getMeta("calcDraft");
      return d?.lines?.length ? `حساب مفتوح · ${num(Math.round(calcTotals(d).total))} ر.س` : "";
    },
  },
  {
    href: "#/pricing", icon: "tag", title: "التسعير", tone: "green",
    glance: async () => {
      const p = await api.getMeta("pricingDraft");
      return p?.cost ? `آخر تسعير · ${num(Math.round(pricingTotals(p).total))} ر.س` : "";
    },
  },
  {
    href: "#/stats", icon: "chart", title: "الإحصائيات", tone: "ink",
    glance: async () => {
      const now = new Date();
      const month = (await api.listQuotes()).filter((q) => q.status === "accepted" && new Date(q.created_at).getMonth() === now.getMonth() && new Date(q.created_at).getFullYear() === now.getFullYear());
      const v = month.reduce((t, q) => t + quoteTotals(q).total, 0);
      return v ? `مبيعات الشهر · ${num(Math.round(v))} ر.س` : "";
    },
  },
  { href: "#/transfer", icon: "upload", title: "نقل الصور", tone: "xfer" },
  {
    href: "#/web", icon: "globe", title: "زوار الموقع", tone: "web",
    glance: async () => {
      const d = ((await api.getMeta("webStatsCache")) || {})[28];
      if (!d) return "";
      const contacts = Object.values(d.contacts).reduce((t, c) => t + c.cur, 0);
      return `${num(d.totals.cur.users)} زائر · ${num(contacts)} طلب تواصل (28 يوم)`;
    },
  },
  { href: "#/settings", icon: "settings", title: "الإعدادات", tone: "gray" },
];

async function renderHub() {
  const [badges, glances] = await Promise.all([
    Promise.all(APPS.map((a) => (a.badge ? a.badge().catch(() => 0) : 0))),
    Promise.all(APPS.map((a) => (a.glance ? a.glance().catch(() => "") : ""))),
  ]);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "صباح الخير" : "مساء الخير";
  const look = APPS.map((a, i) => ({ a, text: glances[i] })).filter((x) => x.text);

  view.innerHTML = `
    <header class="hero hub-hero">
      <img class="hub-logo" src="${A.logoWhite}" alt="${COMPANY.ar}">
      <div class="hub-greet">${greet} 👋<small>${dateAr(new Date())}</small></div>
    </header>
    <nav class="card app-grid" aria-label="التطبيقات">
      ${APPS.map((a, i) => `
        <a class="app-icon tone-${a.tone}" href="${a.href}">
          <span class="app-ico">${ic(a.icon)}${badges[i] ? `<span class="badge-dot num">${badges[i] > 99 ? "99+" : badges[i]}</span>` : ""}</span>
          <span class="app-name">${a.title}</span>
        </a>`).join("")}
    </nav>
    ${look.length ? `
    <section class="section">
      <div class="section-title"><h2>نظرة سريعة</h2></div>
      <div class="card glance">
        ${look.map(({ a, text }) => `<a href="${a.href}" class="tone-${a.tone}"><span class="g-ico">${ic(a.icon, "ico-sm")}</span><span>${esc(text)}</span>${ic("chev", "ico-sm")}</a>`).join("")}
      </div>
    </section>` : ""}`;
}

/* ---------- boot ---------- */
window.addEventListener("hashchange", route);
route();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
