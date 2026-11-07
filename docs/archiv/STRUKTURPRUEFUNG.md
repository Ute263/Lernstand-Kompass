# Strukturprüfung – Schritt 1

Ausgangspunkt: die unveränderte aktuelle Original-ZIP `Lernstand-Kompass-main(1).zip`.

## Änderungen

- Entfernt: `progress-children-overview 5.css` und `wrangler 4.jsonc` (bytegleiche, nicht eingebundene Kopien).
- Produktions-Build liefert nun `exceljs.min.js` (Excel) und `jsqr.js` (QR-Scanner) mit aus. Sie werden weiterhin erst bei Bedarf im Browser geladen.
- `npm run verify` prüft mit `check:structure` zusätzlich alle 39 Skripte und ihre bisherige Ladefolge, und ob die beiden dynamischen Bibliotheken im Build liegen.
- Keine Anwendungsfunktionen, CSS-Regeln, Speicherschlüssel, Druckansichten, APIs oder Service-Worker-Funktionen wurden verändert.

## Bewusst unverändert

- `app.js`, `models.js`, `storage.js`, `index.html`, `service-worker.js`, alle bestehenden `weekly-*`- und `learning-navigation-*`-Dateien. Die Überschreibungen sind nicht automatisch redundant; zuerst Abhängigkeiten und Abnahmetests erweitern.
- Beide Worker-Dateien: ihre Aufgaben sind verschieden; vor einem Eingriff muss geklärt werden, welche bereitgestellt werden.

## Sicherheit

Vor einem späteren Umstieg unbedingt Backups exportieren. Die hiesige ZIP ist eine lokale Prüffassung, **keine** für GitHub freigegebene Produktionsversion. Der Start unter localhost hat wegen des anderen Ursprungs einen eigenen Datenspeicher; keine Live-Synchronisierung mit echten Schülerdaten testen.

Test: `npm run verify` oder `node scripts/check-structure.js` nach `npm run build`.
