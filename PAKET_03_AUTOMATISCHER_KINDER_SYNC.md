# Paket 3 – Automatischer Kinder-Sync

## Neu

- Neue QR-Karten öffnen den Lernstand-Kompass direkt auf dem Kindergerät.
- Auf einem frischen Gerät wird nur das zugehörige Tier mit den freigegebenen Inhalten eingerichtet.
- Der Microsoft-Account und der Klassen-Sync-Code bleiben auf dem Lehrkraftgerät.
- Kindänderungen werden zuerst lokal gespeichert und danach automatisch verschlüsselt an Cloudflare gesendet.
- Erfasst werden Nomen-Probe, Wochenplan-Markierungen, Deutsch/Mathe-Zuweisungen, Kindmeldungen, Trainingsbearbeitungen und normale Lernstand-Einträge.
- Bei fehlendem Internet bleiben Änderungen lokal und werden später erneut gesendet.
- Das Lehrkraftgerät ruft neue Kindmeldungen beim Öffnen und danach automatisch etwa alle 30 Sekunden ab.
- Kindergeräte aktualisieren ihre freigegebenen Pläne und Aufgaben regelmäßig automatisch.

## Datenschutz

- Keine Vornamen werden an den Kinder-Sync übertragen.
- Jeder Kinder-Datensatz wird im Browser mit dem individuellen Tier-Zugang AES-GCM-verschlüsselt.
- Der Cloudflare-Worker sieht nur Hash-Buckets und verschlüsselte Nutzdaten.
- Der eigentliche Klassen-Sync-Code wird nicht an Kindergeräte verteilt.

## Nach dem Upload

1. Lernstand-Kompass als Lehrkraft einmal öffnen und einige Sekunden geöffnet lassen.
2. Unter Klassenverwaltung → QR-Zugänge neue QR-Karten drucken. Die bisherigen QR-Karten enthalten noch nicht den direkten Web-Zugang.
3. Eine neue Karte mit einem anderen Gerät scannen. Das Tier sollte direkt in „Meine Lernreise“ landen.
4. Testweise eine Wochenplan-Aufgabe markieren oder die Nomen-Probe beenden.
5. Auf dem Lehrkraftgerät erscheint die Meldung automatisch; spätestens nach etwa 30 Sekunden bzw. beim Zurückkehren in die App.

Der bestehende Lernpost-Export bleibt als Fallback erhalten, ist auf automatisch eingerichteten Kindergeräten aber nicht mehr nötig.
