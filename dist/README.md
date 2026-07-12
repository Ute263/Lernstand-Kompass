# Lernstand-Kompass

Eine statische Web-App für eine einzelne Lehrkraft. Der Webspeicherort enthält nur diese App-Dateien. Lernstände, Trainingszeit und Lernzielkontrollen werden lokal auf dem iPad/in diesem Browser gespeichert.

## Dateien der App

Diese Dateien müssen gemeinsam im App-Ordner liegen:

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
- `icons/icon-180.png`
- `icons/icon-192.png`
- `icons/icon-512.png`
- `icons/icon-maskable-512.png`

## Installierbare Testversion vorbereiten

Die App kann lokal als statische PWA-Testversion vorbereitet werden. Dabei wird nichts automatisch veröffentlicht und es werden keine Daten hochgeladen.

```text
npm run build
```

Der fertige Ordner heißt:

```text
dist
```

Dieser Ordner enthält nur die statischen App-Dateien, Icons, Druckmaterialien, Manifest und Service Worker. Lokale Browserdaten, Backups, Vornamen, Lernstände, Bewertungen oder Notizen werden nicht in den Build geschrieben.

Zum privaten Testen kann der Ordner lokal mit einem einfachen statischen Server geöffnet werden. Für eine spätere geschützte Bereitstellung müsste nur der Inhalt von `dist` hochgeladen werden.

## Statische App bereitstellen

- Der App-Ordner kann als statische Web-App veröffentlicht werden.
- Möglich sind zum Beispiel Cloudflare Pages Direct Upload oder Netlify Drop.
- Es ist keine Serverlogik nötig.
- Die Daten bleiben lokal im Browser der Lehrkraft bzw. auf dem jeweiligen iPad.
- Für Updates den App-Ordner neu hochladen.
- Nach jedem Update die Cache-Version in `service-worker.js` erhöhen.
- Diese README beschreibt nur die technische Vorbereitung. Es gibt keinen automatischen Deploy-Schritt.

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

Im geschützten Bereich `Material drucken` sind die fertigen Stickerbögen als feste Dateien hinterlegt. `Stickerbogen 1` enthält die Entdeckeraufgaben E-01 bis E-24, `Stickerbogen 2` enthält E-25 bis E-48. Die Lehrkraft öffnet oder lädt diese Vorlagen direkt herunter und druckt sie mit `100 % / tatsächliche Größe`, nicht angepasst an die Seite. Zusätzlich gibt es eine digitale Aufgabenübersicht der 48 Aufgaben und eine dynamische Druckfunktion als nachrangige Notlösung. Die Ausdrucke enthalten keine Tiernamen, keine Vornamen, keine Bewertungen und keine Punkte.

## Werkseinstellung

Unter `Geräte, Backup & Einstellungen` -> `Backup / Wiederherstellung` gibt es im geschützten Lehrkraftbereich den Abschnitt `App zurücksetzen`. Vor dem Zurücksetzen werden Backup-Hinweis, Lehrkraft-PIN, eine Warnung und das Bestätigungswort `ZURÜCKSETZEN` verlangt. Erst danach werden die lokalen App-Daten auf diesem Gerät gelöscht und die Einrichtung startet neu.

## Lernzielkontrollen

In der `Lernstand-Übersicht` gibt es den Bereich `Lernzielkontrollen` für Tests, Diagnosen und kleine Überprüfungen mit Ergebnissen je Tier-Pseudonym. Lernzielkontrollen können Aufgaben mit Maximalpunkten enthalten. Die App berechnet Gesamtpunkte, Prozentwert, Bewertungsvorschlag und Notenvorschlag. In Kinderansicht, QR-Codes und anonymisierten Exporten erscheinen keine Vornamen oder Fotos.

Die Datei wird lokal im Browser mit der mitgelieferten Datei `exceljs.min.js` erzeugt. Es wird kein CDN zur Laufzeit verwendet. Falls die `.xlsx`-Erzeugung in einem Browser nicht klappt, stehen einfache CSV-Exporte als Fallback bereit.

## Trainingszeit

In `Meine Lernreise` gibt es `Trainingszeit` mit den Bereichen `Schule` und `OGS / Zuhause`. `OGS / Zuhause` führt direkt zu den gemeinsamen `Entdeckeraufgaben`; im Kinderbereich wird nicht mehr zwischen Deutsch-Entdecker, Mathe-Entdecker und Forscher unterschieden. Die zentrale Aufgabenliste enthält 48 aktive Aufgaben: E-01 bis E-48. Dieselben Texte werden für digitale Karten, Modal, Druckübersicht und Stickerbogen genutzt. Erst der Button `Aufgabe starten` speichert die Aufgabe als bearbeitet. Bearbeitete Aufgaben bleiben sichtbar, werden aber abgeschwächt dargestellt und nicht erneut auswählbar. In der `Lernstand-Übersicht` zeigt `Trainingszeit` eine filterbare Übersicht der bearbeiteten und offenen Aufgaben je Tier-Pseudonym. Die Lehrkraft kann versehentliche Auswahlen zurücksetzen; die Änderung wird historisch gespeichert.

## Wochenpläne

Im Kinderbereich `Meine Lernreise` gibt es zusätzlich die Kachel `Meine Woche`. Der Wochenplan enthält nur Deutsch-Arbeitsheft/Lehrwerk, Mathe-Arbeitsheft/Lehrwerk und freie Aufgaben der Lehrkraft. Die Entdeckeraufgaben werden dort nicht angezeigt. Im Lehrkraftbereich liegt der Wochenplan jetzt unter `Arbeitshefte & Wochenplan` mit den Unterbereichen `Aktuelle Woche`, `Wochenplan erstellen`, `Vorlagen` und `Arbeitsheft-Katalog`. Die Lehrkraft pflegt dort Inhaltsverzeichnisse für `ABC der Tiere`, `MiniMax` oder eigene Lehrwerke, wählt eine oder mehrere Seiten über ein Such- und Filter-Auswahlfenster aus, legt Standardpläne für alle Tiere an und kann individuelle Abweichungen pro Tier speichern. Wochenpläne können kindgerecht als A4-Hochformat gedruckt oder als PDF gespeichert werden. Wochenplan-Aufgaben aus dem Arbeitsheft-Katalog und direkte Deutsch-/Mathe-Einträge landen gemeinsam im Fortschritt. Sichtbar sind nur die Status `offen`, `teilweise` und `fertig`.

Im Standardkatalog sind `ABC der Tiere 1`, `ABC der Tiere 2`, `MiniMax 2`, `MiniMax 3` und `MiniMax 4` hinterlegt. `ABC der Tiere 1` enthält den Schreiblehrgang Teil A und Teil B. `MiniMax 2`, `MiniMax 3` und `MiniMax 4` werden kompakt als Themen mit Seitenbereichen geführt und nicht sichtbar in Basis/Training/Extra/Test zerlegt. `MiniMax 3` ist Schuljahr 3 zugeordnet, `MiniMax 4` ist Schuljahr 4 zugeordnet.

## Deutsch-Notizen

Im Kinderbereich führt `Deutsch` bei freien Zusatz-/Notizmaterialien nicht mehr zu Aufgaben-Kärtchen. Stattdessen erscheint ein schlichtes Schreibfeld `Meine Notizen`, in dem Kinder Wörter, Sätze, Notizen oder Ideen festhalten können.

## Lehrkraftnavigation

Die `Lernstand-Übersicht` ist in wenige Hauptbereiche gegliedert: `Kinder & Fortschritt`, `Arbeitshefte & Wochenplan`, `Trainingszeit`, `Lernzielkontrollen`, `Materialien & Druck` und `Geräte, Backup & Einstellungen`. Die bisherigen Detailansichten bleiben als Unterpunkte in diesen Bereichen erreichbar.

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
