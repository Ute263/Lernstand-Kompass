# Paket 02 – Microsoft / OneDrive + Klassen-Sync

## Enthalten

- neuer Bereich **Backup und Einstellungen → Microsoft & Sync**
- Microsoft-Anmeldung für ein persönliches Microsoft-Konto
- OneDrive-Sicherung im Ordner `OneDrive/Lernstand-Kompass`
- manueller OneDrive-Abgleich (Cloud holen → zusammenführen → wieder sichern)
- optionale automatische OneDrive-Sicherung nach Änderungen
- verschlüsselter Klassen-Sync für Lernspiel-Ergebnisse
- Nomen-Probe sendet neue Ergebnisse automatisch, sobald der Klassen-Sync eingerichtet ist
- Lehrkraft kann neue Kinder-Ergebnisse mit einem Klick abrufen
- Cloudflare-Worker + D1-Beispiel unter `cloudflare-worker/`

## Microsoft-Appregistrierung

Für die Web-App wird **kein Client-Secret** benötigt und keines darf in die Browser-App eingetragen werden.

1. Microsoft Entra / App registrations öffnen.
2. Eine App für den Lernstand-Kompass verwenden oder neu anlegen.
3. Unter **Authentication** eine Plattform **Single-page application (SPA)** hinzufügen.
4. Als Redirect-URI exakt die Adresse eintragen, die der Lernstand-Kompass im Bereich „Microsoft & Sync“ anzeigt.
5. Unter **API permissions** die delegierte Microsoft-Graph-Berechtigung `Files.ReadWrite` hinzufügen.
6. Die **Application (client) ID** im Lernstand-Kompass eintragen.
7. Im Lernstand-Kompass „Mit Microsoft verbinden“ wählen.

Die OneDrive-Datei heißt `lernstand-kompass-sync.json` und liegt im Ordner `OneDrive/Lernstand-Kompass`. Die App greift ausschließlich auf diesen Ordner zu, auch wenn die Microsoft-Berechtigung `Files.ReadWrite` technisch weiter reicht.

## Klassen-Sync / Cloudflare

Der Klassen-Sync ist absichtlich getrennt von deinem Microsoft-Konto. Kindergeräte brauchen dadurch weder Microsoft-Zugang noch Zugriff auf dein OneDrive.

Benötigt werden:

- ein Cloudflare Worker
- eine D1-Datenbank
- das Schema `cloudflare-worker/schema.sql`
- die D1-Bindung `DB`

Die Lernspiel-Daten werden **vor dem Versand im Browser mit AES-GCM verschlüsselt**. Der Worker speichert nur verschlüsselte Nutzdaten und einen aus dem Sync-Code abgeleiteten Bucket-Schlüssel.

## Datenschutz-Hinweis

Der Klassen-Sync überträgt Lernspiel-Sitzungen mit zufälliger Tier-/Klassen-ID und Testdaten. Vornamen werden nicht übertragen. Die Zuordnung Tier ↔ Vorname verbleibt im lokalen Lehrkraft-Datenbestand bzw. im privaten OneDrive-Gesamtbackup.
