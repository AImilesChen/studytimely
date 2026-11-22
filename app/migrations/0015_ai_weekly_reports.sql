-- Private, explicitly requested summaries; no raw sessions, notes or task titles.
CREATE TABLE ai_weekly_reports (
 id TEXT PRIMARY KEY,
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 request_key TEXT NOT NULL,
 input_hash TEXT NOT NULL,
 facts TEXT NOT NULL,
 content TEXT,
 status TEXT NOT NULL CHECK(status IN ('pending','ready','failed','deleted')),
 error_code TEXT NOT NULL DEFAULT '',
 month_key TEXT NOT NULL,
 day_key TEXT NOT NULL,
 reservation INTEGER NOT NULL,
 reserved INTEGER NOT NULL DEFAULT 1 CHECK(reserved IN (0,1)),
 charged INTEGER NOT NULL DEFAULT 0 CHECK(charged IN (0,1)),
 input_tokens INTEGER NOT NULL DEFAULT 0,
 output_tokens INTEGER NOT NULL DEFAULT 0,
 started_at INTEGER NOT NULL,
 finished_at INTEGER NOT NULL DEFAULT 0,
 UNIQUE(account_id,request_key)
);
CREATE INDEX ai_weekly_account ON ai_weekly_reports(account_id,status,started_at DESC);
CREATE INDEX ai_weekly_quota ON ai_weekly_reports(account_id,month_key,charged,reserved);
CREATE INDEX ai_weekly_budget ON ai_weekly_reports(day_key);
CREATE TABLE ai_weekly_daily_budget (
 day_key TEXT PRIMARY KEY,
 reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved>=0),
 spent INTEGER NOT NULL DEFAULT 0 CHECK(spent>=0)
);
