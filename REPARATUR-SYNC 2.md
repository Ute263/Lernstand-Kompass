# Reparatur der Lehrkraft-Synchronisation

Diese Version führt keine automatische OneDrive-Synchronisation beim Start oder nach lokalen Änderungen mehr aus.

## Einmalige Wiederherstellung

1. Neue App-Version deployen und auf iPad und Mac vollständig neu laden.
2. Auf dem iPad unter Backup / Wiederherstellung das Gesamtbackup `lernstand-kompass-gesamtbackup-2026-09-19.json` mit **Backup wiederherstellen** einspielen.
3. Auf dem iPad unter Microsoft & Synchronisierung **Cloud mit diesem Gerät ersetzen** wählen. Vor dem Ersetzen wird der bisherige Cloud-Stand als separate Sicherheitskopie in OneDrive/Lernstand-Kompass gespeichert.
4. Auf dem Mac unter Microsoft & Synchronisierung **Cloud vollständig auf dieses Gerät übernehmen** wählen.
5. Danach iPad und Mac vergleichen. Beide müssen denselben Stand zeigen.

## Danach

- OneDrive-Lehrkraftdaten werden nur noch manuell über **Sicher abgleichen** synchronisiert.
- Wochenplanstatus werden beim Merge über Klasse + Wochenplan + Kind + Tag + Aufgabe identifiziert. Unterschiedliche zufällige IDs erzeugen dadurch nicht mehr zwei konkurrierende Arbeitsstände.
- Neue Wochenplanstatus erhalten zusätzlich eine stabile, aus der Aufgabe abgeleitete ID.
- Kinder-Sync bleibt getrennt davon aktiv; die Abschaltung betrifft nur den automatischen OneDrive-Abgleich der Lehrkraftgeräte.
