"use strict";
// نقل الصور — send original photos/videos from the phone straight to the computer (WebRTC, peer to peer).
// Nothing is uploaded or stored on a server: PeerJS's free cloud only introduces the two devices
// (and relays through its TURN server when they cannot reach each other directly).

const XFER_LIBS = {
  peer: "https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js",
  qr: "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js",
  zip: "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
};
const XFER_PREFIX = "hectar-x-";
const CHUNK = 64 * 1024;

const scriptCache = {};
const loadScript = (src) => (scriptCache[src] ||= new Promise((res, rej) => {
  const s = document.createElement("script");
  s.src = src;
  s.onload = res;
  s.onerror = () => { delete scriptCache[src]; rej(new Error("تعذر تحميل أداة النقل — تأكد من اتصال الإنترنت")); };
  document.head.append(s);
}));

// one live connection at a time; leaving the screen closes it
let xfer = null;
window.addEventListener("hashchange", () => {
  if (!location.hash.startsWith("#/transfer") && xfer) { xfer.destroy(); xfer = null; }
});
const newPeer = (id) => new Peer(id, window.XFER_PEER_OPTIONS || {}); // override = self-hosted signalling / tests

const fmtSize = (b) => (b >= 1073741824 ? `${(b / 1073741824).toFixed(2)} GB` : b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const sizeTag = (b) => `<bdi>${fmtSize(b)}</bdi>`;
// 1 ملف · 2 ملفان · 3–10 ملفات · 11+ ملف
const filesAr = (n) => (n === 1 ? "ملف واحد" : n === 2 ? "ملفان" : n <= 10 ? `${n} ملفات` : `${n} ملف`);
const isMobile = () => matchMedia("(pointer: coarse)").matches;

async function routeTransfer(parts) {
  if (parts[0] === "receive") return renderReceive();
  if (parts[0] === "send") return renderSend(parts[1] || "");
  return renderTransferHome();
}

function renderTransferHome() {
  const mobile = isMobile();
  view.innerHTML = `
    <header class="hero" style="padding-bottom:40px">
      <div class="hero-bar"><a class="icon-btn" href="#/" aria-label="الرئيسية">${ic("back")}</a><img src="${A.markWhite}" alt="" style="width:30px"></div>
      <div class="eyebrow">نقل الصور</div>
      <h1>من الجوال للكمبيوتر بالجودة الأصلية</h1>
      <div class="sub">الصور تنتقل مباشرة بين جهازيك، بدون ضغط وبدون رفع على أي سيرفر</div>
    </header>
    <section class="hub-apps" style="margin-top:-24px">
      ${[
        { href: "#/transfer/send", icon: "upload", t: "إرسال من هذا الجهاز", s: "اختر الصور من المعرض وأرسلها", tone: "copper", first: mobile },
        { href: "#/transfer/receive", icon: "download", t: "استقبال على هذا الجهاز", s: "افتحها على الكمبيوتر وامسح الرمز بالجوال", tone: "navy", first: !mobile },
      ].sort((a, b) => b.first - a.first).map((c) => `
        <a class="card app-tile tone-${c.tone}" href="${c.href}">
          <span class="app-ico">${ic(c.icon)}</span>
          <span class="app-txt"><b>${c.t}</b><span class="app-stat">${c.s}</span></span>
          <span class="chev">${ic("chev")}</span>
        </a>`).join("")}
    </section>
    <div class="xfer-steps">
      <div><b>1</b>على الكمبيوتر: افتح التطبيق ← نقل الصور ← <b>استقبال</b></div>
      <div><b>2</b>على الجوال: امسح رمز QR بالكاميرا، أو اكتب الرمز</div>
      <div><b>3</b>اختر الصور، وحمّلها على الكمبيوتر بضغطة</div>
    </div>`;
}

/* ---------- receive (computer) ---------- */
async function renderReceive() {
  view.innerHTML = `
    <header class="hero" style="padding-bottom:40px">
      <div class="hero-bar"><a class="icon-btn" href="#/transfer" aria-label="رجوع">${ic("back")}</a><img src="${A.markWhite}" alt="" style="width:30px"></div>
      <div class="eyebrow">نقل الصور · استقبال</div>
      <h1>امسح الرمز بجوالك</h1>
      <div class="sub">خل هذي الصفحة مفتوحة لين تنتهي الصور</div>
    </header>
    <div class="sheet">
      <div class="xfer-pair">
        <div class="qr" id="qr"><div class="spinner-dark"></div></div>
        <div class="code-box"><small>أو اكتب الرمز في الجوال</small><b class="num" id="code">······</b><span class="xfer-state" id="state">جاري التجهيز…</span></div>
      </div>
    </div>
    <section class="section" id="inbox" hidden>
      <div class="section-title"><h2>الصور المستلمة</h2><span class="count" id="count"></span></div>
      <div class="xfer-grid" id="grid"></div>
    </section>
    <div class="actionbar" id="bar" hidden><div class="inner">
      <button class="btn btn-primary grow" id="zip">${ic("download")} تحميل الكل (ZIP)</button>
      <button class="btn" id="each" aria-label="تحميل كل صورة لحالها">${ic("download")} منفصلة</button>
    </div></div>`;

  const state = (t, cls = "") => { const el = document.getElementById("state"); if (el) { el.textContent = t; el.className = `xfer-state ${cls}`; } };
  try { await Promise.all([loadScript(XFER_LIBS.peer), loadScript(XFER_LIBS.qr)]); } catch (e) { return state(e.message, "bad"); }

  const received = [];
  const start = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    xfer?.destroy();
    const peer = (xfer = newPeer(XFER_PREFIX + code));
    peer.on("open", () => {
      const link = `${location.origin}${location.pathname}#/transfer/send/${code}`;
      const qr = qrcode(0, "M");
      qr.addData(link);
      qr.make();
      document.getElementById("qr").innerHTML = qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
      document.getElementById("code").textContent = code;
      state("بانتظار الجوال…");
    });
    peer.on("error", (err) => {
      if (err.type === "unavailable-id") return start(); // code already taken: pick another
      state(err.type === "network" || err.type === "server-error" ? "تعذر الاتصال بخدمة الربط — تأكد من الإنترنت" : `خطأ: ${err.type}`, "bad");
    });
    peer.on("connection", (conn) => {
      let cur = null;
      conn.on("open", () => state("الجوال متصل ✓", "ok"));
      conn.on("close", () => state(received.length ? `انتهى الاتصال · وصل ${filesAr(received.length)}` : "انقطع الاتصال — أعد المحاولة من الجوال"));
      conn.on("data", (msg) => {
        if (typeof msg === "string") {
          const m = JSON.parse(msg);
          if (m.t === "batch") state(`جاري الاستلام… 0 / ${m.count}`, "ok");
          if (m.t === "start") { cur = { ...m, chunks: [], got: 0 }; addTile(cur); }
          if (m.t === "end" && cur) {
            const blob = new Blob(cur.chunks, { type: cur.type || "application/octet-stream" });
            cur.chunks = null;
            if (blob.size !== cur.size) return markTile(cur, "bad");
            received.push({ name: cur.name, blob });
            doneTile(cur, blob);
            state(`جاري الاستلام… ${m.index + 1} / ${m.count}`, "ok");
          }
          if (m.t === "done") state(`وصل ${filesAr(received.length)} بالجودة الأصلية ✓`, "ok");
          return;
        }
        if (!cur) return;
        cur.chunks.push(msg);
        cur.got += msg.byteLength;
        const bar = document.querySelector(`[data-f="${cur.id}"] .bar i`);
        if (bar) bar.style.width = `${(cur.got / cur.size) * 100}%`;
      });
    });
  };

  const grid = document.getElementById("grid");
  const addTile = (f) => {
    document.getElementById("inbox").hidden = false;
    grid.insertAdjacentHTML("afterbegin", `
      <div class="xfer-tile" data-f="${esc(f.id)}">
        <div class="ph">${ic(f.type?.startsWith("video") ? "camera" : "file")}</div>
        <div class="meta"><span class="n">${esc(f.name)}</span><small>${sizeTag(f.size)}</small><div class="bar"><i></i></div></div>
      </div>`);
  };
  const markTile = (f, cls) => grid.querySelector(`[data-f="${f.id}"]`)?.classList.add(cls);
  const doneTile = (f, blob) => {
    const tile = grid.querySelector(`[data-f="${f.id}"]`);
    if (!tile) return;
    const url = URL.createObjectURL(blob);
    tile.classList.add("done");
    tile.querySelector(".ph").innerHTML = blob.type.startsWith("image") ? `<img src="${url}" alt="">` : blob.type.startsWith("video") ? `<video src="${url}" muted></video>` : ic("file");
    // e.g. HEIC on Windows: the file is fine, the browser just cannot preview it
    const media = tile.querySelector(".ph img, .ph video");
    if (media) media.onerror = () => { tile.querySelector(".ph").innerHTML = ic(blob.type.startsWith("video") ? "camera" : "file"); };
    tile.querySelector(".bar").outerHTML = `<button class="btn btn-sm btn-soft dl">${ic("download", "ico-sm")} تحميل</button>`;
    tile.querySelector(".dl").onclick = () => saveBlob(blob, f.name);
    document.getElementById("count").innerHTML = `${filesAr(received.length)} · ${sizeTag(received.reduce((t, r) => t + r.blob.size, 0))}`;
    document.getElementById("bar").hidden = false;
  };

  document.getElementById("zip").onclick = async () => {
    if (!received.length) return;
    const b = busy("تجهيز ملف ZIP…");
    try {
      await loadScript(XFER_LIBS.zip);
      const zip = new JSZip();
      const used = new Set();
      for (const r of received) {
        // keep every name unique inside the zip (two phones can both send IMG_0001.jpg)
        let n = r.name, i = 1;
        while (used.has(n)) n = r.name.replace(/(\.[^.]*)?$/, (ext) => `-${i++}${ext || ""}`);
        used.add(n);
        zip.file(n, r.blob, { binary: true, compression: "STORE" }); // photos are already compressed; STORE keeps it fast
      }
      const out = await zip.generateAsync({ type: "blob" });
      saveBlob(out, `hectar-photos-${new Date().toISOString().slice(0, 10)}.zip`);
    } catch (e) { fail(e); } finally { b.done(); }
  };
  document.getElementById("each").onclick = async () => {
    for (const r of received) { saveBlob(r.blob, r.name); await new Promise((res) => setTimeout(res, 350)); }
  };
  start();
}

/* ---------- send (phone) ---------- */
async function renderSend(code) {
  view.innerHTML = `
    <header class="hero" style="padding-bottom:40px">
      <div class="hero-bar"><a class="icon-btn" href="#/transfer" aria-label="رجوع">${ic("back")}</a><img src="${A.markWhite}" alt="" style="width:30px"></div>
      <div class="eyebrow">نقل الصور · إرسال</div>
      <h1>أرسل للكمبيوتر</h1>
      <div class="sub">اكتب الرمز الظاهر على الكمبيوتر</div>
    </header>
    <form class="sheet form" id="f">
      <label class="field"><span>رمز الكمبيوتر</span>
        <input class="input ltr code-input" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="000000" value="${esc(code)}" required autocomplete="off"></label>
      <div class="xfer-state" id="state"></div>
      <label class="btn btn-primary btn-block" id="pick" hidden>${ic("camera")} <span id="pick-t">اختر الصور والفيديو</span>
        <input type="file" id="files" accept="image/*,video/*" multiple hidden></label>
      <div class="wlist" id="list"></div>
      <div class="card totals" id="sum" hidden></div>
      <div class="actionbar" id="connectbar"><div class="inner"><button class="btn btn-primary">${ic("check")} اتصال</button></div></div>
    </form>`;

  const form = document.getElementById("f");
  const state = (t, cls = "") => { const el = document.getElementById("state"); if (el) { el.textContent = t; el.className = `xfer-state ${cls}`; } };
  let conn = null;

  const connect = async (c) => {
    state("جاري الاتصال…");
    try { await loadScript(XFER_LIBS.peer); } catch (e) { return state(e.message, "bad"); }
    xfer?.destroy();
    const peer = (xfer = newPeer());
    const timer = setTimeout(() => { if (!conn?.open) state("ما لقيت الكمبيوتر — تأكد إن صفحة الاستقبال مفتوحة والرمز صحيح", "bad"); }, 15000);
    peer.on("error", (err) => {
      clearTimeout(timer);
      state(err.type === "peer-unavailable" ? "الرمز غير صحيح أو صفحة الاستقبال مقفلة" : "تعذر الاتصال — تأكد من الإنترنت", "bad");
    });
    peer.on("open", () => {
      conn = peer.connect(XFER_PREFIX + c, { reliable: true, serialization: "raw" });
      conn.on("open", () => {
        clearTimeout(timer);
        state("متصل بالكمبيوتر ✓", "ok");
        document.getElementById("connectbar").hidden = true;
        form.code.disabled = true;
        document.getElementById("pick").hidden = false;
      });
      conn.on("close", () => state("انقطع الاتصال", "bad"));
    });
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    const c = form.code.value.trim();
    if (!/^\d{6}$/.test(c)) return state("الرمز 6 أرقام", "bad");
    connect(c);
  };
  if (/^\d{6}$/.test(code)) connect(code); // opened from the QR code: connect straight away

  document.getElementById("files").onchange = async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    if (files.length) await sendFiles(files);
  };

  async function sendFiles(files) {
    const list = document.getElementById("list");
    const sum = document.getElementById("sum");
    const total = files.reduce((t, f) => t + f.size, 0);
    let sent = 0;
    list.innerHTML = files.map((f, i) => `
      <div class="card xfer-row" data-i="${i}">
        <span class="n">${esc(f.name)}</span><small>${sizeTag(f.size)}</small>
        <div class="bar"><i></i></div>
      </div>`).join("");
    sum.hidden = false;
    const showSum = () => (sum.innerHTML = `<div class="grand"><span>${filesAr(files.length)} · ${sizeTag(total)}</span><b class="num">${Math.floor((sent / total) * 100)}%</b></div>`);
    showSum();
    document.getElementById("pick").hidden = true;

    const dc = conn.dataChannel;
    const max = Math.min(CHUNK, conn.peerConnection?.sctp?.maxMessageSize || CHUNK);
    dc.bufferedAmountLowThreshold = 1 << 20;
    const drain = () => (dc.bufferedAmount < 8 << 20 ? null : new Promise((r) => dc.addEventListener("bufferedamountlow", r, { once: true })));
    // keep the phone awake while sending
    const lock = await navigator.wakeLock?.request("screen").catch(() => null);
    try {
      conn.send(JSON.stringify({ t: "batch", count: files.length }));
      for (const [i, f] of files.entries()) {
        const id = `${Date.now().toString(36)}-${i}`;
        conn.send(JSON.stringify({ t: "start", id, name: f.name || `photo-${i + 1}.jpg`, size: f.size, type: f.type }));
        const row = list.querySelector(`[data-i="${i}"] .bar i`);
        for (let off = 0; off < f.size; off += max) {
          if (!conn.open) throw new Error("انقطع الاتصال أثناء الإرسال");
          await drain();
          const buf = await f.slice(off, off + max).arrayBuffer();
          conn.send(buf);
          sent += buf.byteLength;
          row.style.width = `${((off + buf.byteLength) / f.size) * 100}%`;
          if ((off / max) % 16 === 0) showSum();
        }
        conn.send(JSON.stringify({ t: "end", id, index: i, count: files.length }));
        list.querySelector(`[data-i="${i}"]`).classList.add("done");
      }
      // wait until everything queued has actually left the phone
      while (dc.bufferedAmount > 0) await new Promise((r) => setTimeout(r, 100));
      conn.send(JSON.stringify({ t: "done" }));
      showSum();
      state(`تم إرسال ${filesAr(files.length)} بالجودة الأصلية ✓`, "ok");
      document.getElementById("pick").hidden = false;
      document.getElementById("pick-t").textContent = "إرسال صور أخرى";
    } catch (err) {
      state(err.message, "bad");
      document.getElementById("pick").hidden = !conn?.open;
    } finally {
      lock?.release?.();
    }
  }
}
