# Paket 01 – Nomen-Probe im Lernstand-Kompass

## Enthalten

- Neuer Kinderbereich `Lernspiele`
- Lernspiel `Nomen-Probe` mit `Üben` und `Test`
- 50 Wörter: 35 Nomen, 15 Nicht-Nomen
- 10 Wörter pro Runde: 7 Nomen, 3 Nicht-Nomen
- Vier erfasste Prüfschritte je Wort: Namensprobe, Artikelprobe, Mehrzahlprobe, Nomen-Entscheidung
- Mehrzahl wird mit bestimmtem Artikel eingegeben, z. B. `die Kinder`
- Üben: Rückmeldung, Wiederholungsversuche und Anzeige der korrekten Schreibweise
- Test: genau eine Antwort pro Prüfschritt, keine Lösung während des Tests
- Lokale Speicherung pro Tier-ID mit erstem Versuch, Versuchsanzahl, richtig/falsch und Bearbeitungszeit
- Neuer Lehrkraftbereich `Lernspiele` mit Klassenübersicht, Detailauswertung und Verlauf
- Kinderansicht: Lernspiele können in den Einstellungen ein-/ausgeblendet werden
- Offline/PWA-Cache auf Version 81 aktualisiert

## Datenhaltung

Die neuen Ergebnisse liegen in `state.learningGameSessions`. Es wird keine Cloud-Verbindung hergestellt. Die bestehende lokale Speicherung über IndexedDB/localStorage bleibt erhalten.

## Prüfung

- Syntaxcheck: `app.js`, `models.js`, `nomen-probe.js`, `service-worker.js` bestanden
- `npm run build`: bestanden
- Interaktionstest in Chromium-Testharness: vollständiger 10-Wörter-Test, 40 Prüfschritte, Speicherung und Lehrkraft-Detailauswertung bestanden
- Übungsmodus: falscher erster Versuch + korrekter zweiter Versuch wird als 2 Versuche / nicht sofort richtig gespeichert
- Browserkonsole im Test: keine Fehler oder Warnungen
