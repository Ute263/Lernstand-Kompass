# Lernstand-Kompass

Bereinigter GitHub-Stand der App (v198). Enthalten sind nur die für Quellcode, Build und Cloudflare-Bereitstellung benötigten Dateien sowie Assets.

## Build

```bash
npm run build
```

Der Build erzeugt den Ordner `dist/`. Dieser Ordner wird nicht im Repository benötigt und kann bei jedem Deployment neu erzeugt werden.

## Cloudflare

Die Konfiguration liegt in `wrangler.jsonc`. Der Root-Worker ist `worker.js`; statische Assets werden nach dem Build aus `dist/` bereitgestellt. Die D1-Bindung `DB` ist in der Wrangler-Konfiguration eingetragen.

## Wichtiger offener Punkt

Die App kann mit dem privaten Microsoft-Konto arbeiten. Die Anmeldung/Speicherung über das schulische Microsoft-365-/OneDrive-Konto ist derzeit noch nicht zuverlässig nutzbar. Für den Schulkonten-Zugriff müssen insbesondere Microsoft-Entra-App-Registrierung, Tenant-/Admin-Freigabe, Redirect-URIs und Graph-/OneDrive-Berechtigungen mit der Schul-IT geprüft bzw. freigegeben werden.

## Nicht enthalten

Nicht enthalten sind die historischen `PAKET_*.md`-Dateien, alte Übergabe-/Umsetzungsdokumente, frühere Build-Ausgaben und sonstige Entwicklungsnotizen.
