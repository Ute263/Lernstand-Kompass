# Lernstand-Kompass

Eine GitHub-Pages-App für eine einzelne Lehrkraft. GitHub speichert nur diese App-Dateien. Lernstände, Trainingszeit und Lernzielkontrollen werden lokal auf dem iPad/in diesem Browser gespeichert.

## Dateien für GitHub Pages

Diese Dateien müssen direkt im Repository liegen:

- `index.html`
- `styles.css`
- `models.js`
- `storage.js`
- `exceljs.min.js`
- `exceljs-LICENSE.txt`
- `export.js`
- `app.js`
- `pwa.js`
- `manifest.json`
- `service-worker.js`
- `.nojekyll`
- `icons/icon-192.svg`
- `icons/icon-512.svg`

## GitHub Pages aktivieren

1. Repository öffnen.
2. `Settings` öffnen.
3. Links `Pages` öffnen.
4. Bei `Build and deployment` auswählen:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - Ordner: `/(root)`
5. Speichern.

## Speicherung

- bevorzugt IndexedDB
- fallback über localStorage
- Speicherung nach jeder Änderung
- keine externe Datenbank
- keine Cloud-Synchronisation

## Exporte

In der `Lernstand-Übersicht` gibt es den Bereich `Exporte`. Dort können gestaltete `.xlsx`-Arbeitsmappen für die aktive Klasse, alle Klassen, den heutigen Tag und offene Hilfe-/Kontrollwünsche erstellt werden.

Die Arbeitsmappe enthält unter anderem `Start`, `Klassenübersicht`, `Fortschritt`, `Trainingszeit`, `Lernzielkontrollen`, `LZK Aufgaben`, `LZK Ergebnisse`, `Bewertungsschlüssel`, `Druckübersicht` und `Daten`. Sie enthält keine Kindernamen.

## Druckansicht / PDF

In der `Lernstand-Übersicht` gibt es den Bereich `Druckansicht / PDF`. Dort können Tagesübersicht, Wochenübersicht, Hilfe & Kontrolle, Fortschritt, Trainingszeit und Gesamtbericht direkt in der App als gestaltete Druckvorschau geöffnet werden. Über den Browser-Druckdialog kann die Lehrkraft die Ansicht drucken oder als PDF speichern.

## Lernzielkontrollen

In der `Lernstand-Übersicht` gibt es den Bereich `Lernzielkontrollen` für Tests, Diagnosen und kleine Überprüfungen mit Ergebnissen je Tier-Pseudonym. Lernzielkontrollen können Aufgaben mit Maximalpunkten enthalten. Die App berechnet Gesamtpunkte, Prozentwert, Bewertungsvorschlag und Notenvorschlag. Es werden weiterhin keine Kindernamen oder Fotos exportiert oder gedruckt.

Die Datei wird lokal im Browser mit der mitgelieferten Datei `exceljs.min.js` erzeugt. Es wird kein CDN zur Laufzeit verwendet. Falls die `.xlsx`-Erzeugung in einem Browser nicht klappt, stehen einfache CSV-Exporte als Fallback bereit.

## Trainingszeit

In `Meine Lernreise` gibt es `Trainingszeit` mit den Bereichen `Schule` und `OGS / Zuhause`. In `OGS / Zuhause` öffnen Kinder zuerst eine Entdeckeraufgabe mit genauer Anleitung. Erst der Button `Aufgabe starten` speichert die Aufgabe als bearbeitet. Bearbeitete Aufgaben bleiben sichtbar, werden aber abgeschwächt dargestellt und nicht erneut auswählbar. In der `Lernstand-Übersicht` zeigt `Trainingszeit` eine filterbare Übersicht der bearbeiteten und offenen Aufgaben je Tier-Pseudonym. Die Lehrkraft kann versehentliche Auswahlen zurücksetzen; die Änderung wird historisch gespeichert.

## Fortschritt

In der `Lernstand-Übersicht` gibt es den Bereich `Fortschritt`. Dort werden Lernstände chronologisch und neutral ausgewertet: letzte Aktivität, Seitenfortschritt, Gruppenschnitt, Soll-Seiten und offene Hilfe-/Kontrollwünsche. Soll-Seiten und Fortschritts-Einstellungen werden unter `Tiere & Materialien` verwaltet.

## PIN und Wiederherstellung

Die App speichert keine Klartext-PIN. Nach der ersten Einrichtung wird ein Wiederherstellungsschlüssel einmalig angezeigt. Er muss analog notiert werden, weil in der App nur ein Hash gespeichert wird.

## Schrift

Die App ist auf `Grundschrift` eingestellt. Wenn eine passende Schriftdatei vorhanden ist, lege sie so ab:

```text
fonts/Grundschrift.woff2
```

Ohne diese Datei nutzt der Browser automatisch eine freundliche Ersatzschrift.
