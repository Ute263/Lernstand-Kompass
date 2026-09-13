# Paket 3f – Kinder-QR-Fix

Gefundene Fehler:
1. `child-sync.js` lag im Repository, wurde aber in der aktuellen `index.html`
   nicht mehr geladen.
2. `scripts/build.js` kopierte `child-sync.js` nicht nach `dist`.
3. Beim Testen mehrerer Tiere auf demselben Handy wurde nur `#k=...` geändert.
   Ein Fragmentwechsel lädt dieselbe Web-App nicht zuverlässig neu.

Fix:
- `child-sync.js` wieder in `index.html` eingebunden.
- `child-sync.js` und `child-qr-fix.js` wieder in den Build aufgenommen.
- Neue QR-Karten verwenden `?k=...`; ein anderes Tier erzwingt damit eine
  vollständige Navigation.
- Alte `#k=...`-Karten bleiben durch einen Hash-Wechsel-Fallback nutzbar.
- Nach erfolgreichem Kinder-Login wird `?k=...` wieder aus der Adresszeile entfernt.
- Cache auf v89 erhöht.

Dateien:
- index.html
- scripts/build.js
- child-qr-fix.js (neu)
- service-worker.js

Wichtig:
`child-sync.js` muss bereits im Repository vorhanden sein. Das ist im aktuellen
Repository der Fall.
