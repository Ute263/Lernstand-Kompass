# Paket 10m – Lesezeit-Fix nach MiniMax-Override

Gefundene eigentliche Ursache:
- Paket 10l hatte die kompakte Wochenplan-Auswahl bereits korrekt auf den Deutsch-Katalog umgestellt.
- Danach wird jedoch `weekly-minimax-pages.js` geladen.
- Dieses Skript überschreibt `renderWeeklyCatalogPicker` erneut und filterte noch direkt nach `subject === "Lesezeit"`.
- Da der Arbeitsmaterial-Katalog nur Deutsch und Mathe kennt, erschien deshalb trotz vorhandenem Lesebuch: „Für Lesezeit ist noch kein Heft angelegt.“

Behoben:
- `weekly-minimax-pages.js` verwendet für Lesezeit und Lernwörter ebenfalls den Deutsch-Katalog.
- Bereits gewählte Seiten werden aus dem tatsächlichen Wochenplan-Bereich gelesen (Deutsch, Lesezeit, Lernwörter oder Mathe).
- Das vorhandene Lesebuch wird dadurch in Lesezeit sichtbar.
- Auswahl bleibt weiterhin unter Lesezeit gespeichert.

Cache-Version: v139
