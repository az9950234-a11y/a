"use strict";
// الرئيسية — app launcher. Each tile is one app inside هكتار; add new apps to APPS.

const APPS = [
  {
    href: "#/measure", icon: "ruler", title: "رفع المقاسات", en: "MEASUREMENTS", tone: "navy",
    stat: async () => {
      const ps = await api.listProjects();
      const open = ps.filter((p) => p.status !== "closed").length;
      return ps.length ? `${open} قيد الرفع · ${ps.length} مشروع` : "ابدأ أول مشروع";
    },
  },
  {
    href: "#/q", icon: "file", title: "عروض الأسعار", en: "QUOTATIONS", tone: "copper",
    stat: async () => {
      const qs = await api.listQuotes();
      const pending = qs.filter((q) => q.status === "draft" || q.status === "sent");
      const value = pending.reduce((t, q) => t + quoteTotals(q).total, 0);
      return qs.length ? `${pending.length} قيد المتابعة · ${num(Math.round(value))} ر.س` : "أنشئ أول عرض";
    },
  },
  {
    href: "#/calc", icon: "calc", title: "حاسبة الكميات", en: "CALCULATOR", tone: "slate",
    stat: async () => {
      const d = await api.getMeta("calcDraft");
      return d?.lines?.length ? `حساب مفتوح · ${num(Math.round(calcTotals(d).total))} ر.س` : "ألواح، دواليب، زجاج… بالسعر مباشرة";
    },
  },
  {
    href: "#/stats", icon: "chart", title: "الإحصائيات", en: "DASHBOARD", tone: "ink",
    stat: async () => {
      const qs = await api.listQuotes();
      const now = new Date();
      const month = qs.filter((q) => q.status === "accepted" && new Date(q.created_at).getMonth() === now.getMonth() && new Date(q.created_at).getFullYear() === now.getFullYear());
      return `مبيعات الشهر · ${num(Math.round(month.reduce((t, q) => t + quoteTotals(q).total, 0)))} ر.س`;
    },
  },
  {
    href: "#/transfer", icon: "upload", title: "نقل الصور", en: "PHOTO TRANSFER", tone: "xfer",
    stat: async () => "من الجوال للكمبيوتر بالجودة الأصلية",
  },
  {
    href: "#/web", icon: "globe", title: "زوار الموقع", en: "HECTAR.SA", tone: "web",
    stat: async () => {
      const cfg = await api.getMeta("webStats");
      if (!cfg?.token) return "اربط إحصائيات الموقع";
      const d = ((await api.getMeta("webStatsCache")) || {})[28];
      if (!d) return "زوار وطلبات تواصل hectar.sa";
      const contacts = Object.values(d.contacts).reduce((s, c) => s + c.cur, 0);
      return `${num(d.totals.cur.users)} زائر · ${num(contacts)} طلب تواصل (28 يوم)`;
    },
  },
];

async function renderHub() {
  const stats = await Promise.all(APPS.map((a) => a.stat().catch(() => "")));
  const hour = new Date().getHours();
  const greet = hour < 12 ? "صباح الخير" : "مساء الخير";

  view.innerHTML = `
    <header class="hero hub-hero">
      <div class="hero-bar">
        <span></span>
        <a class="icon-btn" href="#/settings" aria-label="الإعدادات والنسخ الاحتياطي">${ic("settings")}</a>
      </div>
      <img class="hub-logo" src="${A.logoWhite}" alt="${COMPANY.ar}">
      <div class="hub-greet">${greet} 👋<small>${dateAr(new Date())}</small></div>
    </header>
    <section class="hub-apps">
      ${APPS.map((a, i) => `
        <a class="card app-tile tone-${a.tone}" href="${a.href}">
          <span class="app-ico">${ic(a.icon)}</span>
          <span class="app-txt"><b>${a.title}</b><small class="en">${a.en}</small><span class="app-stat">${esc(stats[i])}</span></span>
          <span class="chev">${ic("chev")}</span>
        </a>`).join("")}
      <div class="app-tile app-soon">
        <span class="app-ico">${ic("plus")}</span>
        <span class="app-txt"><b>تطبيقات قادمة</b><span class="app-stat">الفواتير، المستودع، جدول التركيب…</span></span>
      </div>
    </section>`;
}

/* ---------- boot ---------- */
window.addEventListener("hashchange", route);
route();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
