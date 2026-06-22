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
- `qrcode.js`
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

Die Arbeitsmappe enthält unter anderem `Start`, `Klassenübersicht`, `Fortschritt`, `Trainingszeit`, `Lernzielkontrollen`, `LZK Aufgaben`, `LZK Ergebnisse`, `Bewertungsschlüssel`, `Druckübersicht` und `Daten`. Standardmäßig enthält sie nur Tier-Pseudonyme. Optional kann die Lehrkraft bewusst einen internen Export mit den lokal gespeicherten Vornamen erstellen.

## Druckansicht / PDF

In der `Lernstand-Übersicht` gibt es den Bereich `Druckansicht / PDF`. Dort können Tagesübersicht, Wochenübersicht, Hilfe & Kontrolle, Fortschritt, Trainingszeit und Gesamtbericht direkt in der App als gestaltete Druckvorschau geöffnet werden. Über den Browser-Druckdialog kann die Lehrkraft die Ansicht drucken oder als PDF speichern.

## Material drucken

Im geschützten Bereich `Material drucken` kann die Lehrkraft Material für das Lerntagebuch drucken. Es gibt eine kindgerechte Übersichtsliste mit Aufgaben-Code, kurzer Beschreibung und kleinem Abhakfeld sowie einen Stickerbogen im Etikettenformat `64,6 mm × 33,8 mm`. Die Sticker enthalten Aufgaben-Code, kurze Beschreibung, Bereich und ein kleines Symbol. Druckbar sind alle Aufgaben, einzelne Bereiche oder eine eigene Auswahl. Die Ausdrucke enthalten keine Tiernamen, keine Vornamen, keine Bewertungen und keine Punkte.

## Lernzielkontrollen

In der `Lernstand-Übersicht` gibt es den Bereich `Lernzielkontrollen` für Tests, Diagnosen und kleine Überprüfungen mit Ergebnissen je Tier-Pseudonym. Lernzielkontrollen können Aufgaben mit Maximalpunkten enthalten. Die App berechnet Gesamtpunkte, Prozentwert, Bewertungsvorschlag und Notenvorschlag. In Kinderansicht, QR-Codes und anonymisierten Exporten erscheinen keine Vornamen oder Fotos.

Die Datei wird lokal im Browser mit der mitgelieferten Datei `exceljs.min.js` erzeugt. Es wird kein CDN zur Laufzeit verwendet. Falls die `.xlsx`-Erzeugung in einem Browser nicht klappt, stehen einfache CSV-Exporte als Fallback bereit.

## Trainingszeit

In `Meine Lernreise` gibt es `Trainingszeit` mit den Bereichen `Schule` und `OGS / Zuhause`. `OGS / Zuhause` ist in `Deutsch-Entdecker`, `Mathe-Entdecker` und `Forscher` gegliedert. Hinterlegt sind D-01 bis D-15, M-01 bis M-09 und F-01 bis F-20 mit kindgerechter Anleitung für das Lerntagebuch. Erst der Button `Aufgabe starten` speichert die Aufgabe als bearbeitet. Bearbeitete Aufgaben bleiben sichtbar, werden aber abgeschwächt dargestellt und nicht erneut auswählbar. In der `Lernstand-Übersicht` zeigt `Trainingszeit` eine filterbare Übersicht der bearbeiteten und offenen Aufgaben je Tier-Pseudonym. Die Lehrkraft kann versehentliche Auswahlen zurücksetzen; die Änderung wird historisch gespeichert.

## Lernpost

Im Kinderbereich gibt es einen unaufdringlichen Button `Lernpost`. Damit wird eine kleine Datei für AirDrop oder `In Dateien sichern` erstellt. Sie enthält nur kindgerechte Lernereignisse wie Seitenstände und bearbeitete Trainingsaufgaben. Vornamen, Noten, Lernzielkontrollen und Lehrkraftdaten werden nicht in die Lernpost geschrieben. Auf dem Lehrkraftgerät kann die Datei über `Lernpost zusammenführen` ergänzt werden; vorhandene Daten bleiben erhalten.

## Tier-Zuordnung

Im geschützten Bereich `Tier-Zuordnung` kann die Lehrkraft optional Vornamen zu Tieren speichern und per Schalter ein- oder ausblenden. Diese Vornamen erscheinen nie im Kinderbereich und nie in QR-Codes. Standardexporte bleiben anonymisiert; interne Exporte mit Vornamen müssen bewusst gewählt und geschützt abgelegt werden.

## QR-Reader

In `Meine Lernreise` können Kinder ihr Tier entweder manuell auswählen oder über `QR-Code scannen` öffnen. Der QR-Code enthält nur eine anonyme Tier-ID in der Form `animalId=...`. Es werden keine Kindernamen und keine persönlichen Daten im QR-Code gespeichert.

In der `Lernstand-Übersicht` gibt es den Bereich `Tier-QR`. Dort können QR-Codes für die aktiven Tiere angezeigt und als Druckbogen ausgegeben werden. Die QR-Erzeugung läuft lokal über `qrcode.js`, ohne CDN und ohne externen QR-Dienst. Die Kamera-Erkennung läuft lokal im Browser; falls der Browser die automatische Erkennung nicht unterstützt, kann die Tier-ID manuell eingegeben werden.

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
