const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const files = [
  "index.html",
  "styles.css",
  "models.js",
  "storage.js",
  "exceljs.min.js",
  "exceljs-LICENSE.txt",
  "export.js",
  "qrcode.js",
  "app.js",
  "pwa.js",
  "manifest.json",
  "service-worker.js",
  "README.md",
  "materials/stickerbogen-1-deutsch-mathe-1.png",
  "materials/stickerbogen-2-mathe-forscher.png",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/icon-192.svg",
  "icons/icon-512.svg"
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

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
files.forEach(copyFile);

console.log(`Build fertig: ${path.relative(root, dist)}`);
