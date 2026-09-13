# Paket 9c – Wochenplan: Zusatzaufgaben auf derselben Seite

Paket 9c enthält Paket 9b mit der sichtbaren OneDrive-Rückmeldung bereits mit.

## Neu im Wochenplan
Eine Katalogseite kann am selben Tag und im selben Fach mehrfach ausgewählt werden.

Beispiel:
- Seite 40 · Nr. 1
- ⭐ Zusatzaufgabe · Seite 40 · Nr. 3

## Verhalten
- erste Auswahl derselben Seite = normale Aufgabe
- zweite und weitere Auswahl = automatisch ⭐ Zusatzaufgabe
- jede Auswahl besitzt ein eigenes Feld **Nr.**
- jedes einzelne Vorkommen kann mit × entfernt werden
- „alle leeren“ entfernt weiterhin den ganzen Fachblock
- im Auswahlfenster steht ein Hinweis, dass eine erneute Auswahl zur Zusatzaufgabe wird

## Kinderansicht / Status
Duplikate erhalten einen eigenen Statusschlüssel.
Dadurch kann die normale Aufgabe unabhängig von der Zusatzaufgabe abgehakt werden.

## Druck
Die Zusatzaufgabe erscheint mit ⭐.
Wenn beim Drucken „mit Extra-Aufgabe“ ausgeschaltet wird, werden auch
die mit ⭐ gekennzeichneten Zusatzaufgaben ausgeblendet.

## Kompatibilität
Alte Wochenpläne mit nur einem gemeinsamen Nr.-Feld werden beim Laden
automatisch in das neue Format übernommen.

## Deployment
Neu:
- `weekly-extra-tasks.js`
- `dist/weekly-extra-tasks.js`

Geändert:
- `index.html`
- `dist/index.html`
- `scripts/build.js`
- `service-worker.js`
- `dist/service-worker.js`

Enthalten aus Paket 9b:
- `colleague-mode.js`
- `dist/colleague-mode.js`

Cache-Version: `v104`
