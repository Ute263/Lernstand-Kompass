# Lernstand-Kompass – Schritt 3a: Lehrerdesign

## Was sich geändert hat
- Schriftfamilie im Lehrerbereich: Manrope, sofern am Gerät vorhanden; alternativ Avenir Next (Mac) und weitere moderne Systemschriften. Aus Datenschutz- und Offline-Gründen werden keine Webfonts von einem fremden Server geladen.
- Klarere Navigationsschaltflächen, Abstände und dezente Flächen in der Lehreroberfläche.
- Die Kinderoberfläche und **alle Drucklayouts** bleiben unangetastet. Es wurde kein JavaScript geändert.

## Lokal starten – Mac
1. Laufende Version unter `http://localhost:8770` bei Bedarf sichern (Backup mit Testdaten).
2. In das alte Terminal wechseln, **Control + C** drücken und das Fenster schließen.
3. ZIP entpacken, Ordner `Lernstand-Kompass-Original-Schritt3a` außerhalb des GitHub-Ordners öffnen.
4. `start-local.command` mit Doppelklick öffnen (bei Sperre: Rechtsklick → Öffnen).
5. Terminal **offen lassen**. Die Ausgabe muss `Serving HTTP on 127.0.0.1 port 8770` enthalten.
6. Chrome starten, **http://localhost:8770** aufrufen.
7. Falls die alte Oberfläche angezeigt wird: **Command + Shift + R**; ggf. Browser-Cache, nicht aber Website-Daten, prüfen.
8. Nach dem Test im Terminal **Control + C** drücken und das Fenster schließen.

**Wichtig:** Die lokale Fassung verwendet den gleichen localhost-Ursprung wie Schritt 2b. Bereits vorhandene lokale Testdaten können weiterhin sichtbar sein. Ohne Synchronisierung testen, keine produktiven Schülerdaten eingeben.

## Status
Keine Änderungen an `app.js`, Modellen, Speicherung, Druckvorlagen, Katalogen oder Lehrwerksbildern. Die Veränderungen beschränken sich auf `teacher-modern.css` sowie dessen Einbindung und Offline-Cache-Eintrag.
