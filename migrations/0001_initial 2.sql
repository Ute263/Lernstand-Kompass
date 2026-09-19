CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active_school_year TEXT,
  join_code TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
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

CREATE TABLE IF NOT EXISTS teacher_accounts (
  id TEXT PRIMARY KEY,
  pin_hash TEXT NOT NULL,
  recovery_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  class_id TEXT,
  student_id TEXT,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workbook_catalog (
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

CREATE TABLE IF NOT EXISTS weekly_plans (
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

CREATE TABLE IF NOT EXISTS weekly_plan_statuses (
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

CREATE TABLE IF NOT EXISTS training_tasks (
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

CREATE TABLE IF NOT EXISTS training_completions (
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

CREATE TABLE IF NOT EXISTS sync_events (
  id TEXT PRIMARY KEY,
  class_id TEXT,
  student_id TEXT,
  actor_role TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_class ON weekly_plans(class_id);
CREATE INDEX IF NOT EXISTS idx_weekly_status_student ON weekly_plan_statuses(student_id);
CREATE INDEX IF NOT EXISTS idx_weekly_status_plan ON weekly_plan_statuses(plan_id);
CREATE INDEX IF NOT EXISTS idx_training_completions_student ON training_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_training_completions_class ON training_completions(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sync_events_class ON sync_events(class_id);
