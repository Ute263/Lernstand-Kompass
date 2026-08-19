# Paket 3h – Aktivitätsanzeige Nomen-Probe

Neu in der Lehrkraftansicht „Lernspiele & Tests“:
- wann ein Kind die Nomen-Probe gestartet hat
- Üben oder Test
- wie viele Wörter von 10 bearbeitet wurden
- Status: gestartet/läuft, abgebrochen oder beendet
- Zeitpunkt der letzten Aktivität
- bei ausdrücklichem Abbruch: genauer Abbruchzeitpunkt

Technik:
- Aktivitätsmeldungen verwenden `gameId: nomen-probe-activity`.
- Dadurch laufen sie über den bereits vorhandenen Kinder-Sync mit,
  tauchen aber NICHT als normale Test-Ergebnisse in der Auswertung auf.
- Die Meldung „gestartet“ wird direkt beim Beginn gespeichert.
- Nach jedem vollständig bearbeiteten Wort wird der Fortschritt aktualisiert.
- Klickt das Kind auf „Beenden“, wird die Runde als abgebrochen gespeichert.
- Nach regulärem Abschluss wird sie als beendet markiert.
- Maximal 40 Aktivitätsmeldungen pro Tier werden behalten.

Außerdem enthalten:
- Paket 3g: Mehrzahl mit oder ohne Artikel wird als richtig akzeptiert.

Cache-Version: v91

Dateien:
- nomen-plural-flex.js
- nomen-activity.js
- index.html
- scripts/build.js
- service-worker.js
