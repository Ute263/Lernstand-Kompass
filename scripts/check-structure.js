// Struktur-Wächter: schützt die Ladefolge und on-demand-Bibliotheken der Original-App.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...index.matchAll(/<script\s+defer\s+src=["']([^"']+)["']/g)]
  .map(m => m[1].split('?')[0].replace(/^\.\//, ''));
const expected = JSON.parse(fs.readFileSync(path.join(__dirname,'script-load-order.json'), 'utf8'));
assert.deepStrictEqual(scripts, expected, 'Ladefolge geändert: bitte Abhängigkeiten prüfen und die Liste erst nach gesonderten Tests aktualisieren.');
assert.strictEqual(new Set(scripts).size, scripts.length, 'Ein Skript wird mehrfach geladen.');
for (const script of scripts) assert(fs.existsSync(path.join(root, script)), `Eingebundenes Skript fehlt: ${script}`);
for (const name of ['exceljs.min.js', 'jsqr.js']) {
  assert(fs.existsSync(path.join(root,name)), `Dynamisch geladenes Skript fehlt: ${name}`);
  assert(fs.existsSync(path.join(root,'dist',name)), `Dynamisch geladenes Skript fehlt im Build: ${name}`);
}
for (const name of ['progress-children-overview 5.css', 'wrangler 4.jsonc']) {
  assert(!fs.existsSync(path.join(root,name)), `Nicht benötigte Dateikopie wieder vorhanden: ${name}`);
}
console.log(`Strukturprüfung erfolgreich: ${scripts.length} Skripte in unveränderter Reihenfolge; dynamische Bibliotheken im Build.`);
