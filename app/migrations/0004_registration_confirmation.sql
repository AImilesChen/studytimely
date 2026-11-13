-- New accounts confirm once after Google identity verification, before account creation.
-- Do not invent acceptance timestamps for existing accounts.
ALTER TABLE accounts ADD COLUMN policy_accepted_at INTEGER;
ALTER TABLE accounts ADD COLUMN policy_version TEXT;
CREATE TABLE pending_google_registrations (
 token_hash TEXT PRIMARY KEY, google_sub TEXT NOT NULL, email TEXT NOT NULL,
 return_path TEXT NOT NULL DEFAULT '/account', expires_at INTEGER NOT NULL
);
CREATE INDEX pending_google_registrations_expiry ON pending_google_registrations(expires_at);
