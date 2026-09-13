# Paket 9 – Kolleginnen-Version

## Ziel
Eine Kollegin soll die Lernstand-Kompass-App benutzen können, ohne selbst eine
Microsoft-App in Entra/Azure anzulegen.

## Microsoft
Die App verwendet jetzt standardmäßig die gemeinsame Microsoft-Appregistrierung:

- Client-ID: fest in der App hinterlegt
- Authority: `common`
- Redirect-URL: wird automatisch aus der Web-Adresse erkannt
- kein Client-Secret
- normale Nutzerinnen sehen keine Client-ID- oder Redirect-Eingabefelder mehr

Die Kollegin klickt nur:
**Mit Microsoft verbinden**

Die OneDrive-Sicherung liegt weiterhin im OneDrive des jeweils angemeldeten
Microsoft-Kontos.

### Einmalige Voraussetzung für die Besitzerin der App
Die gemeinsame Microsoft-Appregistrierung muss als unterstützte Kontotypen
zulassen:

**Accounts in any organizational directory and personal Microsoft accounts**

Die SPA-Redirect-URL der veröffentlichten Lernstand-Kompass-Web-App muss in der
Registrierung hinterlegt bleiben.

Hinweis: Einzelne Schul-/Firmen-Mandanten können die Zustimmung zu Drittanbieter-
Apps durch ihre Administration einschränken. In diesem Fall kann die jeweilige
Schul-IT eine Freigabe verlangen. Das lässt sich nicht in der App umgehen.

## Kinder-Sync
Der gemeinsame Cloudflare-Endpunkt ist jetzt voreingestellt.

Eine Kollegin sieht nur:
**Kinder-Sync einrichten**

Beim Klick:
- wird ein zufälliger eigener Klassen-Sync-Code erzeugt
- der gemeinsame Sync-Dienst wird eingetragen
- Kinder-Sync wird aktiviert

Damit teilen Kolleginnen zwar denselben technischen Worker, aber nicht denselben
Klassen-Code.

Technische Angaben sind nur noch unter einem aufklappbaren Bereich sichtbar.

## Bestehende Installation
Vorhandene Daten bleiben erhalten.
Paket 9 migriert:
- Microsoft-Authority `consumers` → `common`
- gemeinsame Client-ID als Standard
- gemeinsamen Klassen-Sync-Endpunkt als Standard

Vorhandene Lernstände, Klassen, QR-Zugänge, Backups und Lernspielergebnisse
werden nicht verändert.

## Deployment
Neu:
- `colleague-mode.js`
- `dist/colleague-mode.js`

Geändert:
- `index.html`
- `dist/index.html`
- `scripts/build.js`
- `service-worker.js`
- `dist/service-worker.js`

Cache-Version: `v102`
