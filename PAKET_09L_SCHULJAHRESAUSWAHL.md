# Paket 9l – Schuljahresauswahl im Wochenkalender

## Neu
Oben in der Wochenübersicht gibt es jetzt eine Schuljahresauswahl:

←  Schuljahr 2026/27  →

- Dropdown zur direkten Auswahl
- Pfeil links = vorheriges Schuljahr
- Pfeil rechts = nächstes Schuljahr
- die Liste wird dynamisch erzeugt
- vorhandene Schuljahre mit Wochenplänen werden automatisch mit angeboten
- die zuletzt gewählte Schuljahresansicht wird gespeichert

Damit muss für kommende Schuljahre kein neuer Kalender programmiert werden.

## Kalenderlogik
Der Kalender wird für jedes gewählte Schuljahr neu berechnet.

Zeitraum:
- August des Startjahres
- bis Juli des Folgejahres

Kalenderwochen:
- echte ISO-Kalenderwochen
- Montag bis Freitag
- korrekte KW am Jahreswechsel
- auch Jahre mit 53 ISO-Wochen werden korrekt verarbeitet
- Wochen am Übergang Juli/August werden eindeutig genau einem Schuljahr zugeordnet:
  maßgeblich ist der Donnerstag der ISO-Woche.
  Dadurch gibt es keine doppelte oder fehlende KW zwischen zwei Schuljahren.

## Getestet
Automatischer Kalendertest für die Schuljahre 2024/25 bis 2031/32:
- jeder Wochenbeginn ist Montag
- jedes Wochenende der Anzeige ist Freitag
- Wochen liegen lückenlos im 7-Tage-Abstand
- ISO-KW und ISO-Jahr stimmen
- 52- und 53-Wochen-Jahre funktionieren

Beispiele:
- Schuljahr 2026/27 beginnt im Kalender mit KW 32, Montag 03.08.2026
- Schuljahr 2026/27 endet mit KW 30, Montag 26.07.2027
- Schuljahr 2030/31 enthält 53 angezeigte ISO-Wochen

Cache-Version: v113
