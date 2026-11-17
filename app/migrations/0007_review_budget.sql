-- Provider usage metadata only. No rejected text, account IDs or room IDs.
CREATE TABLE community_review_budgets (
 bucket TEXT PRIMARY KEY, reserved_units INTEGER NOT NULL DEFAULT 0 CHECK(reserved_units>=0),
 spent_units INTEGER NOT NULL DEFAULT 0 CHECK(spent_units>=0), actual_neurons REAL NOT NULL DEFAULT 0,
 attempts INTEGER NOT NULL DEFAULT 0, allowed INTEGER NOT NULL DEFAULT 0,
 blocked INTEGER NOT NULL DEFAULT 0, failed INTEGER NOT NULL DEFAULT 0, retry_after INTEGER NOT NULL DEFAULT 0,
 expires_at INTEGER NOT NULL
);
CREATE TABLE community_review_attempts (
 id TEXT PRIMARY KEY, bucket TEXT NOT NULL REFERENCES community_review_budgets(bucket) ON DELETE CASCADE,
 reserved_units INTEGER NOT NULL, state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','allowed','blocked','failed')),
 actual_neurons REAL, charged_units INTEGER, started_at INTEGER NOT NULL, settled_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX community_review_attempt_bucket ON community_review_attempts(bucket);
