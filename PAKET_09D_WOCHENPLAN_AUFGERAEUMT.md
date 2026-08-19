# Paket 9d – Wochenplan aufgeräumt

Dieses Paket enthält **Paket 9b und 9c bereits mit**.

## Was geändert wurde

### 1. Hefte statt endloser Seitenliste
Im Bereich **Wochenplan → Hefte** wird jedes Arbeitsheft nur noch als eine kompakte Karte angezeigt.

Die einzelnen Seiten sind standardmäßig **eingeklappt**.
Nur über „Seiten und Themen anzeigen“ werden sie sichtbar.

### 2. Neues Heft wirklich als Heft anlegen
„+ Neues Heft“ öffnet jetzt ein eigenes, kleines Formular:

- Fach
- Schuljahr
- Name des Heftes
- Teil optional
- erste Seite
- letzte Seite

Danach erzeugt die App die auswählbaren Seiten automatisch.
Bereits vorhandene Seiten werden nicht doppelt angelegt.

Über „+ Seiten / Teil ergänzen“ kann ein vorhandenes Heft später erweitert werden.

### 3. Wochenplan-Auswahl deutlich ruhiger
Beim Auswählen einer Aufgabe läuft es jetzt so:

**Heft → Teil → Seitenbereich → Seite**

Es werden maximal ungefähr **20 Seiten gleichzeitig** gezeigt.
Keine lange Liste aller Seiten mehr.

Eine bereits gewählte Seite kann weiterhin noch einmal gewählt werden:
Sie wird dann als **⭐ Zusatzaufgabe** eingetragen (Paket 9c).

### 4. Aktuelle Woche ruhiger
Der große Bearbeitungsstand der Kinder ist auf der Seite „Diese Woche“ jetzt eingeklappt
und wird nur geöffnet, wenn er gebraucht wird.

## Technisch
Neu:
- `weekly-ui-cleanup.js`
- `dist/weekly-ui-cleanup.js`

Geändert:
- `index.html`
- `dist/index.html`
- `scripts/build.js`
- `service-worker.js`
- `dist/service-worker.js`

Cache-Version: **v105**
