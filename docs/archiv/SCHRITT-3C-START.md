# Lernstand-Kompass – Schritt 3c: Wochenplan-Eingabe

Basis: vollständige Original-App mit den bisherigen Funktionen. Es wurden **nur die Anordnung des Wochenplan-Editors und dessen Bildschirmgestaltung** verändert. Die Original-Druckansicht, Kinderansicht, Materialdaten, Speicherformate und die weitere Navigation bleiben erhalten.

## Was geändert ist

- Oben: Plan auswählen, Zeitraum und Umschalter **Wochenplan / Tagesplan**.
- Darunter: Plan gilt für die ganze Klasse oder ausgewählte Kinder.
- Die Tierliste wird nur bei individueller Auswahl geöffnet, statt dauerhaft den gesamten Bildschirm zu füllen.
- Darunter erscheint die gewohnte Aufgabenbearbeitung, nun deutlich früher sichtbar.
- Die bestehende Wochen-/Tageslogik und das Speichern bleiben erhalten.

## Terminal und localhost – jeder Schritt

1. In der bisher geöffneten App vorher unter Backup eine Sicherung der Testdaten exportieren.
2. Das bisherige Terminal-Fenster anklicken und **Control + C** drücken. Danach schließen.
3. Die ZIP-Datei entpacken und den Ordner **Lernstand-Kompass-Original-Schritt3c** außerhalb des GitHub-Projekts speichern.
4. Den Ordner öffnen und auf **start-local.command** doppelklicken. Falls macOS blockiert: Rechtsklick auf die Datei → Öffnen.
5. Das neue Terminal offen lassen. Erwartete Adresse: **http://localhost:8770**.
6. Chrome öffnen, **http://localhost:8770** oben eingeben und Enter drücken.
7. Bei einer alten Darstellung **Command + Shift + R** drücken. Keine Website-Daten löschen.
8. Im Lehrerbereich zu **Wochenplan → Plan bearbeiten** wechseln. Zwischen Wochenplan und Tagesplan umschalten, einmal eine Kinderzuordnung öffnen, Aufgaben und Druckvorschau kontrollieren.
9. Zum Beenden zurück ins Terminal und **Control + C** drücken.

## Prüfung und Grenzen

Die vollständige automatische Projektprüfserie (`npm run verify`) und die zusätzliche Editor-Strukturprüfung (`node scripts/check-editor-structure.js`) sind erfolgreich. Der direkte localhost-Browsertest wurde in der Testumgebung blockiert. Der praktische Test auf dem MacBook ist daher weiterhin erforderlich. GitHub und Cloudflare bleiben unverändert.
