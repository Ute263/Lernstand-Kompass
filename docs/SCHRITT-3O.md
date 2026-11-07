# Schritt 3o – Build-Reparatur / Konfiguration

## Geändert
- `scripts/build.js`: README optional beim Kopieren, Laufzeitdateien weiter Pflicht.
- `docs/WORKER-UND-BUILD-HINWEISE.md`: zwei unterschiedliche Cloudflare Worker nachvollziehbar dokumentiert.

## Unverändert
- App-/Kinder-/Druck-/Speicherlogik, Skript-Ladereihenfolge, D1-ID, `wrangler.jsonc`, beide Worker.
- Vollständige Dokumentation (`README.md`, `ARCHITECTURE.md`, `IT-SUPPORT.md`, `.gitignore`) bleibt in der ZIP.

## Offen
- Tatsächlich live geschaltete Worker-Konfiguration extern prüfen; keine Datei vorschnell entfernen.
- Erst in späteren getrennten Schritten bereinigen und zusammenführen.
