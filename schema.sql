PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('photo','story')),
  section TEXT,
  title TEXT NOT NULL,
  story TEXT NOT NULL DEFAULT '',
  submitter_name TEXT NOT NULL,
  submitter_email TEXT NOT NULL,
  consent INTEGER NOT NULL CHECK (consent=1),
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS submissions_status_created ON submissions(status, created_at);
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('joeys','cubs','scouts','venturers')),
  title TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  r2_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp')),
  original_name TEXT NOT NULL DEFAULT '',
  size_bytes INTEGER NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending','approved')) DEFAULT 'pending',
  created_at TEXT NOT NULL,
  approved_at TEXT
);
CREATE INDEX IF NOT EXISTS media_public_latest ON media(status, section, created_at DESC);
CREATE INDEX IF NOT EXISTS media_submission ON media(submission_id);
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'News',
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','published')) DEFAULT 'draft',
  published_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS articles_published ON articles(status, published_at DESC);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry ON admin_sessions(expires_at);
CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rate_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limits_key_created ON rate_limits(rate_key, created_at);
