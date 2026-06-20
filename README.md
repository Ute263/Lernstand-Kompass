# Arbeitsheft-Kompass

Eine GitHub-Pages-App für eine einzelne Lehrkraft. GitHub speichert nur diese App-Dateien. Die Arbeitsstände werden lokal auf dem iPad/in diesem Browser gespeichert.

## Dateien für GitHub Pages

Diese Dateien müssen direkt im Repository liegen:

- `index.html`
- `styles.css`
- `models.js`
- `storage.js`
- `export.js`
- `qrcode.js`
- `app.js`
- `pwa.js`
- `manifest.json`
- `service-worker.js`
- `.nojekyll`
- `icons/icon-192.svg`
- `icons/icon-512.svg`

## GitHub Pages aktivieren

1. Repository öffnen.
2. `Settings` öffnen.
3. Links `Pages` öffnen.
4. Bei `Build and deployment` auswählen:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - Ordner: `/(root)`
5. Speichern.

## Speicherung

- bevorzugt IndexedDB
- fallback über localStorage
- Speicherung nach jeder Änderung
- keine externe Datenbank
- keine Cloud-Synchronisation

## QR-Karten

Im Lehrerinnenbereich gibt es den Tab `QR-Karten`. Dort können QR-Karten für die aktive Klasse angezeigt, neu erzeugt und gedruckt werden. Die QR-Codes enthalten keine Kindernamen und keine Arbeitsstände, sondern nur eine App-URL mit zufälligem Token.

## Schrift

Die App ist auf `Grundschrift` eingestellt. Wenn eine passende Schriftdatei vorhanden ist, lege sie so ab:

```text
fonts/Grundschrift.woff2
```

Ohne diese Datei nutzt der Browser automatisch eine freundliche Ersatzschrift.
