# Schritt 3f – lokale Testversion

Diese Fassung basiert auf der vollständigen Original-App und bewahrt die unveränderte Wochenplan-, Druck- und Speicherlogik.

## Änderungen
- Deutsch und Mathematik im Wochen-/Tageseditor untereinander, jeweils volle Breite.
- Tierauswahl erst nach Öffnen der zugehörigen Auswahlliste.
- Arbeitsheftdialog: schließbar über X, Fertig, Escape und Klick auf den abgedunkelten Hintergrund.
- Überlagerte doppelte Arbeitsheftdialoge werden entfernt.
- Keine Änderung der Datenformate, Druckansichten oder Kinderoberfläche.

## Start Mac
1. In der bisherigen Terminal-Sitzung **Control+C** drücken, Terminal schließen.
2. ZIP entpacken und Ordner außerhalb von GitHub ablegen.
3. `start-local.command` im neuen Ordner doppelt anklicken (gegebenenfalls Rechtsklick > Öffnen).
4. Terminal offen lassen. In Chrome `http://localhost:8770` aufrufen.
5. Wenn noch eine alte Ansicht erscheint: **Command+Shift+R**, keine Browserdaten löschen.
6. Zum Beenden im Terminal **Control+C**.

**Achtung:** Nur Testdaten verwenden. Nicht auf GitHub oder Cloudflare veröffentlichen.
