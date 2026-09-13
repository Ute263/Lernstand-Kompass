# Paket 10c – Wochenansicht bleibt erhalten

Fehler:
Der neue Wert `planningMode` wurde zwar im Wochenplan gespeichert,
aber bei `normalizeState()` / `normalizeWeeklyPlan()` nicht wieder übernommen.
Da jeder Speichervorgang den Zustand normalisiert, wurde `week` danach
wieder zu `days`.

Behoben:
- `planningMode: week` wird bei der Wochenplan-Normalisierung erhalten.
- Die Auswahl „Ganze Woche“ bleibt nach Änderungen bestehen.
- Sie bleibt auch nach Speichern, erneutem Öffnen und Seiten-Neuladen erhalten.
- Tagespläne bleiben weiterhin Tagespläne.
- Keine Änderung an Aufgaben, Sternchen, Drucklayouts oder Zielgruppen.

Hinweis:
Wochenpläne, die während des Fehlers bereits als Tagesplan gespeichert wurden,
können nicht sicher automatisch als frühere Wochenpläne erkannt werden.
Bei diesen einmal „Ganze Woche“ neu auswählen und speichern.

Cache-Version: v130
