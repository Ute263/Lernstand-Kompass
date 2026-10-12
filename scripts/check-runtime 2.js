const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

function strip(value) { return String(value || '').split('#')[0].split('?')[0].replace(/^\.\//, ''); }
function refsFromIndex(text) {
  const out = new Set();
  for (const match of text.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    if (/^(?:https?:|data:|mailto:|#)/i.test(match[1])) continue;
    const file = strip(match[1]); if (file) out.add(file);
  }
  return out;
}
function refsFromSw(text) {
  const out = new Set();
  const block = text.match(/const\s+APP_FILES\s*=\s*\[([\s\S]*?)\];/);
  if (!block) throw new Error('APP_FILES fehlt im Service Worker.');
  for (const match of block[1].matchAll(/["']\.\/([^"']+)["']/g)) out.add(strip(match[1]));
  return out;
}
if (!fs.existsSync(dist)) throw new Error('dist fehlt. Zuerst npm run build ausführen.');
const index = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(dist, 'service-worker.js'), 'utf8');
const refs = new Set([...refsFromIndex(index), ...refsFromSw(sw)]);
const missing = [...refs].filter((file) => !fs.existsSync(path.join(dist, file)));
if (missing.length) throw new Error(`Fehlende Laufzeitdateien in dist:\n- ${missing.join('\n- ')}`);
console.log(`Dist-Laufzeitprüfung erfolgreich: ${refs.size} Dateien geprüft.`);
