# Paket 8 – Schuljahreswechsel & Archiv

## Neuer Menüpunkt
Unter **Klassenverwaltung** erscheint direkt nach „Klassen & Gruppen“:
**Schuljahreswechsel & Archiv**

## Schuljahreswechsel
Der Ablauf ist bewusst datensicher:

1. Gesamtbackup erstellen.
2. Bisheriges und neues Schuljahr prüfen.
3. Namen/Jahrgang der neuen Klasse festlegen.
4. Entscheiden, ob Tiere/Namenszuordnungen und Gruppen übernommen werden.
5. Wechsel bestätigen.

## Was passiert technisch?
Die alte Klasse wird NICHT umbenannt und NICHT gelöscht.

Stattdessen:
- alte Klasse erhält `archived: true`
- Archivdatum und Schuljahresbezeichnung werden gespeichert
- neue Klasse erhält eine neue Klassen-ID
- übernommene Kinder/Tiere erhalten neue Tier-IDs
- übernommene Tiere erhalten neue QR-Tokens
- optional werden Gruppen mit den neuen Tier-IDs neu angelegt
- neue Standardmaterialien und der Arbeitsheftkatalog werden angelegt

## Das neue Schuljahr startet leer bei
- Lernständen
- Wochenplänen
- Lernzielkontrollen
- Trainingsverlauf
- Lernspiel-Ergebnissen
- Kindmeldungen

Alte Datensätze bleiben an der alten Klassen-ID erhalten.

## Archiv
Archivierte Klassen zeigen eine kompakte Zusammenfassung:
- Tiere
- Lernstände
- Wochenpläne
- Lernspiel-Runden
- Lernzielkontrollen

Archivierte Klassen können **wiederhergestellt** werden.
Dann wird die alte Klasse wieder normale aktive Klasse und die Detailansichten sind wieder zugänglich.

## Schutz
Archivierte Klassen sind in der bisherigen Klassenverwaltung geschützt:
- nicht versehentlich aktivierbar
- Lernstände nicht über den alten Löschknopf löschbar
- Klasse nicht über den alten Löschknopf löschbar

Zum Bearbeiten oder Löschen muss die Klasse erst bewusst aus dem Archiv wiederhergestellt werden.

## Nach dem Wechsel
Die App erinnert an:
- neue QR-Karten
- Lernspiel-Freigaben prüfen
- ersten Wochenplan anlegen

## Deployment
Neu:
- `school-year-archive.js`
- `dist/school-year-archive.js`

Geändert:
- `index.html`
- `dist/index.html`
- `scripts/build.js`
- `service-worker.js`
- `dist/service-worker.js`

Cache-Version: `v101`
