const CACHE_NAME = "lernstand-kompass-20261107-schritt3a-lehrerdesign";
const APP_FILES = [
  "./",
  "./index.html",
  "./build-info.js",
  "./styles.css",
  "./teacher-modern.css",
  "./progress-children-overview.css",
  "./legal-info.css",
  "./minimax-tests.css",
  "./minimax-katalog-daten.js",
  "./models.js",
  "./storage.js",
  "./export.js",
  "./qrcode.js",
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
  "./minimax-tests.js",
  "./learning-subjects.js",
  "./learning-development.js",
  "./learning-navigation-v8.js",
  "./weekly-fix-172.js",
  "./progress-children-overview.js",
  "./print-overview-fix.js",
  "./weekly-autosave.js",
  "./legal-info.js",
  "./THIRD_PARTY_LICENSES/jsQR-Apache-2.0.txt",
  "./THIRD_PARTY_LICENSES/ExcelJS-MIT.txt",
  "./THIRD_PARTY_LICENSES/Grundschrift-CC-BY-3.0.md",
  "./fonts/Grundschrift-Regular.otf",
  "./fonts/Grundschrift-Bold.otf",
  "./pwa.js",
  "./manifest.json",
  "./lernstand-kompass.png",
  "./icons/icon-192.png",
  "./materials/icon-microphone.png",
  "./materials/socialform-icons.png"
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

async function cacheFirstWithRefresh(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const refresh = fetch(request).then((response) => {
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  if (cached) {
    // Netzwerkaktualisierung laeuft weiter, blockiert aber die Anzeige nicht.
    refresh.catch(() => {});
    return cached;
  }
  return (await refresh) || cache.match("./index.html");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(cacheFirstWithRefresh(request));
});
