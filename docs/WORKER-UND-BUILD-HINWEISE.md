# Worker- und Build-Zuordnung (Schritt 3o)

- `wrangler.jsonc` im Projektstamm enthält `main: "./worker.js"` und `assets.directory: "./dist"`. Dieser Root-Worker bedient `/api/health` und leitet sonst an die statischen Assets weiter. Dies ist die **im Projekt konfigurierte** Wrangler-Zuordnung, kein Nachweis des tatsächlich produktiv aktiven Deployments.
- `cloudflare-worker/worker.js` besitzt andere Endpunkte (`/health`, `/v1/sessions`) für verschlüsselten Klassen-Sync. `cloudflare-worker/wrangler.toml.example` ist eine separate Beispielkonfiguration. Beide Worker sind **nicht austauschbar**.
- Keiner der beiden Worker wurde gelöscht oder verändert. Vor einer Zusammenführung muss außerhalb der lokalen Testumgebung geprüft werden, welcher Worker wo deployed wird.
- `README.md` bleibt Bestandteil des vollständigen Quellprojekts; für den `dist`-Build ist sie jetzt optional. Alle tatsächlich benötigten Laufzeitdateien werden weiterhin über `scripts/build.js` validiert.
- Die D1-ID in `wrangler.jsonc` ist in dieser Version unverändert.
- **Keine produktiven Deployments während dieses Schritts.**
