# Abschlussbericht – Stabilisierung Lernstand-Kompass

## Schwerpunkt Speicherung

- Wochenplan-Autosave ist Bestandteil des Produktions-Builds.
- Textänderungen werden entprellt gespeichert; Klick-/Strukturänderungen unmittelbar.
- Vor Plan-, Kind- und Ansichtswechsel wird der letzte aktuelle Editorstand vollständig gespeichert.
- Schnelle Folgeänderungen werden serialisiert; ein Wechsel wartet auf den zuletzt angeforderten Speicherstand.
- Neue Einzel-/Gruppenpläne werden sofort persistent angelegt.
- Die zentrale Wochenplan-Normalisierung erhält auch neuere Felder wie Planungsmodus, Lesezeit, Lernwörter, freie Aufgaben, Sternchen und Sozialformen.
- Gelöschte Wochenpläne werden als synchronisierbare Löschmarkierungen erhalten und nicht von älteren Cloudständen wieder aktiviert.
- „Alle Pläne“ zeigt auch frühere/abgeschlossene Pläne; undatierte Entwürfe gelten nicht mehr fälschlich als aktuelle Woche.

## Schwerpunkt Synchronisierung

- Kindergeräte synchronisieren verschlüsselt über Cloudflare.
- Vor dem Kinder-Upload wird ein vorhandener Kinder-Cloudstand gelesen und zusammengeführt.
- Lehrkraftgeräte synchronisieren über OneDrive.
- Vor jedem OneDrive-Upload werden erreichbare Kinderänderungen eingelesen.
- OneDrive wird immer zuerst gelesen und anschließend gemergt.
- Schreiben verwendet ETag/If-Match; parallele Änderungen werden neu geladen und erneut zusammengeführt.
- Seitenstatus derselben Aufgabe werden seitenweise nach Änderungszeitpunkt gemergt.

## Schwerpunkt Druck

- Wochen- und Tagesplan verwenden den tatsächlich gültigen Plan des Kindes.
- Deutsch und Mathe werden getrennt und vollständig aufgebaut.
- Buchcover, Arbeitsblatt und Mikrofon werden als gemeinsame Materialspalte pro Aufgabenblock ausgegeben.
- Sozialformsymbole bleiben direkt an der jeweiligen Aufgabe.
- Druckseiten werden nur bei echtem Überlauf verkleinert und auf eine A4-Seite angepasst.

## Build und Projektbereinigung

- Alte nummerierte Quelldatei-Kopien wurden aus dem bereinigten Projekt entfernt.
- Doppelte Migration wurde entfernt.
- Der Build übernimmt alle aus `index.html`, Service Worker und Manifest tatsächlich benötigten Dateien automatisch.
- Fehlt eine Runtime-Datei, schlägt der Build fehl.
- `weekly-autosave.js` und `weekly-fix-172.js` werden ausdrücklich als kritische Produktionsdateien geprüft.
- Build-Zeitstempel und Service-Worker-Cache werden automatisch aktualisiert.

## Automatisierte Prüfungen

`npm run verify` prüft aktuell:

- JavaScript-Syntax aller aktiven eigenen Dateien und Testskripte
- Wochenplan-Ladereihenfolge und Struktur
- Auswahl des relevanten Wochenplans
- Wochenplan-Speicher-/Normalisierungs-Roundtrip
- schnelles Autosave + Flush vor Wechsel
- Gesamtbackup-Roundtrip
- Kinder-/Cloudflare-Merge
- allgemeine Sync-/Merge-Regeln einschließlich gelöschter Wochenpläne
- OneDrive-ETag-Konfliktschutz und Sync-Reihenfolge
- Wochen-/Tagesdrucklogik
- Produktions-Build
- Vollständigkeit aller Runtime-Dateien in `dist`

Zusätzlich wurde das frühere reale Gesamtbackup vom 19.09.2026 gegen die neue zentrale Normalisierung geprüft; die Mengen der gespeicherten Klassen, Kinder, Lernstände, Wochenpläne und Wochenplanstatus bleiben erhalten, und die erweiterte Wochenplanstruktur wird nicht mehr entfernt.
