# Lernstand-Kompass – Original-App, Schritt 2 (lokale Entwicklungsfassung)

## Was geändert wurde
- Die **vollständige Original-App** bleibt Grundlage; Wochenplan, Druck, Kinderansicht, Speicherung und Synchronisierungslogik wurden nicht neu geschrieben.
- `models.js`: 241 zusätzliche, geprüfte MiniMax-Katalogabschnitte für 11 reguläre Hefte aus den bereits bereitgestellten Inhaltsverzeichnissen (Klasse 1, 3 und 4). Jede Seite innerhalb eines Abschnitts ist durch die **bereits vorhandene** App-Funktion zur Einzelseitenauswahl erreichbar. Aufgabennummern bleiben wie in der Original-App eintragbar.
- Neue Seiten haben feste `catalogKey`-Kennungen. Bei vorhandenen Klassen ergänzt die bestehende Normalisierung nur bislang fehlende Standardkatalog-Einträge; individuelle Katalogeinträge bleiben bestehen.
- `service-worker.js`: Cache-Version angehoben, damit die lokale Version aktualisiert wird.
- `scripts/check-minimax-extension.js`: neue Prüfung von Seitenabdeckung, eindeutigen Schlüsseln, bestehendem MiniMax 2 und wiederholter Datenzusammenführung.
- `package.json`: zusätzliche Prüfung in `npm run verify`.
- Start- und Projekthinweise aktualisiert.

## Bewusst noch nicht verändert
- Bisherige Druckansichten, Wochenplan-/Klassenverwaltung, Kinder-Icons, bestehende ABC-/Förderheftcover und Speicherformate.
- Die Materialauswahl-Oberfläche ist noch die Originalansicht, noch **nicht** die geplante vereinfachte Auswahl nach Heft → Thema → Seite.
- Neue abstrakte MiniMax-3/4-Cover sind hier noch nicht eingebunden.
- Für *MiniMax 3 – Größen und Sachrechnen* lag im Arbeitsordner kein verlässlicher strukturierter Quelldatensatz vor. Dieser Bereich wurde **nicht geschätzt oder frei ergänzt**.
- „Teste dich“ Klasse 1/3/4 wurde **nicht** in die separate vorhandene Testverwaltung übertragen; vorhandene Testfunktionen bleiben unverändert.
- An bestehendem MiniMax 2 wurden keine Katalogeinträge ersetzt.

## Start auf dem Mac
1. Falls die vorherige lokale App läuft: Terminal in den Vordergrund holen, **Control + C** drücken und schließen.
2. Dieses ZIP außerhalb des GitHub-Ordners entpacken.
3. Im entpackten Projektordner **`start-local.command`** doppelklicken (bei macOS-Blockade: Rechtsklick → Öffnen).
4. Terminalfenster offen lassen. Im Terminal muss `Serving HTTP on 127.0.0.1 port 8770` erscheinen.
5. Chrome öffnen und **http://localhost:8770** in die Adresszeile eingeben.
6. Falls die alte Ansicht im Cache liegt: **Command + Shift + R** drücken. Die Erweiterung ist unter Mathematik in den Arbeitsheftkatalogen zu kontrollieren.
7. Zum Beenden wieder im Terminal **Control + C** drücken.

**Wichtig:** Diese lokale Originalbasis nutzt denselben `localhost:8770`-Ursprung wie die vorherige Originalbasis. Zuvor bitte unter *Daten & Backup* eine Sicherung der Testdaten exportieren. Eine neue App-Version kann den gespeicherten Datenbestand normalisieren bzw. ergänzen. Keine produktiven Schülerdaten in dieser Testumgebung benutzen. Keinesfalls Safari-/Chrome-Website-Daten löschen.

## Prüfung
`npm run verify` erfolgreich (Syntax, Wochenplan, Backup, Kinder-Sync, OneDrive, Druck, Build, Runtime, Struktur, neue MiniMax-Erweiterungsprüfung). Noch kein vollständiger Test auf deinem Mac oder einem Schul-iPad.

## Korrektur 2a – fehlendes Arbeitsheft

MiniMax 3 – Größen und Sachrechnen wurde anhand des bereits hochgeladenen Inhaltsverzeichnisses ergänzt: Seiten 2–56, inklusive Basis, Training und Extra. Die Testnummern 17–20 sind thematische Verweise; die bestehende Testverwaltung bleibt in diesem Schritt unverändert. Andere Heftgruppen und gespeicherte Aufgaben wurden nicht geändert.
