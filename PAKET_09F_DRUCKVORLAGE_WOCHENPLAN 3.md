# Paket 9f – Kindgerechte Wochenplan-Druckvorlage

Paket 9f baut auf Paket 9e auf und enthält alle bisherigen Änderungen.

## 1. Neue Druckvorlage „Mein Wochenplan“
Die Druckansicht wurde komplett neu aufgebaut und orientiert sich an der bestätigten Vorlage:

- DIN A4 Hochformat
- große handschriftlich wirkende Überschrift „Mein Wochenplan“
- Name bleibt als Schreiblinie frei
- Zeitraum wird automatisch aus dem Wochenplan übernommen
- Montag bis Freitag als klare Tageszeilen
- Aufgaben in einer ruhigen mittleren Spalte
- große Erledigt-Kreise rechts
- mindestens fünf Schreib-/Aufgabenzeilen pro Tag
- ⭐ Zusatzaufgaben werden dezent mit Stern markiert
- unten:
  - Daran denke ich
  - Mitteilung Lehrkraft
  - Mitteilung Eltern
- kein Tier und kein Vorname auf dem Ausdruck
- ein Wochenplan = eine A4-Seite, solange der Inhalt in den vorgesehenen Aufgabenraum passt

## 2. Druckdialog vereinfacht
Statt der technischen Varianten gibt es nur noch:

- „Ein Plan für die ganze Klasse“
- „Individuelle Pläne“
- Kinder auswählen
- ⭐ Zusatzaufgaben mitdrucken

Die Vorschau wird erst danach geöffnet.

## 3. Unauffällige Differenzierung
Unter **Klassenverwaltung → Namen zuordnen** erscheint zusätzlich ein Bereich **Wochenplan-Code**.

Beispiele:
- A
- E
- M
- A2

Der Code ist frei wählbar und hat keine fachliche Bedeutung.

Bei einem individuellen Ausdruck:
- wird der individuelle Wochenplan des Kindes verwendet
- erscheint nur der kleine Code oben rechts
- Tier und Vorname werden NICHT gedruckt
- das Kind schreibt seinen Namen selbst auf die Linie

Der Code kann im Druckdialog für einen einzelnen Ausdruck noch geändert werden.

## 4. Freie Aufgabe repariert
Fehler aus Paket 9e behoben:

Beim Klick auf **+ freie Aufgabe** wurde zwar intern eine leere Aufgabe erzeugt,
aber die leere Eingabezeile direkt wieder aus der Anzeige herausgefiltert.

Jetzt:
- Klick auf + freie Aufgabe
- sofort erscheint ein leeres Texteingabefeld
- nach dem Speichern werden wirklich leere Zeilen weiterhin nicht gespeichert
- freie Aufgaben können wie alle anderen Aufgaben ⭐ markiert werden

## 5. Rico Schnabel 2 – Rechtschreiben konkretisiert
Die Themen werden nach dem vorliegenden Inhaltsverzeichnis den Seitenbereichen zugeordnet.

Beispiele:
- S. 4–6: Das Alphabet: Wörter ordnen
- S. 7–8: Nomen sortieren: Singular
- S. 9–12: Nomen sortieren: Singular/Plural
- S. 48: Auslautverhärtung: d/t, g/k, b/p, verlängern
- S. 49: Auslautverhärtung: d/t, g/k, verlängern
- S. 50: Auslautverhärtung: d/t, verlängern
- S. 51: Auslautverhärtung: g/k, verlängern
- S. 78–97: Themenblock „Wörter mit Merkstellen/Wörter mit Besonderheiten“
- S. 98–105: Vorsilben
- S. 106–107: Satzzeichen
- S. 108–112: Unregelmäßige Verben

Im Wochenplan-Picker ist **Teil** bei Rico nun der konkrete Themenblock
(z. B. „Nomen“, „Umlaute I“, „Auslautverhärtung“, „Vorsilben“).
Die einzelne Seite zeigt zusätzlich das konkrete Seitenthema.

Bereits vorhandene Rico-Seiten werden automatisch aktualisiert.

## Deployment
Neu:
- weekly-plan-9f.js
- dist/weekly-plan-9f.js

Geändert:
- weekly-plan-9e.js
- dist/weekly-plan-9e.js
- index.html
- dist/index.html
- scripts/build.js
- service-worker.js
- dist/service-worker.js

Cache-Version: v107
