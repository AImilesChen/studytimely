-- Private incremental sync, independent of community study credit.
CREATE TABLE IF NOT EXISTS sync_heads (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
 generation TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0, bytes INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sync_records (
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 record_key TEXT NOT NULL, document TEXT NOT NULL, revision INTEGER NOT NULL,
 PRIMARY KEY(account_id,record_key)
);
CREATE INDEX IF NOT EXISTS sync_records_revision ON sync_records(account_id,revision);
CREATE TABLE IF NOT EXISTS sync_receipts (
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 mutation_id TEXT NOT NULL, generation TEXT NOT NULL, version INTEGER NOT NULL, created_at INTEGER NOT NULL, fingerprint TEXT NOT NULL,
 PRIMARY KEY(account_id,mutation_id)
);
CREATE TABLE IF NOT EXISTS sync_backups (
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 id TEXT NOT NULL, source TEXT NOT NULL, document TEXT NOT NULL, checksum TEXT NOT NULL, created_at INTEGER NOT NULL,
 PRIMARY KEY(account_id,id)
);
CREATE INDEX IF NOT EXISTS sync_backups_date ON sync_backups(account_id,created_at);
CREATE TABLE IF NOT EXISTS sync_devices (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 session_hash TEXT NOT NULL UNIQUE REFERENCES sessions(token_hash) ON DELETE CASCADE,
 name TEXT NOT NULL, last_seen INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_backup_chunks (
 account_id TEXT NOT NULL, backup_id TEXT NOT NULL, position INTEGER NOT NULL, document TEXT NOT NULL,
 PRIMARY KEY(account_id,backup_id,position),
 FOREIGN KEY(account_id,backup_id) REFERENCES sync_backups(account_id,id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS sync_trash (
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 record_key TEXT NOT NULL, document TEXT NOT NULL, label TEXT NOT NULL, deleted_at INTEGER NOT NULL, bytes INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(account_id,record_key)
);

CREATE TABLE IF NOT EXISTS sync_trash_chunks (
 account_id TEXT NOT NULL, record_key TEXT NOT NULL, position INTEGER NOT NULL, document TEXT NOT NULL,
 PRIMARY KEY(account_id,record_key,position),
 FOREIGN KEY(account_id,record_key) REFERENCES sync_trash(account_id,record_key) ON DELETE CASCADE
);
