# Architektur des Lernstand-Kompass

Der Lernstand-Kompass ist bewusst als statische Progressive Web App ohne serverseitiges Anwendungs-Framework aufgebaut. Die Oberfläche läuft vollständig im Browser und kann dadurch auf iPad, Mac und anderen Geräten mit einem modernen Browser eingesetzt werden.

## Technischer Ansatz

Die Anwendung verwendet HTML, CSS und JavaScript ohne React, Vue oder Angular. Diese Entscheidung hält den Build klein, vermeidet zusätzliche Laufzeitabhängigkeiten und passt zur lokalen Datenhaltung der Anwendung.

Die Anwendung ist funktional in mehrere klar getrennte Bereiche gegliedert:

- `app.js` – zentrale Navigation, Zustandslogik und Kernansichten
- `models.js` – Datenmodelle und Grundstrukturen
- `storage.js` – lokale Persistenz im Browser
- `sync.js` – optionale Microsoft-/OneDrive-Anbindung und Klassen-Sync
- `export.js` – Exporte und Druckdaten
- `child-sync.js` – geräteübergreifende Kinderfunktionen
- `teacher-cockpit.js` / `teacher-inbox.js` – Lehrkraftansichten
- Wochenplan-Module – Planung, Lehrwerksauswahl, Druck und Kalender
- Lernspiel-Module – Nomen-Probe und weitere Lernspiel-Funktionen
- `legal-info.js` / `legal-info.css` – Impressum, Datenschutz und Nutzungsinformationen
- `pwa.js`, `manifest.json`, `service-worker.js` – PWA-Installation und Offline-Cache

## Ladeprinzip

Die JavaScript-Dateien werden in `index.html` in einer fest definierten Reihenfolge geladen. Abhängige Funktionsmodule stehen dabei nach ihren jeweiligen Basismodulen. Dadurch bleibt die Anwendung ohne Bundler direkt als statische Web-App ausführbar.

Einige historisch entstandene Funktionsmodule ergänzen bestehende Bereiche des Kerns. Diese Module werden nicht als unabhängige Framework-Komponenten behandelt, sondern als Teil der jeweiligen Fachfunktion. Bei zukünftigen größeren Umbauten können sie schrittweise in fachlich gebündelte Module zusammengeführt werden, ohne die Datenstruktur oder das Deployment zu verändern.

## Datenhaltung

Die primäre Datenhaltung erfolgt lokal im Browser:

- IndexedDB bzw. lokale Browser-Speichermechanismen
- keine zentrale Datenbank für die regulären Lernstandsdaten
- Backups und Exporte werden bewusst durch die Lehrkraft ausgelöst

Optional kann eine Microsoft-/OneDrive-Sicherung eingerichtet werden. Die lokale Datenhaltung bleibt auch dann bestehen.

## Microsoft-Anbindung

Die Microsoft-Anmeldung wird als SPA mit MSAL und Authorization Code Flow mit PKCE umgesetzt. Es wird kein Client-Secret im Browser gespeichert.

Verwendete Microsoft-Graph-Berechtigungen:

- `openid`
- `profile`
- `User.Read`
- `Files.ReadWrite`

Die App legt für ihre Sicherung den Ordner `OneDrive/Lernstand-Kompass` an und verwendet innerhalb der Anwendung diesen Bereich für Backup und Synchronisierung.

## Build und Prüfung

Der Produktionsordner wird mit

```bash
npm run build
```

erzeugt. Der Build liegt anschließend in `dist/`.

Für technische Übergaben sollte zusätzlich die Syntaxprüfung ausgeführt werden:

```bash
npm run check
```

Mit

```bash
npm run verify
```

werden Syntaxprüfung und Build nacheinander ausgeführt.

## Deployment

Die Anwendung kann als statische Site bereitgestellt werden. Aktuell wird sie über Cloudflare ausgeliefert. Der Service Worker stellt die für den Offline-Betrieb benötigten App-Ressourcen bereit.

## Grundsatz für Änderungen

Bei Änderungen gelten drei Prioritäten:

1. bestehende gespeicherte Daten dürfen nicht beschädigt werden,
2. Kinder- und Lehrkraftansicht müssen mit bestehenden lokalen Daten kompatibel bleiben,
3. neue Funktionen sollen möglichst einem vorhandenen Fachmodul zugeordnet werden, statt weitere parallele Sonderlogik einzuführen.
