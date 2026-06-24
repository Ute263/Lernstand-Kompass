const CACHE_NAME = "lernstand-kompass-cache-v28";
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
  "./app.js",
  "./pwa.js",
  "./manifest.json",
  "./materials/stickerbogen-1-deutsch-mathe-1.png",
  "./materials/stickerbogen-2-mathe-forscher.png",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES))
  );
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

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    }).catch(() => caches.match("./index.html")))
  );
});
