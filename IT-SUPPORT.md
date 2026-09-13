# IT-Support – Microsoft-Anmeldung im Lernstand-Kompass

Dieses Dokument beschreibt gezielt die Microsoft-/OneDrive-Anmeldung der Anwendung und die Punkte, die bei einem Schul-Tenant geprüft werden sollten.

## Ausgangslage

Der Lernstand-Kompass ist eine statische Browser-App. Die regulären Lernstandsdaten werden lokal gespeichert. Optional kann die Lehrkraft eine Microsoft-/OneDrive-Sicherung verbinden.

Die Anmeldung funktioniert in einem privaten Microsoft-Kontext, während bei der Nutzung mit dem schulischen Microsoft-365-Konto bzw. auf Schulgeräten eine Meldung wie **„Administratorgenehmigung erforderlich“** auftreten kann.

## Technische Umsetzung

Die Anmeldung ist als Single-Page-Application umgesetzt:

- MSAL Browser
- Authorization Code Flow mit PKCE
- kein Client-Secret im Browser
- Redirect zurück auf die veröffentlichte App-URL

Die Authentifizierung wird in `sync.js` umgesetzt.

## Benötigte Microsoft-Graph-Berechtigungen

Die Anwendung fordert derzeit folgende Scopes an:

- `openid`
- `profile`
- `User.Read`
- `Files.ReadWrite`

`Files.ReadWrite` wird benötigt, weil die App im OneDrive der angemeldeten Lehrkraft den Ordner `Lernstand-Kompass` verwendet und dort die Sicherungsdatei `lernstand-kompass-sync.json` ablegt bzw. aktualisiert.

## In Entra / App-Registrierung zu prüfen

Bitte insbesondere prüfen:

1. **App-Registrierung / Client-ID**
   - Die in der App eingetragene Client-ID muss zur vorgesehenen Entra-Appregistrierung gehören.

2. **Unterstützte Kontotypen**
   - Die Registrierung muss den gewünschten Schul-Tenant bzw. die vorgesehenen Organisationskonten zulassen.

3. **Redirect URI**
   - Die konkrete veröffentlichte App-Adresse muss unter **Authentication → Single-page application (SPA)** eingetragen sein.
   - Die Adresse muss exakt mit der von der App verwendeten Redirect-URL übereinstimmen.

4. **API Permissions**
   - Microsoft Graph: `User.Read`
   - Microsoft Graph: `Files.ReadWrite`
   - prüfen, ob für den Schul-Tenant eine Administratorzustimmung erforderlich ist und ob sie erteilt werden kann.

5. **Enterprise Applications / Consent Policies**
   - prüfen, ob Benutzerzustimmung für Drittanbieter-/selbst registrierte Apps im Tenant blockiert ist.
   - prüfen, ob die App für die betreffende Benutzergruppe freigegeben werden muss.

6. **Conditional Access / Geräte-Richtlinien**
   - falls die Anmeldung nur auf verwalteten Schulgeräten fehlschlägt, bitte Conditional-Access-, Browser- oder App-Schutzrichtlinien prüfen.

## Kein Client-Secret erforderlich

Da es sich um eine Browser-SPA handelt, wird bewusst **kein Client-Secret** verwendet. Ein Secret wäre in einer ausgelieferten Browser-Anwendung nicht sicher speicherbar.

## Relevante Dateien

- `sync.js` – MSAL, Tokenabruf und Microsoft Graph
- `storage.js` – lokale Speicherung
- `index.html` – Script-Ladereihenfolge
- `service-worker.js` – Offline-Cache
- `ARCHITECTURE.md` – technischer Gesamtüberblick

## Für die Fehlersuche hilfreich

Für eine konkrete Prüfung werden benötigt:

- genaue Fehlermeldung bzw. Microsoft-Fehlercode,
- verwendete Client-ID,
- eingetragene Redirect-URI,
- Tenant-ID bzw. Schul-Tenant,
- Information, ob Admin Consent für `Files.ReadWrite` zulässig ist,
- Information, ob die App-Registrierung von der Schule selbst verwaltet werden soll.

## Datenschutz / Datenfluss

Die regulären Lernstandsdaten verbleiben lokal im Browser. Eine Übertragung zu Microsoft erfolgt nur, wenn die Microsoft-/OneDrive-Funktion eingerichtet und genutzt wird. Die Sicherungsdatei wird im OneDrive des angemeldeten Kontos gespeichert.
