# Synchronisationsarchitektur

Der Lernstand-Kompass verwendet zwei getrennte Synchronisationswege.

## 1. Kindergeräte – Cloudflare

Kindergeräte speichern Eingaben immer zuerst lokal. Anschließend wird der verschlüsselte Kinderstand über den eingerichteten Cloudflare-Sync übertragen.

Reihenfolge:

`Kindergerät → Cloudflare → Lehrkraftgerät`

Der Kinderstand umfasst die für das Kind relevanten Lern- und Arbeitsdaten, insbesondere Lernstandseinträge, Wochenplanstatus, Arbeitsheftstatus, Kindmeldungen, Trainingsabschlüsse und Lernspielsitzungen.

Vor dem Schreiben liest ein Kindergerät einen bereits vorhandenen Stand desselben Kindes und führt neuere Datensätze bzw. Seitenstatus zusammen. Dadurch überschreiben zwei Kindergeräte desselben Kindes nicht mehr blind den jeweils anderen vollständigen Stand.

## 2. Lehrkraftgeräte – OneDrive

MacBook und iPad gleichen den vollständigen Lehrkraft-Datenstand über OneDrive ab.

Reihenfolge des automatischen Abgleichs:

1. lokal speichern
2. etwa vier Sekunden Ruhezeit abwarten
3. neue Kinderstände von Cloudflare abrufen
4. lokal zusammenführen und persistieren
5. aktuellen OneDrive-Stand lesen
6. lokalen und Cloud-Stand zusammenführen
7. mit dem zuvor gelesenen OneDrive-ETag zurückschreiben

Wenn OneDrive zwischen Lesen und Schreiben von einem anderen Gerät geändert wurde, wird der Upload nicht blind fortgesetzt. Die App lädt den neuen Cloud-Stand erneut, führt ihn zusammen und versucht den Schreibvorgang mit dem neuen ETag erneut.

## Gelöschte Wochenpläne

Gelöschte Wochenpläne werden nicht sofort physisch aus dem Datenbestand entfernt. Sie erhalten einen Löschstatus mit Zeitstempel (`active: false`, `deletedAt`). Dieser sogenannte Tombstone wird mit synchronisiert. Dadurch kann ein alter Cloud-Stand einen bewusst gelöschten Plan nicht wiederherstellen.

## Backups

Gesamtbackups bleiben unabhängig vom automatischen Sync verfügbar. Bei einer Wiederherstellung wird der Datenstand lokal gespeichert und anschließend erneut gelesen und geprüft. Eine Wiederherstellung soll nicht durch einen unmittelbar folgenden unkontrollierten Cloud-Schreibvorgang überschrieben werden.
