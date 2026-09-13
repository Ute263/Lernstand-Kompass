# Paket 9q – Kinder-Sync zuverlässig

Behoben werden zwei zusammenhängende Probleme:

1. Der sichtbare Button „Kinder-Ergebnisse abrufen“ verwendete noch den alten
   Klassen-Sync-Kanal. QR-Kindergeräte senden inzwischen über den neuen
   verschlüsselten Kinderkanal. Der Button ruft nun genau diesen Kanal ab.

2. Wurde der Kinder-Sync erst nach dem Öffnen der App eingerichtet, startete
   der automatische 30-Sekunden-Abruf nicht zuverlässig. Er wird nun nach der
   Einrichtung automatisch gestartet.

Unverändert:
- QR-Tokens und bestehende QR-Karten
- Lernspiel-Ergebnisse
- Wochenpläne
- OneDrive
- models.js
- Lernübersicht

Cache-Version: v118
