const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const vendorFiles = new Set([
  "exceljs.min.js",
  "jsqr.js",
  "qrcode.js"
]);

const files = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
  .map((entry) => entry.name)
  .filter((name) => !vendorFiles.has(name));

const additionalFiles = [
  "cloudflare-worker/worker.js",
  "scripts/build.js"
].filter((relativePath) => fs.existsSync(path.join(root, relativePath)));

const targets = [...files, ...additionalFiles];
let failed = false;

for (const relativePath of targets) {
  const absolutePath = path.join(root, relativePath);
  const result = spawnSync(process.execPath, ["--check", absolutePath], {
    encoding: "utf8"
  });

  if (result.status !== 0) {
    failed = true;
    console.error(`\nSyntaxfehler in ${relativePath}`);
    console.error(result.stderr || result.stdout || "Unbekannter Fehler");
  } else {
    console.log(`OK  ${relativePath}`);
  }
}

if (failed) process.exit(1);
console.log(`\nSyntaxprüfung erfolgreich: ${targets.length} Dateien geprüft.`);
