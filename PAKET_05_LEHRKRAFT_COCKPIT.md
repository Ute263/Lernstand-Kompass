# Paket 5 – Lehrkraft-Cockpit

Die vorhandene Lehrkraft-Startseite erhält oberhalb der Bereichskacheln ein
Tages-Cockpit.

Auf einen Blick:
- neue Meldungen im Posteingang
- offene „brauche Hilfe“-Meldungen
- offene „bitte kontrollieren“-Meldungen
- wie viele aktive Tiere heute bereits eine App-Aktivität haben
- „Jetzt wichtig“-Liste
- offene fachliche Bestätigungen
- Nomen-Proben heute: gestartet, gerade aktiv, beendet, abgebrochen
- bearbeitete Wörter bei laufenden/abgebrochenen Nomen-Proben
- Tiere mit App-Aktivität heute
- Tiere heute noch ohne App-Aktivität
- letzter Kinder-Sync-Abruf

Direktaktionen:
- Posteingang
- Hilfe & Kontrolle
- Heute
- Wochenplan
- Lernspiele

Hinweis:
„Heute ohne App-Aktivität“ bedeutet nur, dass der Lernstand-Kompass für dieses
Tier heute noch keinen Eintrag empfangen hat. Es ist keine Aussage darüber, ob das
Kind allgemein gearbeitet hat.

Die bisherigen Startseiten-Kacheln bleiben darunter erhalten und heißen nun
„Alle Bereiche“.

Cloudflare:
- `teacher-cockpit.js` liegt im Hauptordner und in `dist`
- `index.html` und `service-worker.js` liegen ebenfalls in beiden Ebenen
- Cache-Version v94
