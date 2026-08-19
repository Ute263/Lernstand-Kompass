# Paket 3e – QR-Codes für alle Tiere

Fehlerbild:
- einzelne QR-Codes wurden gelesen, andere nicht.

Änderung:
- QR-Version 5 (37×37 Module) wurde auf Version 4 (33×33 Module) reduziert.
- Der vorhandene kurze anonyme Tier-Schlüssel im Kinderlink passt vollständig in Version 4-L.
- QR-Farbe ist jetzt reines Schwarz auf Weiß.
- SVG nutzt `shape-rendering="crispEdges"` für scharfe Modulgrenzen.
- PWA-Cache auf v88 erhöht.

Getestet:
- 100 zufällig erzeugte Tier-Zugänge mit der echten Lernstand-Kompass-Adresse
  wurden nach dem Rendern als PNG wieder vollständig und korrekt decodiert.

Zu ersetzen:
- qrcode.js
- service-worker.js

Danach die QR-Karten neu anzeigen/neu drucken.
