// Offline support: app files are network-first (updates land immediately),
// versioned CDN libraries and fonts are cache-first.
const CACHE = "hectar-v7";
const SHELL = [
  "./", "index.html", "styles.css", "app.js", "quotes.js", "calc.js", "main.js", "manifest.json",
  "assets/logo-white.png", "assets/mark-white.png", "assets/mark.png", "assets/icon-192.png",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET" || request.url.startsWith("blob:")) return;
  const sameOrigin = new URL(request.url).origin === location.origin;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (sameOrigin) {
      try {
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      } catch {
        return (await cache.match(request, { ignoreSearch: true })) || (await cache.match("index.html"));
      }
    }
    const hit = await cache.match(request);
    if (hit) return hit;
    const res = await fetch(request);
    if (res.ok || res.type === "opaque") cache.put(request, res.clone());
    return res;
  })());
});
