# Paket 7 – Sicherheit & Aufräumen

## Neu: Systemprüfung
Im Bereich **Backup / Wiederherstellung** erscheint oben ein kompakter Systemcheck.

Geprüft bzw. angezeigt werden:
- lokale Speicherung (IndexedDB / localStorage)
- Lesen/Schreiben im Browser
- JSON-Backup-Struktur / Roundtrip
- Größe des aktuellen Datenstands
- OneDrive-Verbindung und letzter Abgleich
- Kinder-Sync und Erreichbarkeit des `/health`-Endpunkts
- QR-Zugänge der aktiven Tiere
- Lernspiel-Freigaben
- vorhandener Löschschutz

## Neu: sichere Aktivitätsdatenpflege
Automatisch höchstens einmal täglich sowie zusätzlich manuell per Button.

Regeln:
- **Fachliche Lernspiel-Ergebnisse werden niemals automatisch gelöscht.**
- Nur technische Aktivitätsmeldungen werden gepflegt.
- `in_progress` älter als 12 Stunden → als automatisch abgebrochen markiert.
- reine Aktivitätsmeldungen älter als 60 Tage → entfernt.
- pro Tier und Lernspiel maximal 40 technische Aktivitätsmeldungen.
- abgeschlossene Nomen-/Verb-/Adjektiv-/Wortarten-/Einmaleins-/Kopfrechen-Ergebnisse bleiben erhalten.

## Backup
Der vorhandene Button **Gesamtbackup speichern** wird direkt im Systemcheck angeboten.
Der Backup-Test selbst arbeitet nicht destruktiv:
- aktuellen Zustand serialisieren
- wieder einlesen
- normalisieren
- zentrale Anzahlen vergleichen
- gespeicherten Zustand aus AppStorage erneut laden

## Gerätewechsel
Der Systemcheck prüft:
- Kinder-Sync vollständig eingerichtet?
- aktive Tiere mit gültigem QR-Token?
Wenn beides stimmt, wird der Gerätewechsel als bereit angezeigt.

## Löschschutz
Der bereits vorhandene Werkseinstellungs-Schutz bleibt unverändert:
- Backup-Bestätigung
- Lehrkraft-PIN
- Bestätigungswort `ZURÜCKSETZEN`
- zwei zusätzliche Warnabfragen

## Deployment
Neu:
- `safety-tools.js`
- `dist/safety-tools.js`

Geändert:
- `index.html`
- `dist/index.html`
- `scripts/build.js`
- `service-worker.js`
- `dist/service-worker.js`

Cache-Version: `v100`

## Hinweis Cloudflare
Der derzeitige Sync-Worker stellt keine Lösch-API für einzelne alte Cloud-Datensätze bereit.
Paket 7 räumt deshalb sicher die lokalen/übertragenen Aktivitätsdaten auf, verändert
aber die bestehende Cloudflare-Datenbank nicht direkt.
