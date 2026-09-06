# Paket 10f – Microsoft-/OneDrive-Einrichtung repariert

Gefundener Fehler:
- Die vereinfachte Kolleginnen-Oberfläche blendet Client-ID und Redirect-Felder aus.
- „Mit Microsoft verbinden“ benutzte trotzdem die alte Verbindungsroutine, die
  diese Felder ausliest.
- Die alte Routine fing Anmeldefehler intern ab. Danach konnte die Oberfläche
  sogar Erfolg melden, obwohl kein Konto verbunden war.

Behoben:
- direkte Anmeldung über die gemeinsame Lernstand-Kompass-Appregistrierung
- keine versteckten Formularfelder mehr erforderlich
- `common` für persönliche und Organisationskonten
- Redirect-URL wird immer auf die tatsächlich geöffnete App-Adresse gesetzt
- eine alte Redirect-URL aus früheren Deployments wird automatisch korrigiert
- Erfolg erst, wenn wirklich ein Microsoft-Konto zurückgegeben wurde
- danach wird zusätzlich echter OneDrive-Zugriff geprüft
- Popup-, Berechtigungs-, Netzwerk- und OneDrive-Fehler werden sichtbar gemeldet
- MSAL wird bereits beim Start vorbereitet, damit der Login-Popup zuverlässiger öffnet

Baut auf Paket 10e auf.
Cache-Version: v133
