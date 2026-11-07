# Lokale Original-App – Korrektur Schritt 2b

**Behobener Fehler:** Die Wochenplan-Arbeitsheftauswahl war auf Klasse 1 und 2 begrenzt, obwohl MiniMax 3 und 4 im Katalog standen. Jetzt lassen sich Klasse 1, 2, 3 und 4 auswählen. Die Förderhefte bleiben jahrgangsübergreifend.

## Start auf dem Mac

1. Vorherige App öffnen und gegebenenfalls über **Daten & Backup** sichern.
2. Das bisherige Terminal mit **Control + C** beenden und Fenster schließen.
3. Neue ZIP entpacken; den Ordner **außerhalb** des GitHub-Ordners ablegen.
4. Im neuen Ordner `start-local.command` doppelklicken. Terminal **geöffnet lassen**.
5. Chrome öffnen: **http://localhost:8770**. Bei einer alten Anzeige **Command + Shift + R** drücken; gegebenenfalls die Seite erneut laden, bis die neue Service-Worker-Version aktiviert ist.
6. **Wochenplan → Mathe → Arbeitshefte auswählen → Klasse 3** wählen. Erwartet: **MiniMax 3** und **Größen und Sachrechnen**, mit auswählbaren Seiten. Ebenso Klasse 4 prüfen.
7. Beenden: Im Terminal **Control + C**; danach schließen.

**Nicht** `index.html` per Doppelklick öffnen. Die lokale Fassung verwendet dieselbe `localhost:8770`-Adresse wie die vorherige Originalbasis, deshalb bleiben lokale Browserdaten in der Regel erhalten. Es wurde nicht auf GitHub/Cloudflare veröffentlicht. Nicht ohne Backup mit echten Schülerdaten arbeiten oder Synchronisierung aktivieren.

### Kontrollen

`npm run verify` enthält neben den bisherigen Prüfungen den neuen Test `check:picker-years`, der die tatsächlich gerenderte Auswahl für alle vier Jahrgänge kontrolliert. Die Datensätze, Drucklayouts und andere Funktionen sind unverändert.
