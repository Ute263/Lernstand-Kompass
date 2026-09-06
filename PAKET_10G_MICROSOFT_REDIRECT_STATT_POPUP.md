# Paket 10g – Microsoft-Anmeldung ohne Popups

Auslöser:
- Auf dem Mac beendet sich Chrome reproduzierbar genau beim Microsoft-Login.
- Neuinstallation von Chrome ändert das Verhalten nicht.
- Die App verwendete `loginPopup`, `acquireTokenPopup` und `logoutPopup`.

Änderung:
- Microsoft-Anmeldung vollständig auf Redirect-Flow umgestellt.
- Beim Klick auf „Mit Microsoft verbinden“ wechselt das aktuelle Browserfenster
  zu Microsoft und kehrt anschließend zum Lernstand-Kompass zurück.
- Kein zusätzliches Authentifizierungsfenster / Popup wird mehr erzeugt.
- Rückkehr wird mit `handleRedirectPromise()` verarbeitet.
- Token-Erneuerung verwendet bei notwendiger Interaktion `acquireTokenRedirect`
  statt `acquireTokenPopup`.
- Abmeldung verwendet `logoutRedirect` statt `logoutPopup`.
- Der angemeldete Account und OneDrive-Status werden nach der Rückkehr gespeichert.
- Der OneDrive-Zugriff wird nach erfolgreicher Anmeldung geprüft.

Baut auf Paket 10f auf.
Cache-Version: v134
