# D1-Umsetzungsplan fuer den Lernstand-Kompass

Stand: 14.07.2026

Dieser Plan beschreibt den naechsten technischen Umbau des Lernstand-Kompass: von einer rein lokalen Browser-App zu einer Cloudflare-App mit zentraler Synchronisierung ueber Cloudflare D1. Die bestehende lokale Speicherung soll dabei nicht entfernt, sondern als Offline-Zwischenspeicher erhalten bleiben.

## 1. Aktueller technischer Stand

Die App laeuft als statische Web-App. Sie wird lokal im Browser ausgefuehrt und speichert den gesamten Zustand aktuell in einem lokalen Datenobjekt.

Lokaler Speicher:

- bevorzugt `IndexedDB`
- Rueckfall auf `localStorage`
- Datenbankname: `ArbeitsheftKompassDB`
- Object Store: `appState`
- lokale Klasse: `AppStorage` in `storage.js`

Die zentrale Zustandsstruktur entsteht in `models.js` ueber:

- `emptyState()`
- `createInitialState(...)`
- `normalizeState(candidate)`

Aktuelle Hauptdaten im lokalen State:

- `classes`
- `animals`
- `animalGroups`
- `materials`
- `entries`
- `goals`
- `assessments`
- `assessmentTasks`
- `assessmentResults`
- `sprachweltTasks`
- `trainingTasks`
- `trainingCompletions`
- `trainingHistory`
- `workbookCatalog`
- `workbookAssignments`
- `workbookAssignmentStatuses`
- `childWorkbookReports`
- `activeWorkbookMaterials`
- `weeklyPlans`
- `weeklyPlanStatuses`
- `progressSettings`
- `childViewSettings`
- `teacherShowFirstNames`
- `qrScannerEnabled`
- `multiDeviceReminderEnabled`
- `multiDeviceReminderTime`

Wichtige Konsequenz:

Kindergeraete und Lehrergeraet haben aktuell getrennte lokale Daten. Ein QR-Code kann die App oeffnen, aber Eingaben werden noch nicht zentral an die Lehrkraft uebertragen.

## 2. Zielbild

Ziel ist eine hybride Speicherung:

```text
Kindergeraet
  -> lokale Queue in IndexedDB
  -> Cloudflare Worker API
  -> Cloudflare D1
  -> Lehrerbereich liest denselben Stand
```

Die App soll weiterhin offline-freundlich bleiben:

- Eingaben werden zuerst lokal zwischengespeichert.
- Danach werden sie an D1 uebertragen.
- Die Oberflaeche zeigt den Sync-Status.
- Bei Netzproblemen bleiben Eingaben auf dem Geraet erhalten und koennen spaeter erneut gesendet werden.

## 3. Grundsaetze fuer Datenschutz und Rollen

Die zentrale Datenbank darf nicht unnoetig personenbezogen werden.

Vorgaben:

- keine vollstaendigen Kindernamen in D1 als Standard
- Tierkonten oder anonyme IDs verwenden
- optionale interne Zuordnung nur fuer Lehrkraft
- Kinder duerfen nur eigene Daten lesen
- Kinder duerfen nur erlaubte eigene Statusfelder schreiben
- Lehrerbereich getrennt schuetzen
- PINs niemals im Klartext speichern
- keine Secrets im GitHub-Code
- Cloudflare Secrets fuer geheime Werte nutzen

## 4. Cloudflare-Grundlage

Die App ist als Cloudflare Worker mit statischen Assets vorgesehen.

Die Datei `wrangler.jsonc` muss im Repository bleiben:

```json
{
  "name": "lernstand-kompass",
  "compatibility_date": "2026-07-14",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
```

Build:

```text
npm run build
```

Deployment:

```text
npx wrangler deploy
```

## 5. Empfohlene neue Projektdateien

Fuer den D1-Umbau sollten diese Dateien ergaenzt werden:

```text
worker.js
migrations/0001_initial.sql
migrations/0002_indexes.sql
sync-api.js
sync-client.js
auth.js
```

Moegliche Aufteilung:

- `worker.js`: Cloudflare Worker, Routing, statische Assets, API
- `migrations/*.sql`: D1-Tabellen und Indizes
- `auth.js`: Hashing, Token, Rollenpruefung
- `sync-api.js`: API-Helfer fuer Datenbankzugriffe
- `sync-client.js`: Browser-Client fuer Sync, Queue, Statusanzeigen

## 6. D1-Binding

Nach dem Anlegen der D1-Datenbank muss `wrangler.jsonc` erweitert werden.

Beispiel:

```json
{
  "name": "lernstand-kompass",
  "compatibility_date": "2026-07-14",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "lernstand-kompass-db",
      "database_id": "HIER_DIE_CLOUDFLARE_DATABASE_ID"
    }
  ]
}
```

Die echte `database_id` wird von Cloudflare vergeben und darf nicht geraten werden.

## 7. Datenbankschema Phase 1

Phase 1 sollte nur die noetigen Tabellen fuer Klassen, Tierkonten, Wochenplan und Status enthalten. Lernzielkontrollen und Exporte koennen danach folgen.

### Tabelle `classes`

```sql
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active_school_year TEXT,
  join_code TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Tabelle `students`

```sql
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  animal_name TEXT NOT NULL,
  animal_emoji TEXT,
  anonymous_label TEXT,
  pin_hash TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);
```

### Tabelle `teacher_accounts`

```sql
CREATE TABLE teacher_accounts (
  id TEXT PRIMARY KEY,
  pin_hash TEXT NOT NULL,
  recovery_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Tabelle `sessions`

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  class_id TEXT,
  student_id TEXT,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### Tabelle `workbook_catalog`

```sql
CREATE TABLE workbook_catalog (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  school_year TEXT,
  workbook TEXT NOT NULL,
  part TEXT,
  area TEXT,
  category TEXT,
  start_page INTEGER,
  end_page INTEGER,
  page_label TEXT,
  title TEXT,
  competence TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);
```

### Tabelle `weekly_plans`

```sql
CREATE TABLE weekly_plans (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  title TEXT NOT NULL,
  week_label TEXT,
  valid_from TEXT,
  valid_to TEXT,
  assignment_mode TEXT,
  note TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);
```

Hinweis: `payload_json` kann in Phase 1 die vorhandene komplexe Wochenplanstruktur aufnehmen. Spaeter kann sie normalisiert werden.

### Tabelle `weekly_plan_statuses`

```sql
CREATE TABLE weekly_plan_statuses (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  day TEXT NOT NULL,
  field TEXT NOT NULL,
  status TEXT NOT NULL,
  marked_by_child INTEGER NOT NULL DEFAULT 0,
  review_status TEXT NOT NULL DEFAULT 'wartet',
  progress_linked INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  confirmed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (plan_id) REFERENCES weekly_plans(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

### Tabelle `training_tasks`

```sql
CREATE TABLE training_tasks (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  area TEXT NOT NULL,
  subcategory TEXT,
  subject TEXT,
  title TEXT NOT NULL,
  text TEXT,
  symbol TEXT,
  payload_json TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Tabelle `training_completions`

```sql
CREATE TABLE training_completions (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  task_code TEXT NOT NULL,
  training_area TEXT,
  subcategory TEXT,
  subject TEXT,
  task_title TEXT,
  task_text TEXT,
  status TEXT NOT NULL DEFAULT 'bearbeitet',
  completed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

### Tabelle `sync_events`

```sql
CREATE TABLE sync_events (
  id TEXT PRIMARY KEY,
  class_id TEXT,
  student_id TEXT,
  actor_role TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

Diese Tabelle ist wichtig fuer Nachvollziehbarkeit und Konfliktloesung.

## 8. Indizes

Empfohlene Indizes:

```sql
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_weekly_plans_class ON weekly_plans(class_id);
CREATE INDEX idx_weekly_status_student ON weekly_plan_statuses(student_id);
CREATE INDEX idx_weekly_status_plan ON weekly_plan_statuses(plan_id);
CREATE INDEX idx_training_completions_student ON training_completions(student_id);
CREATE INDEX idx_training_completions_class ON training_completions(class_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sync_events_class ON sync_events(class_id);
```

## 9. API-Endpunkte Phase 1

### Healthcheck

```text
GET /api/health
```

Antwort:

```json
{ "ok": true, "db": "connected" }
```

### Kinderlogin

```text
POST /api/student/login
```

Eingabe:

```json
{
  "classCode": "2C-2026",
  "animal": "fuchs",
  "pin": "1234"
}
```

Antwort:

```json
{
  "token": "...",
  "student": {
    "id": "...",
    "animalName": "Fuchs",
    "animalEmoji": "🦊"
  }
}
```

### Eigene Kinderansicht laden

```text
GET /api/student/me
```

Liefert:

- eigenes Tierkonto
- aktuelle Wochenplaene
- eigene Wochenplan-Status
- eigene Trainingsbearbeitungen
- freigegebene Aufgaben

### Wochenplan-Aufgabe markieren

```text
POST /api/student/weekly-status
```

Eingabe:

```json
{
  "planId": "...",
  "day": "Montag",
  "field": "Deutsch0",
  "status": "fertig"
}
```

Server prueft:

- Token ist Kinderrolle
- `planId` gehoert zur Klasse
- Aufgabe gehoert zu diesem Kind
- Status ist erlaubt

### Trainingsaufgabe starten

```text
POST /api/student/training-completion
```

Eingabe:

```json
{
  "taskCode": "E-01"
}
```

Server prueft:

- Aufgabe ist aktiv
- Kind darf Aufgabe sehen
- AntonApp-Sperre von 28 Tagen
- doppelte Bearbeitungen vermeiden

### Lehrerlogin

```text
POST /api/teacher/login
```

### Lehrer-Dashboard

```text
GET /api/teacher/dashboard
```

Liefert fuer Phase 1:

- Klassen
- Tiere
- Wochenplaene
- offene Kindmeldungen
- Trainingsbearbeitungen
- Wochenplanstatus

### Wochenplan speichern

```text
POST /api/teacher/weekly-plans
```

### Kindmeldung bestaetigen

```text
POST /api/teacher/weekly-status/:id/confirm
```

## 10. Sync-Client im Browser

Die aktuelle Funktion `persist(...)` speichert lokal. Sie sollte nicht sofort ersetzt werden. Stattdessen wird eine Sync-Schicht ergaenzt.

Empfohlen:

```text
persist lokal speichern
-> syncEvent in lokale Queue schreiben
-> wenn online: Queue an API senden
-> bei Erfolg: syncStatus aktualisieren
```

Neue lokale Felder:

```js
syncQueue: [],
syncStatus: {
  online: true,
  pendingCount: 0,
  lastSyncAt: "",
  lastError: ""
}
```

Sichtbare Status:

- lokal gespeichert
- wird uebertragen
- synchronisiert
- noch nicht synchronisiert
- keine Internetverbindung
- Uebertragung fehlgeschlagen

## 11. Migration bestehender lokaler Daten

Vor der Migration:

1. Gesamtbackup erstellen.
2. Backup-Datei sicher ablegen.
3. Aktuellen lokalen Stand nicht loeschen.

Migration:

1. Lokalen State aus `AppStorage.load()` lesen.
2. `normalizeState(...)` anwenden.
3. Klassen und Tiere anzeigen.
4. Lehrkraft bestaetigt, was uebernommen wird.
5. Daten in D1 schreiben.
6. Ergebnis anzeigen.
7. Danach D1 als Hauptspeicher aktivieren.

Wichtig: Die Migration darf nicht automatisch im Hintergrund passieren.

## 12. Reihenfolge der Umsetzung

### Phase 0: jetzigen Stand sichern

- ZIP erstellen
- JSON-Backup aus der App erstellen
- GitHub-Stand sichern
- GitHub Pages als Rueckfall behalten

### Phase 1: Cloudflare-D1-Grundlage

- D1-Datenbank in Cloudflare anlegen
- Binding in `wrangler.jsonc` eintragen
- Migration `0001_initial.sql`
- Test-Endpunkt `/api/health`
- lokaler/Cloudflare-Test

### Phase 2: Authentifizierung

- Lehrerlogin
- Kinderlogin
- Session-Tokens
- PIN-Hashing
- Rollenpruefung

### Phase 3: Kinder-Sync minimal

- Kind laedt eigenen Wochenplan aus D1
- Kind markiert Aufgabe als `teilweise` oder `fertig`
- Kind startet Trainingsaufgabe
- Lehrerbereich sieht Eintraege nach Aktualisierung

### Phase 4: Lehrerbereich zentralisieren

- Klassen/Tiere aus D1 laden
- Wochenplaene in D1 speichern
- Statusuebersicht aus D1 laden
- Kindmeldungen bestaetigen

### Phase 5: Offline-Warteschlange

- lokale Queue
- Retry
- Statusanzeige
- Konfliktregeln

### Phase 6: Datenmigration

- bestehende lokale Daten kontrolliert in D1 uebernehmen
- Testlauf mit Kopie
- erst danach produktiv nutzen

### Phase 7: Abnahmetests

Testfaelle:

- Lehrergeraet erstellt Wochenplan
- Kindergeraet A sieht nur Kind A
- Kindergeraet B sieht nur Kind B
- Kind A markiert Aufgabe
- Lehrerbereich sieht Kind-A-Status
- Kind B sieht Kind-A-Status nicht
- AntonApp ist nach Bearbeitung 28 Tage gesperrt
- Offline-Eingabe bleibt lokal erhalten
- Online-Rueckkehr synchronisiert
- Browser neu laden verliert keine offenen Eingaben
- falsche PIN wird abgelehnt
- Kinderrolle kann Lehrer-API nicht aufrufen

## 13. Nicht sofort umstellen

Folgende Bereiche sollten erst nach dem minimalen Wochenplan-/Trainings-Sync zentralisiert werden:

- Lernzielkontrollen
- Excel-Export mit zentralen Daten
- vollstaendige Materialverwaltung
- komplexe Migration aller historischen Eintraege
- Echtzeit-Updates

Grund: Zuerst muss die Kernfrage funktionieren: Kind traegt ein, Lehrkraft sieht es.

## 14. Naechster konkreter Codex-Auftrag

```text
Pruefe den aktuellen Lernstand-Kompass-Code und implementiere Phase 1 fuer Cloudflare D1:

1. Lege eine D1-Migration `migrations/0001_initial.sql` mit den Tabellen fuer classes, students, teacher_accounts, sessions, workbook_catalog, weekly_plans, weekly_plan_statuses, training_tasks, training_completions und sync_events an.
2. Erweitere `wrangler.jsonc` um ein D1-Binding mit Platzhalter fuer die Cloudflare database_id.
3. Erstelle einen Worker/API-Einstieg, der statische Assets weiter aus `dist` ausliefert und zusaetzlich `/api/health` bereitstellt.
4. `/api/health` soll pruefen, ob D1 erreichbar ist.
5. Veraendere die App-Logik noch nicht grossflaechig.
6. Fuehre Build- und Syntaxpruefungen aus.
7. Erstelle danach eine neue Upload-ZIP.
```

