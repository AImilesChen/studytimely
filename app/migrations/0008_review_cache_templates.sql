ALTER TABLE community_messages ADD COLUMN template_id TEXT
 CHECK(template_id IS NULL OR template_id IN ('starting','completed','break','help'));
CREATE TABLE community_review_cache (
 cache_key TEXT PRIMARY KEY,
 policy_version TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL CHECK(expires_at>created_at AND expires_at<=created_at+300000)
);
CREATE INDEX community_review_cache_expiry ON community_review_cache(expires_at);
