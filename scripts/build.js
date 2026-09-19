const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const files = [
  "index.html",
  "build-info.js",
  "styles.css",
  "progress-children-overview.css",
  "legal-info.css",
  "models.js",
  "storage.js",
  "exceljs.min.js",
  "exceljs-LICENSE.txt",
  "export.js",
  "qrcode.js",
  "jsqr.js",
  "sync.js",
  "app.js",
  "child-sync.js",
  "child-qr-fix.js",
  "nomen-probe.js",
  "nomen-plural-flex.js",
  "nomen-activity.js",
  "nomen-feedback.js",
  "teacher-inbox.js",
  "teacher-cockpit.js",
  "learning-overview-simple.js",
  "learning-games-plus.js",
  "safety-tools.js",
  "school-year-archive.js",
  "colleague-mode.js",
  "weekly-extra-tasks.js",
  "weekly-ui-cleanup.js",
  "weekly-plan-9e.js",
  "weekly-plan-9f.js",
  "weekly-minimax-pages.js",
  "weekly-calendar-overview.js",
  "weekly-editor-compact.js",
  "simple-ui.js",
  "progress-children-overview.js",
  "legal-info.js",
  "pwa.js",
  "manifest.json",
  "service-worker.js",
  "README.md",
  "LICENSE",
  "lernstand-kompass.png",
  "materials/cover-abc-der-tiere-1.svg",
  "materials/cover-abc-der-tiere-2.svg",
  "materials/cover-minimax-1.svg",
  "materials/cover-minimax-2.svg",
  "materials/stickerbogen-1-deutsch-mathe-1.png",
  "materials/stickerbogen-2-mathe-forscher.png",
  "materials/toni-nomen.png",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/icon-192.svg",
  "icons/icon-512.svg",
  "icons/lernstand-kompass.png"
];

function copyFile(relativePath) {
  const source = path.join(root, relativePath);
  if (!fs.existsSync(source)) {
    throw new Error(`Build-Datei fehlt: ${relativePath}`);
  }
  const target = path.join(dist, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDirectory(relativeDir) {
  const sourceDir = path.join(root, relativeDir);
  if (!fs.existsSync(sourceDir)) return;
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) copyDirectory(relativePath);
    else copyFile(relativePath);
  }
}


function berlinBuildStamp() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(now).reduce((acc, item) => {
    acc[item.type] = item.value;
    return acc;
  }, {});
  const id = `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
  const label = `${parts.day}.${parts.month}.${parts.year} · ${parts.hour}:${parts.minute}:${parts.second} Uhr`;
  return { id, label, date: `${parts.day}.${parts.month}.${parts.year}`, time: `${parts.hour}:${parts.minute}:${parts.second}` };
}

function writeBuildStamp() {
  const stamp = berlinBuildStamp();
  const buildInfo = `window.LK_BUILD_INFO = ${JSON.stringify(stamp, null, 2)};\n`;
  fs.writeFileSync(path.join(dist, "build-info.js"), buildInfo, "utf8");

  const indexPath = path.join(dist, "index.html");
  let index = fs.readFileSync(indexPath, "utf8");
  index = index.replace(/App-Version: \d{2}\.\d{2}\.\d{4} · \d{2}:\d{2}:\d{2} Uhr/g, `App-Version: ${stamp.label}`);
  index = index.replace(/Lernstand-Kompass · \d{2}\.\d{2}\.\d{4} \d{2}:\d{2}/g, `Lernstand-Kompass · ${stamp.date} ${stamp.time.slice(0,5)}`);
  index = index.replace(/v=\d{8}-\d{6}/g, `v=${stamp.id}`);
  fs.writeFileSync(indexPath, index, "utf8");

  const swPath = path.join(dist, "service-worker.js");
  let sw = fs.readFileSync(swPath, "utf8");
  sw = sw.replace(/const CACHE_NAME = "[^"]+";/, `const CACHE_NAME = "lernstand-kompass-${stamp.id}";`);
  fs.writeFileSync(swPath, sw, "utf8");

  console.log(`App-Version: ${stamp.label}`);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
files.forEach(copyFile);

// Materialien werden vollständig übernommen. So müssen neue Lehrwerks-Cover
// nicht bei jeder Ergänzung einzeln in der Build-Liste nachgetragen werden.
copyDirectory("materials");
writeBuildStamp();

console.log(`Build fertig: ${path.relative(root, dist)}`);
