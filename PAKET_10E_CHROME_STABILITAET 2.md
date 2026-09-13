# Paket 10e – Chrome-Stabilität / Kinder-Sync entlastet

Auslöser für die Prüfung:
- Chrome-Absturz kurz nach dem Aufwachen des Macs.
- Im Crashbericht: „Time Since Wake: 49 seconds“.

Behobene App-Probleme:
1. Der automatische Kinder-Sync schrieb bisher auch dann alle 30 Sekunden den
   vollständigen App-Zustand in IndexedDB, wenn sich gar nichts geändert hatte.
   Diese unnötige Vollspeicherung entfällt.
2. Nach dem Aufwachen konnten Sichtbarkeits-Event und laufender 30-Sekunden-Timer
   gleichzeitig einen Kinder-Abruf starten. Jetzt ist maximal ein Abruf gleichzeitig erlaubt.
3. Im Hintergrund wird kein großer Lehrkraft-Abruf mehr ausgeführt.
4. Nach Rückkehr aus Ruhezustand / Tab-Hintergrund wartet der Sync 5 Sekunden,
   bevor er geordnet neu startet.
5. Nach Wiederherstellung der Internetverbindung startet der Abruf ebenfalls
   verzögert statt parallel zu anderen Aufgaben.

Die Datenübertragung selbst bleibt unverändert; neue Kindmeldungen werden weiterhin
automatisch übernommen.

Baut auf Paket 10d auf.
Cache-Version: v132
