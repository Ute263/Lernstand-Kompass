const CACHE_NAME = "lernstand-kompass-cache-v155";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./models.js",
  "./storage.js",
  "./exceljs.min.js",
  "./exceljs-LICENSE.txt",
  "./export.js",
  "./qrcode.js",
  "./jsqr.js",
  "./sync.js",
  "./app.js",
  "./child-sync.js",
  "./child-qr-fix.js",
  "./nomen-probe.js",
  "./nomen-plural-flex.js",
  "./nomen-activity.js",
  "./nomen-feedback.js",
  "./teacher-inbox.js",
  "./teacher-cockpit.js",
  "./learning-overview-simple.js",
  "./learning-games-plus.js",
  "./safety-tools.js",
  "./school-year-archive.js",
  "./colleague-mode.js",
  "./weekly-extra-tasks.js",
  "./weekly-ui-cleanup.js",
  "./weekly-plan-9e.js",
  "./weekly-plan-9f.js",
  "./weekly-minimax-pages.js",
  "./weekly-calendar-overview.js",
  "./weekly-editor-compact.js",
  "./simple-ui.js",
  "./pwa.js",
  "./manifest.json",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./materials/cover-abc-der-tiere-1.svg",
  "./materials/cover-abc-der-tiere-2.svg",
  "./materials/cover-minimax-1.svg",
  "./materials/cover-minimax-2.svg",
  "./materials/cover-abc-der-tiere-1-schreiblehrgang-teil-a.png",
  "./materials/cover-abc-der-tiere-2-spracharbeitsheft-teil-a.png",
  "./materials/cover-minimax-1-neu.png",
  "./materials/cover-minimax-2-neu.png",
  "./materials/cover-flex-a-bh1.jpg",
  "./materials/cover-flex-a-bh2.jpg",
  "./materials/cover-flex-a-bh3.jpg",
  "./materials/cover-flex-a-gut-starten.jpg",
  "./materials/cover-flex-b-bh4.jpg",
  "./materials/cover-flex-b-bh5.jpg",
  "./materials/cover-flex-b-bh6.jpg",
  "./materials/cover-flex-b-bh7.jpg",
  "./materials/cover-flex-c-lesen.jpg",
  "./materials/cover-flex-c-texte.jpg",
  "./materials/cover-flex-c-richtig.jpg",
  "./materials/cover-flex-c-sprache.jpg",
  "./materials/cover-wdz-a1.jpg",
  "./materials/cover-wdz-a2.jpg",
  "./materials/cover-wdz-a3.jpg",
  "./materials/cover-wdz-a4.jpg",
  "./materials/cover-wdz-b1.jpg",
  "./materials/cover-wdz-b2.jpg",
  "./materials/cover-wdz-b3.jpg",
  "./materials/cover-wdz-b4.jpg",
  "./materials/cover-wdz-c1.jpg",
  "./materials/cover-wdz-c2.jpg",
  "./materials/cover-wdz-c3.jpg",
  "./materials/cover-wdz-c4.jpg",
  "./materials/cover-wdz-d1.jpg",
  "./materials/cover-wdz-d2.jpg",
  "./materials/cover-wdz-d3.jpg",
  "./materials/cover-wdz-d4.jpg",
  "./materials/stickerbogen-1-deutsch-mathe-1.png",
  "./materials/stickerbogen-2-mathe-forscher.png",
  "./materials/toni-nomen.png",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html")))
  );
});
