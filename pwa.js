if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("service-worker.js").then((registration) => {
      registration.update();
      if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            worker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    }).catch((error) => {
      console.warn("Service Worker konnte nicht registriert werden.", error);
    });
  });
}

// Lädt ausschließlich die App-Dateien neu. Lernstände in IndexedDB/localStorage bleiben erhalten.
window.lkForceAppRefresh = async function lkForceAppRefresh() {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => String(key).startsWith("lernstand-kompass-")).map((key) => caches.delete(key)));
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch (error) {
    console.warn("App-Cache konnte nicht vollständig geleert werden.", error);
  }
  const url = new URL(window.location.href);
  url.searchParams.set("lk_build", window.LK_BUILD_INFO?.id || String(Date.now()));
  window.location.replace(url.toString());
};
