const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

function stripQuery(value) {
  return String(value || '').split('#')[0].split('?')[0].replace(/^\.\//, '');
}

function localRefsFromIndex(html) {
  const refs = new Set();
  const re = /(?:src|href)=["']([^"']+)["']/g;
  for (const match of html.matchAll(re)) {
    const raw = match[1];
    if (!raw || /^(?:https?:|data:|mailto:|#)/i.test(raw)) continue;
    const file = stripQuery(raw);
    if (file) refs.add(file);
  }
  return refs;
}

function appFilesFromServiceWorker(text) {
  const refs = new Set();
  const block = text.match(/const\s+APP_FILES\s*=\s*\[([\s\S]*?)\];/);
  if (!block) throw new Error('APP_FILES konnte im Service Worker nicht gelesen werden.');
  const re = /["']\.\/([^"']+)["']/g;
  for (const match of block[1].matchAll(re)) {
    if (match[1]) refs.add(stripQuery(match[1]));
  }
  return refs;
}

function manifestRefs(text) {
  const refs = new Set();
  let manifest;
  try { manifest = JSON.parse(text); } catch (error) { throw new Error(`manifest.json ist ungültig: ${error.message}`); }
  (manifest.icons || []).forEach((icon) => {
    const file = stripQuery(icon?.src || '');
    if (file) refs.add(file);
  });
  return refs;
}

function copyFile(relativePath) {
  const source = path.join(root, relativePath);
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
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
  const parts = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
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
  fs.writeFileSync(path.join(dist, 'build-info.js'), `window.LK_BUILD_INFO = ${JSON.stringify({ ...stamp, version: 'FINAL' }, null, 2)};\n`, 'utf8');

  const indexPath = path.join(dist, 'index.html');
  let index = fs.readFileSync(indexPath, 'utf8');
  index = index.replace(/App-Version: \d{2}\.\d{2}\.\d{4} · \d{2}:\d{2}:\d{2} Uhr/g, `App-Version: ${stamp.label}`);
  index = index.replace(/Lernstand-Kompass · \d{2}\.\d{2}\.\d{4} \d{2}:\d{2}/g, `Lernstand-Kompass · ${stamp.date} ${stamp.time.slice(0,5)}`);
  index = index.replace(/v=\d{8}-\d{6}/g, `v=${stamp.id}`);
  fs.writeFileSync(indexPath, index, 'utf8');

  const swPath = path.join(dist, 'service-worker.js');
  let sw = fs.readFileSync(swPath, 'utf8');
  sw = sw.replace(/const CACHE_NAME = "[^"]+";/, `const CACHE_NAME = "lernstand-kompass-${stamp.id}";`);
  fs.writeFileSync(swPath, sw, 'utf8');
  console.log(`App-Version: ${stamp.label}`);
}

function validateDist() {
  const index = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(dist, 'service-worker.js'), 'utf8');
  const manifest = fs.readFileSync(path.join(dist, 'manifest.json'), 'utf8');
  const required = new Set([
    ...localRefsFromIndex(index),
    ...appFilesFromServiceWorker(sw),
    ...manifestRefs(manifest),
    'index.html', 'service-worker.js', 'manifest.json'
  ]);
  const missing = [...required].filter((file) => !fs.existsSync(path.join(dist, file)));
  if (missing.length) {
    throw new Error(`Build unvollständig. Fehlende Laufzeitdateien:\n- ${missing.join('\n- ')}`);
  }
  // Zentraler Schutz gegen den früheren Fehler: Autosave und Wochenplan-Fix müssen im Produktionsbuild sein.
  ['weekly-autosave.js', 'weekly-fix-172.js'].forEach((file) => {
    if (!fs.existsSync(path.join(dist, file))) throw new Error(`Kritische Laufzeitdatei fehlt: ${file}`);
  });
  console.log(`Runtime-Prüfung erfolgreich: ${required.size} referenzierte Dateien vorhanden.`);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const sourceIndex = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sourceSw = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
const sourceManifest = fs.readFileSync(path.join(root, 'manifest.json'), 'utf8');
const runtimeFiles = new Set([
  ...localRefsFromIndex(sourceIndex),
  ...appFilesFromServiceWorker(sourceSw),
  ...manifestRefs(sourceManifest),
  'index.html', 'service-worker.js', 'manifest.json', 'LICENSE', 'README.md', 'lernstand-kompass.png'
]);

// Alle referenzierten Dateien werden automatisch übernommen. Damit kann eine neue
// Script-Datei nicht mehr versehentlich in index.html stehen, aber im Build fehlen.
[...runtimeFiles].sort().forEach(copyFile);
// Assets vollständig übernehmen, damit neue Cover/Icons nicht einzeln gepflegt werden müssen.
copyDirectory('materials');
copyDirectory('icons');

writeBuildStamp();
validateDist();
console.log(`Build fertig: ${path.relative(root, dist)}`);
