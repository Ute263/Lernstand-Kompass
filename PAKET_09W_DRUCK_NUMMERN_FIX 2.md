# Paket 9w – Aufgabennummern im Wochenplan korrekt

Behoben:
- Mehrere Heftaufgaben auf einem Tag behalten jetzt jeweils ihre eigene Nummer.
- Beispiel:
  - Aufgabe 1 → Nr. 1
  - Aufgabe 2 → Nr. 2
  wird auch so in der Druckvorlage ausgegeben.
- Bisher wurde beim Erzeugen der Wochenplan-Aufgaben für alle Einträge versehentlich
  die alte erste Aufgabennummer verwendet.
- Die Korrektur gilt gleichzeitig für:
  - Druckvorlage
  - Kinderansicht
  - kompakte Wochenplan-Darstellung, soweit sie `taskNumber` nutzt.

Außerdem enthalten:
- 9u QR-Scanner-Fix
- 9v Druck übernimmt die beim Erstellen festgelegte Kinder-Zielgruppe
- 9t neue Deutsch-/Mathe-Icons und klarere Drucktrennung
- vorherige kumulative Änderungen

Cache-Version: v124
