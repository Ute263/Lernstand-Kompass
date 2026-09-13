# Paket 9o – Ruhiger Tageseditor im Wochenplan

## Neue Bedienung

Die fünf Wochentage springen nicht mehr selbstständig auf und zu.

### Noch ungeplanter Tag
Der Tag bleibt als kleine Zeile sichtbar:
- Dienstag
- noch nicht geplant · + Planen

Ein Klick auf die Zeile öffnet diesen Tag zur Bearbeitung.

### Teilweise oder vollständig geplanter Tag
Sobald mindestens eine Aufgabe vorhanden ist, bleibt der Tag dauerhaft
als kompakte Tageskarte sichtbar.

In der kompakten Karte werden die bereits eingetragenen Aufgaben angezeigt,
zum Beispiel:
- 📘 Deutsch · ABC der Tiere 2 S. 14
- 🔢 Mathe · MiniMax 2 S. 8
- ⭐ Zusatzaufgaben werden ebenfalls markiert

### Tag bearbeiten
Nur ein Tag gleichzeitig wird groß geöffnet.
Oben im geöffneten Bereich steht:

„Du bearbeitest gerade Montag.“

Mit **✓ Fertig** wird die große Bearbeitungsansicht geschlossen.
Der Tag bleibt danach kompakt mit seinen Aufgaben sichtbar.

### Zu einem anderen Tag wechseln
Ein Klick auf einen anderen Wochentag:
1. übernimmt zuerst alle aktuellen Eingaben in den Entwurf,
2. schließt den bisherigen Tag zur kompakten Übersicht,
3. öffnet gezielt den ausgewählten Tag.

Dadurch gehen beim Wechsel keine noch nicht gespeicherten Eingaben verloren.

## Technisch
Neu:
- weekly-editor-compact.js
- dist/weekly-editor-compact.js

Geändert:
- index.html
- dist/index.html
- scripts/build.js
- service-worker.js
- dist/service-worker.js

Das bestehende Paket 9n „Plan leeren mit Rückfrage“ bleibt enthalten.

Cache-Version: v116
