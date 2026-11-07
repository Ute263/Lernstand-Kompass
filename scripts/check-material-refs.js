// Prüft, dass jede im Code genannte Bilddatei unter materials/ bzw. icons/ existiert,
// einschließlich der zur Laufzeit gebildeten Cover "Welt der Zahl inklusiv" (Pakete A-F, Hefte 1-4).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const skip = new Set(['exceljs.min.js', 'jsqr.js']);
const files = fs.readdirSync(root).filter((f) => f.endsWith('.js') && !skip.has(f));
const missing = [];
let count = 0;
for (const file of files) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const m of text.matchAll(/(?:\.\/)?((?:materials|icons)\/[A-Za-z0-9_.\-]+\.(?:png|jpe?g|svg|webp|gif))/g)) {
    count += 1;
    if (!fs.existsSync(path.join(root, m[1]))) missing.push(`${file}: ${m[1]}`);
  }
}
for (const css of fs.readdirSync(root).filter((f) => f.endsWith('.css'))) {
  const text = fs.readFileSync(path.join(root, css), 'utf8');
  for (const m of text.matchAll(/url\(["']?(fonts\/[^"')]+)["']?\)/g)) {
    count += 1;
    if (!fs.existsSync(path.join(root, m[1]))) missing.push(`${css}: ${m[1]}`);
  }
}
for (const pack of 'abcdef') {
  for (const unit of '1234') {
    const rel = `materials/cover-wdz-${pack}${unit}.jpg`;
    count += 1;
    if (!fs.existsSync(path.join(root, rel))) missing.push(`Welt der Zahl: ${rel}`);
  }
}
if (missing.length) {
  console.error('Fehlende Bilddateien:\n  ' + missing.join('\n  '));
  process.exit(1);
}
console.log(`Bildreferenz-Prüfung erfolgreich: ${count} Verweise, alle Dateien vorhanden.`);
