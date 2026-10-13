/**
 * هكتار | رفع المقاسات — Google Apps Script backend.
 * Data lives in the owner's Google Drive:
 *   📁 هكتار - رفع المقاسات/
 *       📊 هكتار - قاعدة البيانات   (sheets: projects, walls)
 *       📁 <project name>/            (wall photos + report PDF)
 */

const ROOT_NAME = "هكتار - رفع المقاسات";
const DB_NAME = "هكتار - قاعدة البيانات";
const COLS = {
  projects: ["id", "name", "client", "location", "status", "created_at", "closed_at", "folder_id", "pdf_id", "pdf_url"],
  walls: ["id", "project_id", "name", "width_cm", "height_cm", "materials", "notes", "photo_id", "thumb_id", "created_at"],
};

function doGet() {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("هكتار | رفع المقاسات")
    .addMetaTag("viewport", "width=device-width, initial-scale=1, viewport-fit=cover");
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/* ---------- storage helpers ---------- */

function props_() { return PropertiesService.getScriptProperties(); }

function root_() {
  const id = props_().getProperty("ROOT_ID");
  if (id) {
    try {
      const f = DriveApp.getFolderById(id);
      if (!f.isTrashed()) return f;
    } catch (e) { /* recreate below */ }
  }
  const folder = DriveApp.createFolder(ROOT_NAME);
  props_().setProperty("ROOT_ID", folder.getId());
  return folder;
}

function db_() {
  const id = props_().getProperty("DB_ID");
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* recreate below */ }
  }
  const ss = SpreadsheetApp.create(DB_NAME);
  DriveApp.getFileById(ss.getId()).moveTo(root_());
  Object.keys(COLS).forEach((name, i) => {
    const sh = i === 0 ? ss.getSheets()[0].setName(name) : ss.insertSheet(name);
    sh.getRange(1, 1, 1000, COLS[name].length).setNumberFormat("@"); // keep ISO dates/ids as plain text
    sh.getRange(1, 1, 1, COLS[name].length).setValues([COLS[name]]).setFontWeight("bold");
    sh.setFrozenRows(1);
  });
  props_().setProperty("DB_ID", ss.getId());
  return ss;
}

function sheet_(name) { return db_().getSheetByName(name); }

function rows_(name) {
  const values = sheet_(name).getDataRange().getValues();
  const cols = COLS[name];
  return values.slice(1).filter((r) => r[0]).map((r, i) => {
    const o = { _row: i + 2 };
    cols.forEach((c, j) => (o[c] = r[j] === "" ? null : String(r[j])));
    return o;
  });
}

function clean_(o, name) {
  const out = {};
  COLS[name].forEach((c) => (out[c] = o[c] == null ? null : o[c]));
  if (name === "walls") {
    out.width_cm = out.width_cm ? Number(out.width_cm) : null;
    out.height_cm = out.height_cm ? Number(out.height_cm) : null;
    out.materials = out.materials ? JSON.parse(out.materials) : [];
  }
  return out;
}

function write_(name, row, obj) {
  const sh = sheet_(name);
  const values = [COLS[name].map((c) => (obj[c] == null ? "" : String(obj[c])))];
  const r = row || sh.getLastRow() + 1;
  sh.getRange(r, 1, 1, values[0].length).setNumberFormat("@").setValues(values);
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function saveImage_(folder, dataUrl, name) {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);/)[1];
  return folder.createFile(Utilities.newBlob(Utilities.base64Decode(b64), mime, name)).getId();
}

function trash_(id) {
  if (!id) return;
  try { DriveApp.getFileById(id).setTrashed(true); } catch (e) { /* already gone */ }
}

function folderFor_(project) {
  try { return DriveApp.getFolderById(project.folder_id); } catch (e) { return root_(); }
}

/* ---------- API (called from the client via google.script.run) ---------- */

function listProjects() {
  const walls = rows_("walls");
  return rows_("projects").map((p) => {
    const own = walls.filter((w) => w.project_id === p.id).map((w) => clean_(w, "walls"));
    return Object.assign(clean_(p, "projects"), { walls: own });
  });
}

function getProject(id) {
  const p = rows_("projects").find((r) => r.id === id);
  if (!p) throw new Error("المشروع غير موجود");
  const walls = rows_("walls").filter((w) => w.project_id === id).map((w) => clean_(w, "walls"));
  walls.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return { project: clean_(p, "projects"), walls };
}

function createProject(data) {
  return withLock_(() => {
    const now = new Date().toISOString();
    const folder = root_().createFolder(data.name);
    const p = {
      id: Utilities.getUuid(), name: data.name, client: data.client || null, location: data.location || null,
      status: "open", created_at: now, closed_at: null, folder_id: folder.getId(), pdf_id: null, pdf_url: null,
    };
    write_("projects", null, p);
    return p;
  });
}

function saveWall(data) {
  return withLock_(() => {
    const project = rows_("projects").find((r) => r.id === data.project_id);
    if (!project) throw new Error("المشروع غير موجود");
    const existing = data.id ? rows_("walls").find((r) => r.id === data.id) : null;
    const wall = existing ? clean_(existing, "walls") : { id: Utilities.getUuid(), project_id: data.project_id, created_at: new Date().toISOString() };
    wall.name = data.name;
    wall.width_cm = data.width_cm;
    wall.height_cm = data.height_cm;
    wall.materials = JSON.stringify(data.materials || []);
    wall.notes = data.notes || null;
    if (data.photo) {
      const folder = folderFor_(project);
      const base = (data.name || "wall").replace(/[\\/:*?"<>|]+/g, "-");
      trash_(wall.photo_id);
      trash_(wall.thumb_id);
      wall.photo_id = saveImage_(folder, data.photo, base + ".jpg");
      wall.thumb_id = saveImage_(folder, data.thumb || data.photo, base + " (thumb).jpg");
    }
    write_("walls", existing ? existing._row : null, wall);
    wall.materials = data.materials || [];
    return wall;
  });
}

function deleteWall(id) {
  return withLock_(() => {
    const w = rows_("walls").find((r) => r.id === id);
    if (!w) return;
    trash_(w.photo_id);
    trash_(w.thumb_id);
    sheet_("walls").deleteRow(w._row);
  });
}

function deleteProject(id) {
  return withLock_(() => {
    const p = rows_("projects").find((r) => r.id === id);
    if (!p) return;
    try { DriveApp.getFolderById(p.folder_id).setTrashed(true); } catch (e) { /* already gone */ }
    const sh = sheet_("walls");
    rows_("walls").filter((w) => w.project_id === id).map((w) => w._row).sort((a, b) => b - a).forEach((r) => sh.deleteRow(r));
    sheet_("projects").deleteRow(p._row);
  });
}

function setStatus(id, status) {
  return withLock_(() => {
    const p = rows_("projects").find((r) => r.id === id);
    if (!p) throw new Error("المشروع غير موجود");
    p.status = status;
    write_("projects", p._row, p);
  });
}

function saveReport(id, base64, fileName) {
  return withLock_(() => {
    const p = rows_("projects").find((r) => r.id === id);
    if (!p) throw new Error("المشروع غير موجود");
    trash_(p.pdf_id);
    const file = folderFor_(p).createFile(Utilities.newBlob(Utilities.base64Decode(base64), "application/pdf", fileName));
    p.pdf_id = file.getId();
    p.pdf_url = file.getUrl();
    p.status = "closed";
    p.closed_at = new Date().toISOString();
    write_("projects", p._row, p);
    return clean_(p, "projects");
  });
}

/** Returns {fileId: dataUrl} for wall photos / thumbnails. */
function getImages(ids) {
  const out = {};
  (ids || []).filter(Boolean).forEach((id) => {
    try {
      const blob = DriveApp.getFileById(id).getBlob();
      out[id] = "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(blob.getBytes());
    } catch (e) { /* missing file → no image */ }
  });
  return out;
}

function rootUrl() { return root_().getUrl(); }
