# GitHub und Cloudflare – finale Bereitstellung

## Vor dem Upload

Diese Projektversion ist als vollständiger Ersatz des bisherigen Repository-Inhalts gedacht. Alte nummerierte Kopien wie `sync 2.js`, `storage 3.js` oder `weekly-plan-9f 4.js` gehören nicht mehr in das Repository.

## Einmaliger Upload zu GitHub

Die bereinigte App enthält wegen der vielen Lehrwerkscover weiterhin mehr als 100 Dateien. Deshalb nicht über die GitHub-Webseite Datei für Datei hochladen. Nutze den bereits lokal geklonten Repository-Ordner auf dem Mac (GitHub Desktop oder Terminal) und führe genau **einen Commit und einen Push** aus.

1. Die finale ZIP lokal entpacken.
2. Den Inhalt des bisherigen lokalen Repository-Arbeitsordners durch den Inhalt der entpackten Final-Version ersetzen. Den versteckten `.git`-Ordner des vorhandenen Repositorys nicht löschen.
3. Prüfen, dass `package.json`, `index.html`, `scripts/`, `materials/`, `icons/`, `cloudflare-worker/`, `migrations/` und die übrigen aktiven Quelldateien direkt im Repository-Stamm liegen.
4. Im Terminal im Repository-Ordner einmal ausführen:

```bash
git add -A
git commit -m "Stabilisierung Speicherung Sync und Druck"
git push
```

Damit landen Löschungen alter Dubletten und alle neuen Dateien gemeinsam in **einem** GitHub-Update.

## Build

Vor dem Deployment muss ausgeführt werden:

```bash
npm run verify
```

Die vollständige Prüfung umfasst Syntax, Wochenplanstruktur, Planauswahl, Speicher-Roundtrip, Autosave, Gesamtbackup, Kinder-/Cloudflare-Sync, allgemeine Merge-Logik, OneDrive-Konfliktschutz, Drucklogik sowie die Vollständigkeit des Produktions-Builds.

Der Produktions-Build wird nach `dist/` geschrieben. `wrangler.jsonc` veröffentlicht genau diesen Ordner.

## Woran ist die neue Version erkennbar?

Auf der Startseite steht die beim Build erzeugte Angabe:

`App-Version: TT.MM.JJJJ · HH:MM:SS Uhr`

Der Service Worker erhält bei jedem Build gleichzeitig einen neuen Cache-Namen. Falls ein Gerät dennoch eine ältere Oberfläche zeigt, kann die vorhandene Funktion „App-Version neu laden“ die App-Caches erneuern, ohne IndexedDB/localStorage-Lernstände zu löschen.
