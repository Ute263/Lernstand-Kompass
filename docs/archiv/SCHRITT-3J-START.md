# Version 3j – lokale Prüfung auf Schul-iPads

- Bestehende Speicherformate, Datenbankname und Schlüssel bleiben unverändert.
- Die Daten werden bevorzugt in IndexedDB gespeichert; schlägt das Speichern fehl und ist auch localStorage voll, wird ein Fehler angezeigt statt Erfolg gemeldet.
- Rücksetzen einer ausschließlich durch Wochenplan erzeugten Erledigung entfernt den zugehörigen Fortschrittseintrag. Unabhängige Einträge bleiben erhalten.
- Wochenplan-Seitenstatus überschreibt beim Rücksetzen seine alte erledigte Seitenliste, statt sie einfach zu vereinigen.
- Wochenplan- und Verlaufsbereich verwenden die gleiche Heftbezeichnung.

## Start
1. Alten lokalen Server im Terminal mit Control+C stoppen.
2. ZIP entpacken und start-local.command öffnen.
3. Browser: http://localhost:8770
4. Bei alter Ansicht Command+Shift+R; keine Website-Daten löschen.
5. Zum Beenden Control+C.

**Kein iPadOS-Update und kein Zurücksetzen erforderlich.** Noch keine echte iPadOS-17-/18-Browserprüfung; vor produktivem Einsatz Export-Backup anfertigen und mit einem Testdatensatz prüfen.
