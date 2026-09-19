# Lernstand-Kompass

Der **Lernstand-Kompass** ist eine statische Progressive Web App zur Planung, Dokumentation und Übersicht individueller Lernwege im schulischen Alltag. Die Anwendung ist für den Einsatz auf iPad, Mac und anderen Geräten mit modernem Browser ausgelegt.

**Konzeption und Entwicklung:** Ute Holzschneider-Riedl  
**Copyright © 2026 Ute Holzschneider-Riedl. Alle Rechte vorbehalten.**

Die veröffentlichte App darf in ihrer bereitgestellten Form unentgeltlich genutzt werden. Die vollständigen Nutzungsbedingungen stehen in `LICENSE`.

## Technischer Überblick

Die Anwendung verwendet bewusst HTML, CSS und JavaScript ohne React, Vue oder Angular. Dadurch bleibt sie als statische Web-App direkt auslieferbar und benötigt für den regulären Betrieb keinen eigenen Anwendungsserver.

Die Kernbereiche sind fachlich getrennt:

- lokale Datenhaltung und Datenmodelle
- Lehrkraft- und Kinderansicht
- Wochenplanung und Lernstandsübersicht
- Lernspiele und Lernzielkontrollen
- Druck und Export
- optionale Microsoft-/OneDrive-Sicherung
- optionale Klassen-Synchronisierung
- PWA-/Offline-Funktion

Weitere technische Details stehen in [`ARCHITECTURE.md`](ARCHITECTURE.md).

Für die Unterstützung bei der schulischen Microsoft-Anmeldung steht eine gesonderte technische Beschreibung in [`IT-SUPPORT.md`](IT-SUPPORT.md).

## Datenhaltung

Die regulären Lernstandsdaten werden lokal im Browser gespeichert. Die Anwendung verwendet dafür IndexedDB bzw. lokale Browser-Speichermechanismen. Eine zentrale Datenbank ist für den normalen Betrieb nicht erforderlich.

Optional kann eine Microsoft-/OneDrive-Sicherung eingerichtet werden. Dabei bleibt die lokale Datenhaltung erhalten.

## Microsoft / OneDrive

Die Microsoft-Anmeldung ist als Single-Page-Application mit MSAL und Authorization Code Flow mit PKCE umgesetzt. Ein Client-Secret wird nicht im Browser gespeichert.

Aktuell verwendete Microsoft-Graph-Berechtigungen:

- `openid`
- `profile`
- `User.Read`
- `Files.ReadWrite`

Die App verwendet für Sicherungen den Ordner `OneDrive/Lernstand-Kompass`.

## Projektstruktur

Wichtige Dateien und Verzeichnisse:

```text
index.html                 Einstieg und definierte Script-Ladereihenfolge
app.js                     zentrale Navigation und Kernlogik
models.js                  Datenmodelle
storage.js                 lokale Persistenz
sync.js                    Microsoft/OneDrive und Klassen-Sync
export.js                  Exporte
tools / feature modules    fachliche Zusatzfunktionen
styles.css                 zentrale Gestaltung
service-worker.js          Offline-Cache
manifest.json              PWA-Metadaten
materials/                 Druck- und Lehrwerksmaterialien
icons/                     App-Icons
scripts/build.js            Build der statischen Distribution
scripts/check-syntax.js     Syntaxprüfung eigener JavaScript-Dateien
cloudflare-worker/         optionaler Klassen-Sync-Dienst
```

## Lokale Prüfung

Voraussetzung: Node.js 20 oder neuer.

Syntaxprüfung:

```bash
npm run check
```

Build:

```bash
npm run build
```

Komplette Prüfung:

```bash
npm run verify
```

Der Build wird nach `dist/` geschrieben. Lokale Browserdaten, Vornamen, Lernstände, Bewertungen und Notizen werden nicht in den Build übernommen.

## Deployment

Die Anwendung kann als statische Site bereitgestellt werden. Für den aktuellen Betrieb wird Cloudflare verwendet. Der Service Worker stellt die benötigten App-Ressourcen für den Offline-Betrieb bereit.

## Datenschutzprinzipien

- reguläre Lernstandsdaten primär lokal im Browser
- Tier-Pseudonyme im Kinderbereich
- keine Vornamen in QR-Codes
- interne Exporte mit Vornamen nur nach bewusster Auswahl
- Microsoft-/OneDrive-Übertragung nur bei eingerichteter und genutzter Synchronisierung

Die in der App angezeigten Hinweise zu Datenschutz, Impressum und Nutzung sind zusätzlich über die Fußzeile erreichbar.

## Hauptfunktionen

Der Lernstand-Kompass umfasst unter anderem:

- Wochenpläne mit Lehrwerks- und Seitenzuordnung
- individuellen Arbeitsstand je Kind
- Lernstandsübersichten
- Trainingszeit und Entdeckeraufgaben
- Lernzielkontrollen
- Lernspiele
- QR-Zugang über Tier-Pseudonyme
- Druckansichten und PDF-Ausgabe
- Excel-/CSV-Exporte
- lokale Backups und Wiederherstellung
- optionale OneDrive-Sicherung
- optionale Synchronisierung von Kindergeräten

## Lizenz

Für den Lernstand-Kompass gilt die Datei [`LICENSE`](LICENSE). Für eingebundene Fremdbibliotheken gelten zusätzlich deren jeweilige Lizenzbedingungen, insbesondere die mitgelieferten Lizenzdateien.

## V13 – Wochenplan automatisch speichern
- Jede Änderung im Wochenplan wird lokal automatisch gespeichert.
- Texteingaben werden nach einer sehr kurzen Eingabepause gespeichert.
- Aufgabe hinzufügen/entfernen, Reihenfolge, Sternchen, Sozialform, Materialauswahl und Einzelkind-Abweichungen werden sofort gespeichert.
- Vor dem Wechsel zu einem anderen Kind oder Wochenplan wird der aktuelle Stand zuerst gespeichert.
- Ein sichtbarer Status zeigt „Speichert …“ bzw. „✓ automatisch gespeichert“.
- Der bisherige notwendige Speichern-Button im Wochenplan entfällt.
