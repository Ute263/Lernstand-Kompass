# Schritt 3u – Browser-Schnappschusstest und Entfernung von learning-navigation-v7

- Neu: `npm run check:snapshot` (nach `npm run build`). Rendert im echten Browser (Playwright/Chromium) 82 Ansichten:
  alle Lehrkraft-Tabs, Wochenplan-Editor (Woche, Tag, individueller Plan), Druck (3 Varianten, Alle/Einzelkind, mit/ohne Kästchen),
  Kinderansicht, Navigationsstruktur. Vergleich per Hash mit `scripts/browser-snapshot-referenz.json`.
  Nach einer **bewussten** Änderung der Darstellung: `node scripts/check-browser-snapshot.js --update`.
  Der Test steht absichtlich nicht in `npm run verify`, damit `verify` ohne Playwright (z. B. in GitHub Actions) läuft.
- Entfernt: `learning-navigation-v7.js` (archiviert unter `docs/archiv/learning-navigation-v7.js.txt`).
  Wirksam war nur noch die Ansicht „ABC-Lernstandsheft“; sie steht jetzt unverändert in `learning-navigation-v8.js`.
  Nachweis: alle 82 Ansichten vor und nach der Änderung identisch.
- Bewusst NICHT geändert: `weekly-plan-9e.js`, `weekly-plan-9f.js`, `weekly-fix-172.js`.
  Der Schnappschusstest prüft Darstellung, aber keine Klickabläufe (Seitenauswahl, Autosave). Für ein sicheres Zusammenführen
  fehlt ein Interaktionstest.
