# Paket 9h – doppelte Aufgaben + Fächer im Wochenplan

## Behoben
- Identische Heftaufgaben erscheinen nicht mehr doppelt.
- Ursache: ältere Einzel-Felder und neue Mehrfach-Felder konnten dieselbe Aufgabe parallel liefern.
- Bewusst doppelt gewählte Aufgaben bleiben erhalten, wenn sie sich z. B. durch ⭐, Nummer oder Freitext unterscheiden.

## Druckreihenfolge pro Tag
1. 📘 Deutsch
2. 🔢 Mathe
3. ✏️ freie/sonstige Aufgaben

Mathe steht damit im selben Tagesfeld direkt unter den Deutschaufgaben.

## Facherkennung
Die Druckvorlage erkennt das Fach nun sowohl über:
- `item.subject`
- als auch über `item.label`
- und notfalls über das Fach des Katalogeintrags.

Dadurch wird eine Deutsch-Heftseite nicht mehr fälschlich mit ✏️ dargestellt.

## Optik
Im Ausdruck steht nur das klare Fachsymbol vor der Aufgabe:
- 📘 Deutsch
- 🔢 Mathe
- ✏️ freie Aufgabe

Der eigentliche Aufgabentext bleibt groß und übersichtlich.

Cache-Version: v109
