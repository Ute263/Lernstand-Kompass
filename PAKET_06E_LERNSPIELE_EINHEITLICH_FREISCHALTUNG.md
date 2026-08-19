# Paket 6e – Lernspiele einheitlich + Freischaltung

## Lehrkraftansicht
Alle Lernspiele sind jetzt gleichberechtigt angeordnet:
- Nomen
- Verben
- Adjektive
- Wortarten-Mix
- Einmaleins
- Kopfrechnen

Es wird immer nur die Auswertung des gewählten Spiels angezeigt. Dadurch wird die Seite deutlich kürzer.

Bei Nomen gibt es innerhalb des Tabs nur noch die kleine Umschaltung:
- Ergebnisse
- Aktivität / Abbrüche

Der große leere Detail-Platzhalter wurde entfernt. Tabellen haben eine begrenzte Höhe und scrollen bei Bedarf innerhalb des Panels.

## Spiele freischalten
Oben im Bereich Lernspiele gibt es einen einklappbaren Abschnitt **Spiele freischalten**.
Jedes der sechs Spiele kann einzeln ein- oder ausgeschaltet werden.

Die Einstellung wird in `childViewSettings.learningGames` gespeichert. Der vorhandene Kinder-Sync überträgt `childViewSettings` bereits an die Kindergeräte, deshalb ist keine neue Datenbankstruktur nötig.

Gesperrte Spiele:
- sind auf der Kinder-Auswahlseite unsichtbar
- bleiben in der Lehrkraftauswertung mit vorhandenen historischen Ergebnissen erhalten

Standard: Wenn noch keine Einstellung gespeichert wurde, sind alle Spiele freigeschaltet.

## Technisch
Geändert:
- `learning-games-plus.js`
- `dist/learning-games-plus.js`
- `service-worker.js`
- `dist/service-worker.js`

Cache-Version: v99
