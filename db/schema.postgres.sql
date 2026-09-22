-- Bontraco schema.
--
-- Every tenant-owned row carries org_id. Nothing is queried without it: the
-- data-access layer in lib/server/repo.ts takes an org context and binds it
-- into every statement, so a missing tenant filter is a compile error rather
-- than a silent cross-tenant read.
--
-- Postgres (Supabase). Ids are TEXT so they stay readable in logs and URLs;
-- timestamps are TIMESTAMPTZ; the integer booleans SQLite needed are now
-- real BOOLEANs.


CREATE TABLE IF NOT EXISTS orgs (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  org_id        TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  name          TEXT NOT NULL,
  initials      TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member',   -- owner | admin | member
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email)
);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,           -- random; the cookie carries a signed form of this
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id      TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- A playbook is the org's negotiating position, one row per issue.
CREATE TABLE IF NOT EXISTS playbooks (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_playbooks_org ON playbooks(org_id);

CREATE TABLE IF NOT EXISTS playbook_positions (
  id            TEXT PRIMARY KEY,
  playbook_id   TEXT NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  org_id        TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  category      TEXT NOT NULL,
  title         TEXT NOT NULL,
  standard      TEXT NOT NULL,   -- the position we open with
  fallback      TEXT,            -- what we will accept
  walk_away     TEXT,            -- what we will not accept
  severity      TEXT NOT NULL DEFAULT 'medium',  -- how bad a deviation is
  sort_order    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_positions_playbook ON playbook_positions(playbook_id);

CREATE TABLE IF NOT EXISTS contracts (
  id              TEXT PRIMARY KEY,
  org_id          TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  ref             TEXT NOT NULL,
  title           TEXT NOT NULL,
  counterparty    TEXT NOT NULL,
  type            TEXT NOT NULL,
  status          TEXT NOT NULL,
  value           INTEGER NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  owner_user_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  department      TEXT NOT NULL DEFAULT '',
  effective_date  DATE,
  expiry_date     DATE,
  renewal_notice  INTEGER NOT NULL DEFAULT 0,
  auto_renew      BOOLEAN NOT NULL DEFAULT false,
  governing_law   TEXT NOT NULL DEFAULT '',
  risk            TEXT NOT NULL DEFAULT 'low',
  risk_score      INTEGER NOT NULL DEFAULT 0,
  ai_confidence   INTEGER NOT NULL DEFAULT 0,
  pages           INTEGER NOT NULL DEFAULT 0,
  summary         TEXT NOT NULL DEFAULT '',
  tags            TEXT NOT NULL DEFAULT '[]',     -- JSON array
  source          TEXT NOT NULL DEFAULT 'seed',   -- seed | upload
  analyzed_by     TEXT,                           -- model id, or 'heuristic'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, ref)
);
CREATE INDEX IF NOT EXISTS idx_contracts_org ON contracts(org_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org_expiry ON contracts(org_id, expiry_date);

CREATE TABLE IF NOT EXISTS clauses (
  id            TEXT PRIMARY KEY,
  org_id        TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  contract_id   TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL,
  risk          TEXT NOT NULL,
  deviation     INTEGER NOT NULL DEFAULT 0,
  excerpt       TEXT NOT NULL DEFAULT '',
  finding       TEXT NOT NULL DEFAULT '',
  suggestion    TEXT NOT NULL DEFAULT '',
  page          INTEGER NOT NULL DEFAULT 1,
  position_id   TEXT REFERENCES playbook_positions(id) ON DELETE SET NULL,
  accepted      BOOLEAN NOT NULL DEFAULT false,
  sort_order    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_clauses_contract ON clauses(contract_id);

CREATE TABLE IF NOT EXISTS documents (
  id            TEXT PRIMARY KEY,
  org_id        TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  contract_id   TEXT REFERENCES contracts(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  mime          TEXT NOT NULL,
  bytes         INTEGER NOT NULL,
  sha256        TEXT NOT NULL,
  storage_key   TEXT NOT NULL,
  page_count    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(org_id);

-- Extracted page text, kept so a finding can cite a page without re-parsing.
CREATE TABLE IF NOT EXISTS document_pages (
  id            TEXT PRIMARY KEY,
  org_id        TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  document_id   TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page          INTEGER NOT NULL,
  text          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pages_document ON document_pages(document_id);

CREATE TABLE IF NOT EXISTS jobs (
  id            TEXT PRIMARY KEY,
  org_id        TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL,                  -- analyze_contract
  status        TEXT NOT NULL,                  -- queued | running | done | failed
  step          TEXT NOT NULL DEFAULT '',
  progress      INTEGER NOT NULL DEFAULT 0,
  document_id   TEXT REFERENCES documents(id) ON DELETE CASCADE,
  contract_id   TEXT REFERENCES contracts(id) ON DELETE CASCADE,
  error         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at  TIMESTAMPTZ,
  finished_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_jobs_org ON jobs(org_id);

CREATE TABLE IF NOT EXISTS obligations (
  id              TEXT PRIMARY KEY,
  org_id          TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  contract_id     TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  owner_user_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  due_date        DATE NOT NULL,
  recurrence      TEXT NOT NULL DEFAULT 'one_time',
  status          TEXT NOT NULL DEFAULT 'upcoming',
  category        TEXT NOT NULL DEFAULT 'Other'
);
CREATE INDEX IF NOT EXISTS idx_obligations_org ON obligations(org_id);

-- The audit trail the security section promises. Append-only by convention:
-- nothing in the app issues UPDATE or DELETE against it.
CREATE TABLE IF NOT EXISTS audit_log (
  id            TEXT PRIMARY KEY,
  org_id        TEXT NOT NULL,
  user_id       TEXT,
  action        TEXT NOT NULL,
  subject_type  TEXT NOT NULL DEFAULT '',
  subject_id    TEXT NOT NULL DEFAULT '',
  meta          TEXT NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_log(org_id, created_at);
