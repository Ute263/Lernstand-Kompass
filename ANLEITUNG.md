# Anleitung Lernstand-Kompass

Diese Anleitung beschreibt die Funktionen der App `Lernstand-Kompass` in der aktuellen Fassung. Die App ist als statische Web-App gedacht: Die Programmdateien liegen online oder lokal, die Lernstände selbst werden im Browser bzw. auf dem jeweiligen iPad gespeichert.

## 1. Grundidee der App

Der Lernstand-Kompass unterstützt eine Lehrkraft dabei, Lernstände, Wochenpläne, Trainingszeiten, Lernzielkontrollen und Druckmaterial für eine Klasse oder Lerngruppe zu verwalten.

Die App arbeitet mit Tier-Pseudonymen. Kinder sehen und verwenden in der Regel nur ihr Tier, zum Beispiel `Fuchs`, `Schildkröte` oder `Eule`. Vornamen können im geschützten Lehrerbereich optional zugeordnet werden, erscheinen aber nicht im Kinderbereich, nicht in QR-Codes und nicht in normalen Ausdrucken oder anonymisierten Exporten.

Wichtig:

- Die App speichert Lernstände lokal auf dem Gerät bzw. im Browser.
- Es gibt keine automatische Cloud-Synchronisation.
- GitHub, Cloudflare Pages oder Netlify speichern nur die App-Dateien, nicht die Lernstandsdaten.
- Bei mehreren iPads muss regelmäßig über Backup-Dateien zusammengeführt werden.
- Vor größeren Änderungen, Gerätewechseln oder Updates sollte ein Gesamtbackup erstellt werden.

## 2. Start und Bereiche

Beim Öffnen der App gibt es zwei Grundbereiche:

- `Meine Lernreise`: Kinderbereich.
- `Lernstand-Übersicht`: geschützter Lehrerbereich.

Der Lehrerbereich ist durch eine PIN geschützt. Bei der ersten Einrichtung wird eine PIN vergeben. Zusätzlich wird ein Wiederherstellungsschlüssel angezeigt. Dieser Schlüssel muss außerhalb der App sicher notiert werden, weil die App die PIN nicht im Klartext speichert.

## 3. Kinderbereich: Meine Lernreise

Der Kinderbereich ist bewusst einfach aufgebaut. Kinder wählen sich über ein Tier oder über einen QR-Code ein.

### 3.1 QR-Code scannen

Kinder können ihr Tier über `QR-Code scannen` öffnen. Der QR-Code enthält nur eine anonyme Tier-ID. Es werden keine Vornamen oder sonstigen persönlichen Daten im QR-Code gespeichert.

Falls das Scannen auf einem Gerät nicht funktioniert, kann das Kind sein Tier manuell auswählen.

### 3.2 Tier auswählen

Über `Tier auswählen` sieht das Kind die aktiven Tiere der aktuellen Klasse. Nach Auswahl des Tieres kommt es in seine persönliche Lernreise.

### 3.3 Meine Woche

Wenn die Funktion in den Einstellungen aktiviert ist, sehen Kinder die Kachel `Meine Woche`.

Dort werden alle freigegebenen Wochenpläne angezeigt. Der aktuelle Wochenplan steht oben und wird hervorgehoben.

Ein Wochenplan kann enthalten:

- Deutsch-Aufgaben aus dem Arbeitsheft oder Lehrwerk.
- Mathe-Aufgaben aus dem Arbeitsheft oder Lehrwerk.
- freie Zusatzaufgaben der Lehrkraft.

Entdeckeraufgaben erscheinen nicht im Wochenplan. Sie bleiben im eigenen Bereich `Trainingszeit`.

Kinder können Aufgaben im Wochenplan als `teilweise` oder `fertig` markieren. Diese Markierungen werden zunächst als Kindmeldung gespeichert. Im Lehrerbereich können sie geprüft und bestätigt werden. Erst nach Bestätigung werden sie verbindlich in den Fortschritt übernommen.

### 3.4 ABC der Tiere

Wenn die Funktion aktiv ist, kann ein Kind seine freigegebenen Deutsch-Aufgaben sehen. Angezeigt werden nur Aufgaben, die die Lehrkraft dem Kind oder der Klasse zugewiesen hat.

Die App zeigt dabei auch das passende Heft bzw. Lehrwerk an, sofern ein Cover hinterlegt ist.

Mögliche Status:

- `offen`
- `teilweise`
- `fertig`

### 3.5 MiniMax

Der Bereich `MiniMax` funktioniert entsprechend für Mathematik. Das Kind sieht nur die freigegebenen Aufgaben bzw. Seiten.

Auch hier können Aufgaben als `teilweise` oder `fertig` markiert werden.

### 3.6 Das habe ich geschafft

Wenn diese Funktion freigegeben ist, können Kinder selbst melden, welche Seite sie geschafft haben.

Das Kind wählt:

- Fach
- Material
- Seite oder Seitenbereich
- Status
- optional eine kurze Notiz

Diese Meldung wird nicht sofort als endgültiger Lernstand gezählt. Sie erscheint im Lehrerbereich unter `Von Kindern gemeldet` und muss dort bestätigt werden.

### 3.7 Trainingszeit

Die Trainingszeit besteht aus zwei Bereichen:

- `Schule`
- `OGS / Zuhause`

#### Trainingszeit Schule

Im Bereich Schule stehen feste Trainingsangebote zur Verfügung:

- Lernwörter
- Kopfrechnen
- AntonApp
- Schön-Schreib-Heft
- Mathe-Kartei
- Deutsch-Kartei

Die AntonApp ist begrenzt: Sie kann pro Kind nur einmal innerhalb von vier Wochen als Trainingsaufgabe ausgewählt werden. Die anderen Trainingsbereiche sind davon nicht betroffen.

#### OGS / Zuhause

Der Bereich `OGS / Zuhause` führt zu den Entdeckeraufgaben. Es gibt keine getrennten Kategorien mehr wie Deutsch-Entdecker, Mathe-Entdecker oder Forscher. Für Kinder gibt es nur noch `Entdeckeraufgaben`.

Die hinterlegte Aufgabenliste enthält 48 Entdeckeraufgaben von `E-01` bis `E-48`.

Eine Aufgabe wird erst gespeichert, wenn das Kind im Aufgabenfenster auf `Aufgabe starten` klickt. Danach wird sie als bearbeitet gespeichert, abgeschwächt dargestellt und nicht erneut auswählbar.

### 3.8 Lernpost

Im Kinderbereich gibt es die Funktion `Lernpost`. Damit kann eine kleine Datei erstellt werden, zum Beispiel für AirDrop oder `In Dateien sichern`.

Die Lernpost enthält nur kindgerechte Lernereignisse, zum Beispiel:

- bearbeitete Trainingsaufgaben
- gemeldete Arbeitsheftseiten
- einfache Statusinformationen

Nicht enthalten sind:

- Vornamen
- Noten
- Lernzielkontrollen
- interne Lehrkraftdaten

Die Lehrkraft kann Lernpost-Dateien im Lehrerbereich über `Lernpost zusammenführen` importieren.

## 4. Lehrerbereich: Navigation

Der Lehrerbereich heißt `Lernstand-Übersicht`. Links befindet sich das Menüband mit diesen Hauptbereichen:

1. Startseite
2. Wochenplan
3. Lernübersicht
4. Trainingszeit
5. Lernzielkontrolle
6. Klassenverwaltung
7. Druck und Material
8. Backup und Einstellungen

Auf der Startseite gibt es Kacheln in derselben Reihenfolge. Die Kacheln führen direkt in den jeweiligen Bereich.

## 5. Startseite

Die Startseite ist die zentrale Übersicht im Lehrerbereich.

Sie zeigt Kacheln für:

- Startseite
- Wochenplan
- Lernübersicht
- Trainingszeit
- Lernzielkontrolle
- Klassenverwaltung
- Druck und Material
- Backup und Einstellungen

Die Kacheln enthalten kurze Hinweise, zum Beispiel wie viele aktuelle Wochenpläne vorhanden sind oder wie viele Tiere aktiv sind.

## 6. Wochenplan

Der Wochenplan ist für Deutsch- und Mathe-Arbeitshefte bzw. Lehrwerke sowie freie Aufgaben gedacht. Entdeckeraufgaben bleiben im Bereich Trainingszeit.

### 6.1 Wochenplan-Bereich auswählen

Im Wochenplanbereich kann ausgewählt werden, ob am Klassenwochenplan oder an einem individuellen Plan für ein bestimmtes Tier gearbeitet wird.

Möglichkeiten:

- `Klassenwochenplan`: gilt für alle bzw. für die ausgewählte Gruppe.
- einzelnes Tier: individuelle Abweichungen für dieses Kind.

Individuelle Wochenpläne überschreiben nur die Felder, die tatsächlich ausgefüllt werden. Leere Felder übernehmen den Klassenwochenplan.

### 6.2 Wochenplan öffnen

Über `Wochenplan öffnen` kann ein bestehender Plan ausgewählt werden.

Ein Plan wird anhand von Titel, Zeitraum und Aktualität erkennbar. Aktuelle Pläne werden entsprechend gekennzeichnet.

### 6.3 Neuer Wochenplan

Mit `+ Neuer Wochenplan` wird ein neuer Wochenplan angelegt.

Erfasst werden können:

- Titel
- Kalenderwoche oder Zeitraum
- gültig von
- gültig bis
- Notiz
- Zuordnung zur Klasse, Gruppe oder einzelnen Tieren
- Fortschrittsmodus

### 6.4 Aufgaben eintragen

Für jeden Wochentag können Einträge für Deutsch, Mathe und Extra gepflegt werden.

Deutsch und Mathe können aus dem Arbeitsheft-Katalog ausgewählt werden. Dabei sind auch Aufgabennummern möglich, zum Beispiel:

- `S. 15 Nr. 1 + 3`
- `S. 27 Nr. 2`

Im Ausdruck wird die Darstellung kindgerecht aufgeteilt: Material und Thema stehen getrennt von Seite und Nummer, damit lange Einträge lesbarer bleiben.

### 6.5 Mehrere Seiten und Aufgaben

Deutsch und Mathe können mehrere Seiten bzw. Katalogeinträge pro Tag enthalten. Dadurch können zum Beispiel mehrere Seiten aus `ABC der Tiere 2 - Nomen` oder mehrere MiniMax-Seiten in einem Wochentag stehen.

### 6.6 Aktuelle Woche

Unter `Aktuelle Woche` sieht die Lehrkraft die aktiven Wochenpläne für den aktuellen Zeitraum.

Außerdem gibt es eine Statusübersicht:

- welches Tier welche Aufgabe offen hat
- welche Aufgabe teilweise bearbeitet ist
- welche Aufgabe fertig gemeldet wurde
- ob die Aufgabe bereits in den Fortschritt übernommen wurde

### 6.7 Vorlagen

Vorhandene Wochenpläne können als Vorlage genutzt und kopiert werden. Das ist sinnvoll, wenn sich eine Wochenstruktur wiederholt.

Beim Kopieren entsteht ein neuer Wochenplan, der anschließend angepasst werden kann.

### 6.8 Arbeitsheft-Katalog

Der Arbeitsheft-Katalog enthält die Grundlage für Deutsch- und Mathe-Aufgaben.

Für jeden Eintrag können gespeichert werden:

- Schuljahr / Klassenstufe
- Fach
- Lehrwerk / Arbeitsheft
- Teil
- Bereich / Thema
- Art
- Startseite
- Endseite
- Thema / kurzer Inhalt
- Kompetenz
- Bemerkung

Die App nutzt das Schuljahr der aktiven Klasse, damit passende Materialien automatisch bevorzugt angezeigt werden. Materialien aus anderen Schuljahren bleiben erreichbar, müssen aber bewusst ausgewählt werden.

Hinterlegte Cover werden im Wochenplan und in der Kinderansicht angezeigt.

### 6.9 Wochenplan drucken

Ein gespeicherter Wochenplan kann kindgerecht als A4-Ausdruck geöffnet werden.

Die Druckansicht enthält:

- Überschrift `Mein Wochenplan`
- Klasse und Zeitraum
- Namensfeld
- Tagesfelder Montag bis Freitag
- Infofeld
- Aufgaben mit Ankreuzkästchen
- kindgerechte Farben und größere Schrift

Beim Drucken können Varianten und Ziele ausgewählt werden:

- für alle gleich
- für ein einzelnes Tier
- für ausgewählte Tiere

Optional können Tage, Themen, Extra-Aufgaben, Ankreuzfelder und Vornamen gesteuert werden. Vornamen sind nur für interne Ausdrucke gedacht.

## 7. Lernübersicht

Die Lernübersicht bündelt den Lernstand der Klasse und einzelner Tiere.

### 7.1 Klassenübersicht

Die Klassenübersicht zeigt pro aktivem Tier:

- letzter Stand in Deutsch
- letzter Stand in Mathe
- letzter Eintrag
- offener Status

Damit ist schnell sichtbar, bei welchen Kindern noch etwas offen ist.

### 7.2 Fortschritt pro Tier

Hier wird zuerst eine Klasse und dann ein Tier ausgewählt.

Anschließend zeigt die App:

- Zusammenfassung des Lernstands
- letzter Stand Deutsch
- letzter Stand Mathe
- Fortschritt im Zeitraum
- letzte Aktivität
- offene Hilfe- oder Kontrollwünsche
- Vergleich zur Gruppe
- Abstand zu Soll-Seiten
- chronologische Einträge
- Wochenplan-Seiten des Kindes

### 7.3 Von Kindern gemeldet

Dieser Bereich zeigt Meldungen aus dem Kinderbereich, die noch geprüft werden müssen.

Dazu gehören:

- selbst gemeldete Seiten aus `Das habe ich geschafft`
- Markierungen aus Zuweisungen
- Markierungen aus dem Wochenplan

Die Lehrkraft kann diese Meldungen bestätigen, ändern oder ablehnen. Erst bestätigte Meldungen werden endgültig Teil des Fortschritts.

### 7.4 Aktives Arbeitsmaterial

Hier kann gesteuert werden, welche Arbeitsmaterialien aktuell relevant sind. Das hilft, die Kinderansicht und die Auswertungen übersichtlich zu halten.

### 7.5 Material zuweisen

Arbeitsheft- oder Lehrwerksseiten können gezielt Tieren, Gruppen oder der Klasse zugewiesen werden.

Die Kinder sehen dann im Kinderbereich nur die passenden freigegebenen Aufgaben.

### 7.6 Was ist bearbeitet?

Dieser Bereich ist eine Kontrollansicht über den zentralen Fortschritt.

Filtermöglichkeiten:

- Fach
- Status
- Quelle

Die Tabelle zeigt:

- Tier
- Fach
- Material
- Bereich
- Seite
- Thema
- Status
- Quelle
- letzte Änderung

Mögliche Quellen sind unter anderem:

- Wochenplan
- Zuweisung
- Kind gemeldet
- Direkteingabe
- Korrektur

### 7.7 Deutsch & Mathe

Dieser Unterbereich enthält den Arbeitsheft-Katalog und Soll-Seiten.

Hier werden Lehrwerke, Themen, Seitenbereiche und Zielstände gepflegt.

### 7.8 Heute

Die Tagesansicht zeigt Einträge des aktuellen Tages. Sie ist für den schnellen Überblick während oder nach dem Unterricht gedacht.

### 7.9 Hilfe/Kontrolle

Hier erscheinen offene Hilfe- oder Kontrollwünsche. Die Lehrkraft sieht, wo noch Rückmeldung, Kontrolle oder Unterstützung nötig ist.

### 7.10 Verlauf

Der Verlauf zeigt gespeicherte Einträge chronologisch. Er dient der Nachverfolgung, wenn später geprüft werden soll, wann etwas eingetragen oder verändert wurde.

## 8. Trainingszeit im Lehrerbereich

Der Lehrerbereich `Trainingszeit` zeigt eine Übersicht über Trainingsaufgaben und Entdeckeraufgaben.

Filtermöglichkeiten:

- Tier
- Fach
- Bereich
- Unterbereich
- Status
- Datum

Die Tabelle zeigt:

- Tier
- Bereich
- Unterbereich
- Aufgaben-Code
- Fach
- Aufgabentext
- Datum
- Uhrzeit
- Status
- Aktion

Bearbeitete Aufgaben können bei Bedarf zurückgesetzt werden, zum Beispiel wenn ein Kind versehentlich eine Aufgabe gestartet hat. Diese Änderung wird historisch gespeichert.

## 9. Lernzielkontrolle

Der Bereich `Lernzielkontrolle` dient zum Anlegen und Auswerten von Tests, Diagnosen, Beobachtungen und anderen Überprüfungen.

### 9.1 Neue Lernzielkontrolle anlegen

Erfasst werden können:

- Titel
- Fach
- Bereich
- Datum
- Typ
- Bewertungsart
- maximale Punktzahl
- kurze Inhaltsbeschreibung
- Aufgabenliste

Die Aufgabenliste kann zeilenweise eingegeben werden, zum Beispiel:

```text
Aufgabe 1; Zahlen ordnen; 4; Zahlverständnis
Aufgabe 2; Plusaufgaben; 6; Rechnen
Aufgabe 3; Sachaufgabe; 5; Modellieren
```

### 9.2 Ergebnisse eintragen

Für jedes aktive Tier können Ergebnisse eingetragen werden.

Je nach Bewertungsart sind möglich:

- Punkte pro Aufgabe
- Gesamtpunkte
- Prozentwert
- Bewertungsvorschlag
- endgültige Bewertung
- Note
- endgültige Note
- Symbol
- Status
- Bemerkung

Die App berechnet bei Punktebewertungen automatisch Gesamtpunkte, Prozentwert und Bewertungsvorschlag. Die endgültige Bewertung kann bewusst angepasst werden.

### 9.3 Druck

Eine Lernzielkontrolle kann als PDF- bzw. Druckansicht im Querformat geöffnet werden.

Zusätzlich gibt es eine Gesamtübersicht über Tests und Lernzielkontrollen.

## 10. Klassenverwaltung

Die Klassenverwaltung enthält alles, was die Struktur der Klasse betrifft.

### 10.1 Tiere verwalten

Hier können Tiere bearbeitet werden.

Möglich sind:

- Tier-Emoji ändern
- Tiername ändern
- interne Notiz ergänzen
- Tier aktiv oder inaktiv setzen
- Tier hinzufügen
- Tier löschen

Tier-IDs bleiben bei normalen Änderungen erhalten. Dadurch funktionieren bestehende QR-Codes weiter.

### 10.2 Klassen & Gruppen

Hier können Klassen bzw. Lerngruppen verwaltet werden.

Möglich sind:

- Klassenname ändern
- Beschreibung ändern
- aktive Klasse wechseln
- neue Klasse anlegen
- Lernstände einer Klasse löschen
- Klasse löschen

Außerdem können Tiergruppen angelegt werden, zum Beispiel für Leseteams oder Fördergruppen. Gruppen sind Auswahlhilfen für Wochenpläne und Zuweisungen.

### 10.3 Namen zuordnen

In diesem Bereich können Vornamen optional Tieren zugeordnet werden.

Diese Zuordnung bleibt im geschützten Lehrerbereich. Sie erscheint nicht:

- im Kinderbereich
- in QR-Codes
- in normalen Ausdrucken
- in anonymisierten Exporten

Interne Exporte mit Vornamen müssen bewusst ausgewählt werden.

### 10.4 QR-Zugänge

Hier können QR-Codes für Tiere angezeigt und als Druckbogen ausgegeben werden.

Die QR-Codes enthalten nur die anonyme Tier-ID. Die QR-Erzeugung läuft lokal in der App.

## 11. Druck und Material

Dieser Bereich bündelt Ausdrucke, Stickerbögen und Exporte.

### 11.1 Material drucken

Hier liegen die festen Stickerbögen für die Entdeckeraufgaben.

Aktuell hinterlegt:

- `Stickerbogen 1 – Entdeckeraufgaben 1–24`
- `Stickerbogen 2 – Entdeckeraufgaben 25–48`

Die Stickerbögen enthalten keine Vornamen, keine Tier-Zuordnung, keine Bewertungen und keine Punkte.

Druckhinweis:

- mit `100 %` bzw. `tatsächliche Größe` drucken
- nicht an die Seite anpassen

Zusätzlich gibt es:

- Aufgabenübersicht zum Drucken
- erweiterte dynamische Druckoptionen als Notlösung

Für Etiketten sollten die festen Stickerbögen verwendet werden, weil Browser-Ränder bei dynamischem Druck die Position verändern können.

### 11.2 PDF & Druck

Hier können gestaltete Druckansichten geöffnet werden.

Verfügbar sind:

- Tagesübersicht
- Wochenübersicht
- Hilfe & Kontrolle
- Fortschritt
- Trainingszeit
- Gesamtbericht

Die Druckansicht liest nur die lokal gespeicherten Daten und verändert keine Lernstände.

### 11.3 Excel-Export

Die App kann Excel-Dateien lokal im Browser erzeugen.

Verfügbare Exporte:

- schöne Excel-Datei aktive Klasse
- schöne Excel-Datei alle Klassen
- schöne Tagesliste
- schöne Hilfe-/Kontrollliste

Standardmäßig werden nur Tier-Pseudonyme exportiert.

Zusätzlich gibt es einen internen Export mit Vornamen. Dieser sollte nur bewusst genutzt und geschützt gespeichert werden.

Falls die Excel-Erzeugung auf einem Gerät nicht funktioniert, gibt es einfache CSV-Dateien als Fallback.

## 12. Backup und Einstellungen

Dieser Bereich ist besonders wichtig, weil die App lokal speichert.

### 12.1 Datensicherung

Die App zeigt an, wann zuletzt gespeichert wurde.

Möglichkeiten:

- `Daten speichern`: schreibt den aktuellen Stand lokal in den Browser.
- `Backup aktive Klasse speichern`: erstellt eine Sicherungsdatei nur für die aktive Klasse.
- `Gesamtbackup speichern`: erstellt eine Sicherungsdatei für alle Klassen und Daten.
- `CSV aktive Klasse speichern`: einfacher Tabellenexport als Zusatz.

Ein normales Speichern lädt keine Datei herunter. Eine Backup-Datei entsteht nur bewusst über die Backup-Funktionen.

### 12.2 Mehrere Geräte verwenden

Mehrere iPads synchronisieren sich nicht automatisch.

Der sichere Ablauf ist:

1. Auf den anderen Geräten Backup exportieren.
2. Auf dem Hauptgerät `Backup zusammenführen` verwenden.
3. Danach auf dem Hauptgerät ein neues Gesamtbackup erstellen.

Wichtig:

- `Backup zusammenführen` ergänzt neue Einträge und lässt vorhandene Daten bestehen.
- `Backup wiederherstellen` ersetzt die lokalen Daten durch die Backup-Datei.
- Für den normalen Mehrgerätebetrieb ist `Backup zusammenführen` die sicherere Funktion.

### 12.3 Lernpost zusammenführen

Lernpost-Dateien aus dem Kinderbereich können hier zusammengeführt werden.

Dabei werden nur neue Kindereingaben ergänzt. Vorhandene Daten bleiben erhalten.

### 12.4 Täglicher Mehrgeräte-Hinweis

Die App kann zu einer eingestellten Uhrzeit daran erinnern, den Mehrgeräte-Abgleich durchzuführen.

Diese Erinnerung holt keine Dateien automatisch ab. Sie erinnert nur daran, die Backup-Dateien bewusst zusammenzuführen.

### 12.5 App zurücksetzen

Die App kann auf Werkseinstellungen zurückgesetzt werden.

Vorher verlangt die App:

- Bestätigung, dass ein Backup erstellt wurde oder bewusst ohne Backup zurückgesetzt wird
- Lehrkraft-PIN
- Bestätigungswort `ZURÜCKSETZEN`
- zusätzliche Sicherheitsabfragen

Beim Zurücksetzen werden alle lokal gespeicherten Daten auf diesem Gerät gelöscht.

### 12.6 Kinderansicht

Hier wird gesteuert, was Kinder sehen dürfen.

Einstellungen:

- `Meine Woche` anzeigen
- `ABC der Tiere` anzeigen: immer, nur bei Zuweisung oder ausblenden
- `MiniMax` anzeigen: immer, nur bei Zuweisung oder ausblenden
- `Das habe ich geschafft` anzeigen
- Kinder dürfen selbst Seiten melden
- Trainingszeit anzeigen
- erlaubte Materialien für Kindmeldungen

### 12.7 PIN & Sicherheit

Hier werden PIN und Sicherheitsinformationen verwaltet.

Die App speichert keine Klartext-PIN, sondern nur eine Prüfsumme. Ohne PIN oder Wiederherstellungsschlüssel bleibt im Notfall nur das Zurücksetzen der App und das Einspielen eines Backups.

### 12.8 Speicherstatus

Der Speicherstatus zeigt, welche Daten lokal vorhanden sind, zum Beispiel:

- Anzahl Klassen
- Anzahl Tiere
- Anzahl Lernzielkontrollen
- Anzahl Trainingsaufgaben
- Anzahl bearbeiteter Trainingsaufgaben
- Anzahl Wochenpläne
- Anzahl Wochenplan-Status
- letzte Änderungen

Dieser Bereich hilft bei der Kontrolle, ob Daten auf dem Gerät vorhanden sind.

### 12.9 Datenschutz & Zweck

Dieser Bereich beschreibt, welche Daten die App speichert und wofür sie gedacht ist.

Grundsatz:

- Daten bleiben lokal im Browser.
- Normale Ausgaben arbeiten mit Tier-Pseudonymen.
- Vornamen sind optional und nur im geschützten Lehrerbereich vorgesehen.
- Backups müssen geschützt gespeichert werden.

## 13. Typische Arbeitsabläufe

### 13.1 Neue Klasse anlegen

1. In den Lehrerbereich gehen.
2. `Klassenverwaltung` öffnen.
3. `Klassen & Gruppen` wählen.
4. Neue Klasse mit Name und optionaler Beschreibung anlegen.
5. Die App legt Standardtiere und Standardmaterialien an.
6. Bei Bedarf Tiere bearbeiten oder inaktiv setzen.

### 13.2 Kinder vorbereiten

1. `Klassenverwaltung` öffnen.
2. `Tiere verwalten` prüfen.
3. Tiere aktivieren oder deaktivieren.
4. Optional unter `Namen zuordnen` Vornamen intern hinterlegen.
5. Unter `QR-Zugänge` QR-Codes drucken.

### 13.3 Wochenplan erstellen

1. `Wochenplan` öffnen.
2. `+ Neuer Wochenplan` wählen.
3. Titel und Zeitraum eintragen.
4. Klassenwochenplan oder Tierbereich auswählen.
5. Für Montag bis Freitag Deutsch, Mathe und Extra eintragen.
6. Seiten aus dem Arbeitsheft-Katalog auswählen.
7. Optional Aufgabennummern ergänzen.
8. Plan speichern.
9. Prüfen, ob der Plan in der Kinderansicht sichtbar ist.
10. Bei Bedarf `Wochenplan drucken` öffnen.

### 13.4 Individuelle Abweichung eintragen

1. `Wochenplan` öffnen.
2. Wochenplan auswählen.
3. Im Wochenplan-Bereich ein einzelnes Tier auswählen.
4. Nur die Felder ausfüllen, die vom Klassenwochenplan abweichen.
5. Speichern.

### 13.5 Wochenplan-Markierungen prüfen

1. `Lernübersicht` öffnen.
2. `Von Kindern gemeldet` wählen.
3. Markierungen aus dem Wochenplan prüfen.
4. Bestätigen oder ablehnen.
5. Bestätigte Einträge erscheinen im Fortschritt.

### 13.6 Entdeckeraufgaben auswerten

1. `Trainingszeit` öffnen.
2. Bei Bedarf nach Tier, Bereich, Status oder Datum filtern.
3. Bearbeitete und offene Aufgaben prüfen.
4. Versehendlich gestartete Aufgaben bei Bedarf zurücksetzen.

### 13.7 Lernzielkontrolle anlegen und auswerten

1. `Lernzielkontrolle` öffnen.
2. Neue Lernzielkontrolle anlegen.
3. Aufgaben und Maximalpunkte erfassen.
4. Ergebnisse je Tier eintragen.
5. Bewertungsvorschläge prüfen.
6. Endgültige Bewertung bzw. Note festlegen.
7. Bei Bedarf Druckansicht öffnen.

### 13.8 Backup bei einem Gerät

1. `Backup und Einstellungen` öffnen.
2. `Gesamtbackup speichern` wählen.
3. Datei an einem geschützten Ort speichern.
4. Backup regelmäßig wiederholen.

### 13.9 Mehrere iPads zusammenführen

1. Auf jedem Neben-iPad ein Gesamtbackup exportieren.
2. Auf dem Haupt-iPad `Backup zusammenführen` wählen.
3. Jede Datei einzeln importieren.
4. Nach dem Zusammenführen ein neues Gesamtbackup vom Haupt-iPad speichern.

## 14. Wichtige Hinweise

### 14.1 Veröffentlichung der App

Wenn die App über GitHub Pages oder einen anderen statischen Anbieter veröffentlicht wird, werden nur die App-Dateien veröffentlicht.

Nicht veröffentlicht werden:

- lokale Lernstände
- Backups
- Vornamen
- Notizen
- Ergebnisse
- Wochenplan-Status

Diese Daten liegen lokal im Browser des jeweiligen Geräts.

### 14.2 App-Update

Bei einem Update der App-Dateien bleiben lokale Browserdaten grundsätzlich erhalten. Trotzdem sollte vorher ein Gesamtbackup erstellt werden.

Nach dem Hochladen neuer App-Dateien kann es nötig sein, die Seite neu zu laden oder den Browsercache zu aktualisieren, damit die neue Version sichtbar wird.

### 14.3 Unterschied zwischen Speichern und Backup

`Daten speichern` speichert lokal im Browser.

Ein Backup erstellt eine Datei, die außerhalb des Browsers gesichert und später wieder eingelesen werden kann.

Für echte Datensicherheit ist ein regelmäßiges Backup notwendig.

### 14.4 Datenschutz

Die App ist so aufgebaut, dass Kinder primär mit anonymen Tier-Pseudonymen arbeiten.

Trotzdem können im Lehrerbereich sensible Daten entstehen, zum Beispiel:

- Vornamen
- interne Notizen
- Lernstände
- Testergebnisse
- Backup-Dateien

Diese Daten sollten nur auf geschützten Geräten und in geschützten Speicherorten verwendet werden.

## 15. Kurzübersicht der Hauptfunktionen

| Bereich | Zweck |
| --- | --- |
| Meine Lernreise | Kinderbereich mit Tierauswahl, Wochenplan, Trainingszeit und Kindmeldungen |
| Startseite | Kachelübersicht im Lehrerbereich |
| Wochenplan | Klassenwochenpläne und individuelle Wochenpläne erstellen, drucken und verfolgen |
| Lernübersicht | Lernstände, Kindmeldungen, Fortschritt und Verlauf kontrollieren |
| Trainingszeit | Schultraining und Entdeckeraufgaben auswerten |
| Lernzielkontrolle | Tests und Diagnosen anlegen, Ergebnisse erfassen und ausdrucken |
| Klassenverwaltung | Klassen, Tiere, Gruppen, Namen und QR-Zugänge verwalten |
| Druck und Material | Stickerbögen, Druckansichten, PDFs und Excel-Exporte |
| Backup und Einstellungen | Sicherung, Mehrgeräte-Abgleich, Kinderansicht, PIN, Speicherstatus und Datenschutz |

