/* Paket 3f: zuverlässiger Wechsel zwischen Tier-QR-Codes.
 *
 * Zwei Fehler werden abgefangen:
 * 1. Der automatische Kinder-Sync muss tatsächlich geladen sein.
 * 2. Neue QR-Karten verwenden ?k=TOKEN statt #k=TOKEN. Dadurch lädt der
 *    Browser beim Scannen eines anderen Tieres zuverlässig neu.
 *
 * Alte #k=-QR-Codes bleiben kompatibel: bei einem Hash-Wechsel wird neu geladen.
 */
(() => {
  function appBaseUrl() {
    if (location.protocol !== "http:" && location.protocol !== "https:") return "";
    const path = location.pathname.endsWith("index.html")
      ? location.pathname.slice(0, -"index.html".length)
      : location.pathname;
    return `${location.origin}${path}`;
  }

  function tokenFromLocation() {
    try {
      const url = new URL(location.href);
      const fromQuery = url.searchParams.get("k") || "";
      if (fromQuery) return fromQuery;
      return new URLSearchParams(url.hash.replace(/^#/, "")).get("k") || "";
    } catch {
      return "";
    }
  }

  // Nach child-sync.js überschreiben: neue Karten erzeugen eine echte Navigation
  // statt nur eines Fragment-Wechsels.
  if (typeof qrPayloadForAnimal === "function") {
    const fallbackQrPayloadForAnimal = qrPayloadForAnimal;
    qrPayloadForAnimal = function reliableChildQrPayload(animal) {
      const base = appBaseUrl();
      const token = String(animal?.qrToken || "").trim();
      if (!base || !token) return fallbackQrPayloadForAnimal(animal);
      return `${base}?k=${encodeURIComponent(token)}`;
    };
  }

  // Bereits gedruckte #k=-Karten: Wenn auf demselben Gerät ein anderes Tier
  // gescannt wird, erzwingen wir einen vollständigen Neustart der App.
  let lastHashToken = tokenFromLocation();
  window.addEventListener("hashchange", () => {
    const next = tokenFromLocation();
    if (next && next !== lastHashToken) {
      location.reload();
      return;
    }
    lastHashToken = next;
  });

  // Nach erfolgreicher Einrichtung die Tierkennung wieder aus der Adresszeile
  // entfernen. So bleibt der Zugang nicht versehentlich sichtbar/kopierbar.
  function clearConsumedQueryToken(attempt = 0) {
    const url = new URL(location.href);
    const queryToken = url.searchParams.get("k");
    if (!queryToken) return;

    const marker = state?.lkChildSync;
    if (marker?.qrToken === queryToken) {
      url.searchParams.delete("k");
      const clean = `${url.pathname}${url.search}${url.hash && !url.hash.startsWith("#k=") ? url.hash : ""}`;
      history.replaceState(null, "", clean || "/");
      return;
    }

    if (attempt < 20) {
      setTimeout(() => clearConsumedQueryToken(attempt + 1), 500);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => clearConsumedQueryToken(), 600);
  });
})();
