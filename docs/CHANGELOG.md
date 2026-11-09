# Änderungsprotokoll

## 1.4.2
- Lehrer-Login: zweiter Rahmen um das PIN-Feld entfernt, Überschrift „Wochenpläne und Lernstände“ steht in einer Zeile.
- Backup-Ansicht aufgeräumt: „Gesamtbackup speichern“ stand viermal da, jetzt einmal (plus bewusst „Backup jetzt erstellen“ im Rücksetz-Bereich). „Backup zusammenführen“ und „Backup wiederherstellen“ öffneten dieselbe Dateiauswahl und sind jetzt ein Knopf „Backup-Datei einlesen“; die Wahl zwischen Zusammenführen und Wiederherstellen kommt danach wie bisher.
- Veraltete Bezeichnung „Microsoft & Sync“ in drei Hinweistexten durch „Sicherung & Kindergeräte“ bzw. „OneDrive-Sicherung“ ersetzt.
- Speicher/iPad: Zwölf Flex-und-Flora-Cover waren bis zu 1254×1254 Pixel groß (je ca. 6 MB entpackt im Arbeitsspeicher), obwohl sie nur klein angezeigt werden. Auf höchstens 640 Pixel verkleinert (Bilddaten 2,4 MB → 0,5 MB, Aussehen unverändert).
- Geschwindigkeit (wichtig): Die Klassenübersicht („Lernstand“) berechnete die Seitenaufteilung des Heftkatalogs und die Status-Suche tausendfach neu. Mit 40 Wochenplänen und 25 Kindern dauerte der Aufbau 52 Sekunden, jetzt unter 1 Sekunde (gemessen auf einem Rechner; Ausgabe unverändert). Umsetzung: Zwischenspeicher für den aufgeteilten Katalog (`expandedWorkbookCatalogForClass`, neu `weeklyPlanCatalogItemById`) und ein Index für `weeklyPlanStatusRecord`; beide gelten nur, solange sich Katalog bzw. Status-Liste nicht ändern.
- Wochenplan-Editor: Die Auf-/Zu-Logik für Deutsch und Mathe merkt sich jetzt pro Tag (bzw. Wochenansicht) und Kind, welches Fach bewusst geöffnet wurde. Bisher klappte jeder Neuaufbau der Ansicht (z. B. nach Heftauswahl oder Autospeichern) nach der Standardregel um: Waren beide Fächer befüllt, sprang Deutsch auf und Mathe zu. Ohne eigene Wahl gilt weiterhin die Standardregel.
- Wochenplan für einzelne Kinder: Die Kinderliste („Kinder auswählen“) wurde bei jedem Neuaufbau der Ansicht (z. B. beim Öffnen eines Tages) von teacher-editor-redesign.js wieder zugeklappt, obwohl „Ausgewählte Kinder“ gewählt war. Jetzt bleibt sie offen, solange sie bewusst geöffnet wurde (Moduswechsel oder Klick auf „Kinder auswählen“).

- Drei Lehrwerks-Cover (ABC der Tiere 1 Arbeitsheft, MiniMax 2 Geometrie, MiniMax 2 Größen und Sachrechnen) durch eigene Kacheln im Stil der übrigen Cover ersetzt (gleiche Dateinamen, gleiche Farben). Außerdem doppelten Knopf „Lernpost zusammenführen“ im Backup-Bereich entfernt (er öffnete dieselbe Dateiauswahl wie „Backup zusammenführen“, die Lernpost-Dateien selbst erkennt).

## 1.4.1 – Lokales Speichern (Schritt 3w)

Datenformat und Speicherlogik (`storage.js`, `models.js`) unverändert.

- Sicherungsdatei: Abbrechen im Speichern-Dialog ist kein Fehler mehr („Speichern abgebrochen“ statt „Die Datei konnte nicht erstellt werden“). Andere Fehler werden weiterhin gemeldet.
- Safari/Download: Hinweis, dass die Datei im Download-Ordner liegt und wo man ihn ändern kann.
- iPad: zusätzlicher Button „Gesamtbackup in Dateien sichern (Teilen)“ (nur sichtbar, wenn der Browser das Teilen von Dateien kann); der Ordner ist frei wählbar.
- Datei-Sicherung zeigt „Letzte Sicherungsdatei“ (heute / vor n Tagen; Warnung bei mehr als 14 Tagen oder noch nie). Der Zeitpunkt liegt in `localStorage` (`lk_last_backup_at`), nicht im App-Datenbestand und nicht im Backup.
- Der Browser wird beim Start gebeten, den App-Speicher dauerhaft zu behalten (`navigator.storage.persist()`), ohne Datenänderung.
- Neu: `check:backup-save` (Logik des Speicherns); Schnappschusstest um die Einstellungs-Unteransichten erweitert (86 Ansichten).

## 1.4.0 – Aufräum-Release (Schritte 3o bis 3v)

Ziel: Stabilisierung und Bereinigung, keine neuen Funktionen. Datenformate, Speicherlogik und Druckvorlagen unverändert.

- **3o** Build ohne `README.md` möglich; `wrangler.jsonc` und Dokumentation wieder im Paket.
- **3p** Dokumentationsreste und ungenutzte Dateien nach `docs/archiv/`; vier ungenutzte SVG-Cover entfernt; Prüfung der Bildverweise (`check:materials`).
- **3q** Cover und Logo von 1254 px auf 640 px verkleinert (gleiche Dateinamen); Zip von 21,9 MB auf 11,4 MB.
- **3r** MiniMax-Katalogdaten aus `models.js` in `minimax-katalog-daten.js` ausgelagert (Inhalt byte-gleich).
- **3s/3t** Schrift „Grundschrift von Christian Urff“ (CC BY 3.0) eingebunden, Namensnennung in der App.
- **3u** Browser-Schnappschusstest (`check:snapshot`, 82 Ansichten); `learning-navigation-v7.js` entfernt (Funktion nach v8 übernommen).
- **3v** Versionsangabe vereinheitlicht: `package.json` (1.4.0) ist die Quelle für `build-info.js`; Startskript ohne Schrittbezeichnung.

### Bewusst offen
- `weekly-plan-9e.js`, `weekly-plan-9f.js`, `weekly-fix-172.js` nicht zusammengeführt (es fehlt ein Test für Klickabläufe wie Seitenauswahl und Autosave).
- `app.js` (über 11.000 Zeilen) nicht aufgeteilt.
- Lehrkraft-PIN: einfacher Hash, 4 Zeichen Mindestlänge, keine Sperre nach Fehlversuchen.
- Cloudflare-Worker: Zuordnung der produktiven Bereitstellung nur im Cloudflare-Dashboard prüfbar.
- Lehrwerks-Cover in `materials/`: Verlagsrechte vor einer öffentlichen Veröffentlichung klären.
