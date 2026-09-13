# Paket 3i – Dist-Fix

Ursache:
Der Mehrzahl-Fix war im Hauptordner vorhanden, aber Cloudflare liefert in diesem
Projekt den Ordner `dist` aus. In `dist` fehlte `nomen-plural-flex.js`.

Damit war die neue Logik im Browser nicht aktiv.

Nach diesem Paket gilt:
- "Jungen" = richtig
- "die Jungen" = richtig
- Groß-/Kleinschreibung wird bei der Mehrzahlprobe nicht bewertet

Enthalten sind außerdem die Aktivitätsanzeige und die aktuellen QR-/Feedback-
Helfer auch in `dist`, damit dort keine neuen Skripte mehr fehlen.

Cache-Version: v92
