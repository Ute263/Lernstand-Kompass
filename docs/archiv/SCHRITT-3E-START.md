# Schritt 3e – Wochenplan und Heftauswahl

Diese Fassung basiert auf der vollständigen Original-App. Drucklayouts, Datenformate, Kinderansicht und Synchronisierung wurden nicht absichtlich geändert.

## Was ist anders?

- Die Wochen-/Tagesplanung zeigt Deutsch und Mathe auf breiten Bildschirmen nebeneinander.
- Die Heftauswahl bleibt ein überlagertes Fenster, ist aber kompakt: Jahrgang, Materialart, Heft, Heftteil und gegebenenfalls Thema/Seitenbereich sind Dropdowns.
- Jedes Seitenfeld kann weiterhin einzeln angeklickt werden; die Aufgabennummer wird wie bisher nach der Auswahl im Wochenplan eingetragen.
- Förderhefte sind jahrgangsübergreifend. Reguläre Arbeitshefte aus Klasse 1 oder 2 erscheinen nicht mehr fälschlich bei Klasse 3/4.
- Bei nicht vorhandenen Deutschheften für Klasse 3/4 wird die Auswahl leer angezeigt; es wird nichts erfunden.

## Auf dem Mac starten

1. Laufenden alten lokalen Server im Terminal mit **Control + C** stoppen und das alte Terminalfenster schließen.
2. ZIP herunterladen und in einen eigenen Ordner außerhalb des GitHub-Projekts entpacken.
3. Im Ordner `Lernstand-Kompass-Original-Schritt3e` die Datei `start-local.command` doppelklicken (gegebenenfalls Rechtsklick > Öffnen).
4. Terminalfenster geöffnet lassen.
5. In Chrome `http://localhost:8770` eingeben. Bei alter Anzeige **Command + Shift + R** drücken, aber Browser-Website-Daten nicht löschen.
6. Zum Beenden ins Terminal wechseln und **Control + C** drücken.

Vor dem Wechsel eine Sicherung der lokalen Testdaten anlegen. Es wurden keine Änderungen an GitHub oder Cloudflare vorgenommen.

## Technische Prüfung

`npm run verify` erfolgreich einschließlich Material-, Speicher-, Wochenplan-, Synchronisierungs-, Build- und Druckprüfungen. Der Browsertest unter localhost war in der Ausführungsumgebung durch eine Administrator-Sperre blockiert. Die Darstellung muss deshalb auf dem Mac überprüft werden.
