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
- `jsqr.js`
- `jsqr-LICENSE.txt`
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

## Excel-Export

Im Lehrerinnenbereich gibt es den Tab `Excel-Export`. Dort können CSV-Listen für die aktive Klasse, alle Klassen, den heutigen Tag und offene Hilfe-/Kontrollwünsche erstellt werden. Die Dateien verwenden Semikolon-Trennung und UTF-8 mit BOM, damit sie in deutschem Excel gut lesbar sind.

Zusätzlich kann eine Excel-Arbeitsmappe mit den Blättern `Arbeitsstände`, `Fortschritt` und `Tier-Verläufe` erstellt werden. Sie enthält keine Kindernamen und keine QR-Tokens.

## Fortschritt

Im Lehrerinnenbereich gibt es den Tab `Fortschritt`. Dort werden Arbeitsstände chronologisch und neutral ausgewertet: letzte Aktivität, Seitenfortschritt, Gruppenschnitt, Soll-Seiten und offene Hilfe-/Kontrollwünsche. Soll-Seiten und Fortschritts-Einstellungen werden unter `Tiere & Materialien` verwaltet.

## QR-Karten

Im Lehrerinnenbereich gibt es den Tab `QR-Karten`. Dort können QR-Karten für die aktive Klasse angezeigt, neu erzeugt und gedruckt werden. Die QR-Codes enthalten keine Kindernamen und keine Arbeitsstände, sondern nur einen zufälligen Tier-Code wie `ak-8F3KQ2M9`.

Der Kinderbereich kann diesen QR-Code direkt in der App scannen. Dafür wird die Kamera nur während des Scans geöffnet. Es werden keine Fotos gespeichert.

Die QR-Erkennung nutzt zuerst die lokale Browser-Funktion `BarcodeDetector`, falls verfügbar. Wenn nicht, nutzt die App die lokal mitgelieferte Datei `jsqr.js`. Es wird kein CDN und kein externer QR-Dienst verwendet.

## PIN und Wiederherstellung

Die App speichert keine Klartext-PIN. Nach der ersten Einrichtung wird ein Wiederherstellungsschlüssel einmalig angezeigt. Er muss analog notiert werden, weil in der App nur ein Hash gespeichert wird.

## Schrift

Die App ist auf `Grundschrift` eingestellt. Wenn eine passende Schriftdatei vorhanden ist, lege sie so ab:

```text
fonts/Grundschrift.woff2
```

Ohne diese Datei nutzt der Browser automatisch eine freundliche Ersatzschrift.
