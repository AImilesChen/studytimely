-- Sandbox billing is opt-in. Existing/manual grants are never overwritten.
CREATE TABLE billing_customers (
 account_id TEXT UNIQUE REFERENCES accounts(id) ON DELETE SET NULL,
 customer_id TEXT PRIMARY KEY, deleting INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL
);
CREATE TABLE billing_locks (account_id TEXT PRIMARY KEY, token TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE billing_checkouts (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
 intent_id TEXT NOT NULL, plan_id TEXT NOT NULL, session_id TEXT, url TEXT,
 expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE billing_subscriptions (
 subscription_id TEXT PRIMARY KEY, account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
 customer_id TEXT NOT NULL, plan_id TEXT NOT NULL, status TEXT NOT NULL,
 cancel_at_period_end INTEGER NOT NULL DEFAULT 0, period_end INTEGER NOT NULL DEFAULT 0,
 updated_at INTEGER NOT NULL
);
CREATE INDEX billing_subscriptions_account ON billing_subscriptions(account_id);
CREATE TABLE billing_payments (
 invoice_id TEXT PRIMARY KEY, subscription_id TEXT NOT NULL,
 account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
 charge_id TEXT, period_start INTEGER NOT NULL, period_end INTEGER NOT NULL,
 amount INTEGER NOT NULL, currency TEXT NOT NULL,
 revoked INTEGER NOT NULL DEFAULT 0, review_required INTEGER NOT NULL DEFAULT 0,
 updated_at INTEGER NOT NULL
);
CREATE INDEX billing_payments_account ON billing_payments(account_id,period_end);
CREATE INDEX billing_payments_charge ON billing_payments(charge_id);
CREATE TABLE billing_grants (
 subscription_id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX billing_grants_account ON billing_grants(account_id);
CREATE TABLE billing_events (
 event_id TEXT PRIMARY KEY, event_type TEXT NOT NULL, object_id TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('received','processed','ignored')),
 received_at INTEGER NOT NULL, processed_at INTEGER
);
-- Callers filter each source by their trusted evaluation time before aggregation.
CREATE VIEW account_entitlement_sources AS
 SELECT account_id,member_limit,free_text,expires_at FROM community_entitlements
 UNION ALL
 SELECT account_id,24 AS member_limit,1 AS free_text,expires_at FROM billing_grants;

DROP TRIGGER community_room_owner_limit;
CREATE TRIGGER community_room_owner_limit BEFORE INSERT ON community_rooms WHEN NEW.closed_at=0 AND (SELECT count(*) FROM community_rooms WHERE owner_id=NEW.owner_id AND closed_at=0 AND id<>NEW.id)>=CASE WHEN EXISTS(SELECT 1 FROM account_entitlement_sources e JOIN community_profiles p ON p.account_id=e.account_id WHERE p.id=NEW.owner_id AND e.expires_at>NEW.created_at) OR EXISTS(SELECT 1 FROM community_group_previews gp JOIN community_profiles p ON p.account_id=gp.account_id JOIN community_group_policy pol ON pol.id=1 WHERE p.id=NEW.owner_id AND gp.enabled=1 AND pol.enabled=1 AND (pol.ends_at=0 OR pol.ends_at>NEW.created_at)) THEN 10 ELSE 1 END BEGIN SELECT RAISE(ABORT,'ROOM_LIMIT'); END;

DROP TRIGGER community_room_owner_update_limit;
CREATE TRIGGER community_room_owner_update_limit BEFORE UPDATE OF owner_id,closed_at ON community_rooms WHEN NEW.closed_at=0 AND (OLD.closed_at<>0 OR OLD.owner_id<>NEW.owner_id) AND (SELECT count(*) FROM community_rooms WHERE owner_id=NEW.owner_id AND closed_at=0 AND id<>NEW.id)>=CASE WHEN EXISTS(SELECT 1 FROM account_entitlement_sources e JOIN community_profiles p ON p.account_id=e.account_id WHERE p.id=NEW.owner_id AND e.expires_at>unixepoch('now')*1000) OR EXISTS(SELECT 1 FROM community_group_previews gp JOIN community_profiles p ON p.account_id=gp.account_id JOIN community_group_policy pol ON pol.id=1 WHERE p.id=NEW.owner_id AND gp.enabled=1 AND pol.enabled=1 AND (pol.ends_at=0 OR pol.ends_at>unixepoch('now')*1000)) THEN 10 ELSE 1 END BEGIN SELECT RAISE(ABORT,'ROOM_LIMIT'); END;
