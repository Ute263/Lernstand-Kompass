# Paket 10l – Lesebuch in Lesezeit sichtbar

Gefundener Fehler:
- Lesezeit und Lernwörter sind eigene Wochenplan-Bereiche.
- Der kompakte Material-Picker behandelte sie aber fälschlich wie eigene Fächer.
- Der Arbeitsmaterial-Katalog kennt nur Deutsch und Mathe.
- Deshalb wurden bei Lesezeit keine Deutsch-Materialien angezeigt.
- Beim Übernehmen hätte Lesezeit außerdem fälschlich in Mathe gespeichert werden können.

Behoben:
- Lesezeit verwendet den Deutsch-Arbeitsmaterial-Katalog.
- Lernwörter verwendet ebenfalls den Deutsch-Arbeitsmaterial-Katalog.
- Die ausgewählte Aufgabe bleibt trotzdem im richtigen Bereich:
  - Lesezeit → Lesezeit
  - Lernwörter → Lernwörter
  - Arbeitsaufträge → Deutsch
  - Mathe → Mathe
- In Lesezeit wird ein vorhandenes Lesebuch bevorzugt vorgeschlagen.
- ABC der Tiere 2 – Lesebuch aus Paket 10k ist damit direkt auswählbar und sichtbar.

Baut auf Paket 10k auf.
Cache-Version: v138
