CREATE TABLE IF NOT EXISTS learning_sessions (
  bucket TEXT NOT NULL,
  id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  payload TEXT NOT NULL,
  PRIMARY KEY (bucket, id)
);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_bucket_created
  ON learning_sessions (bucket, created_at);
