-- Trusted subscription provisioning is separate from community APIs. No payment integration here.
CREATE TABLE community_entitlements (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
 member_limit INTEGER NOT NULL DEFAULT 4 CHECK(member_limit IN (4,8,12,24)),
 free_text INTEGER NOT NULL DEFAULT 0 CHECK(free_text IN (0,1)),
 expires_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
ALTER TABLE community_members ADD COLUMN focus_state TEXT NOT NULL DEFAULT 'ready' CHECK(focus_state IN ('ready','break'));
ALTER TABLE community_members ADD COLUMN allow_nudges INTEGER NOT NULL DEFAULT 1 CHECK(allow_nudges IN (0,1));
ALTER TABLE community_members ADD COLUMN state_updated_at INTEGER NOT NULL DEFAULT 0;
-- Preserve the original four-template constraint and all message/report references.
ALTER TABLE community_messages ADD COLUMN quick_id TEXT CHECK(quick_id IS NULL OR quick_id IN ('starting','completed','break','help','keep-going','well-done','thanks','start-together','another-round','break-together'));
CREATE TABLE community_interactions (
 id TEXT PRIMARY KEY,
 room_id TEXT NOT NULL REFERENCES community_rooms(id) ON DELETE CASCADE,
 sender_id TEXT NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
 recipient_id TEXT NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('tap','cheer','celebrate')),
 created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
 CHECK(sender_id<>recipient_id), CHECK(expires_at>created_at AND expires_at<=created_at+600000)
);
CREATE INDEX community_interactions_recipient ON community_interactions(recipient_id,created_at);
CREATE INDEX community_interactions_sender ON community_interactions(sender_id,created_at);
CREATE TRIGGER community_interaction_pair BEFORE INSERT ON community_interactions
WHEN EXISTS(SELECT 1 FROM community_interactions WHERE sender_id=NEW.sender_id AND recipient_id=NEW.recipient_id AND created_at>NEW.created_at-300000)
BEGIN SELECT RAISE(ABORT,'INTERACTION_COOLDOWN'); END;
CREATE TRIGGER community_interaction_recipient BEFORE INSERT ON community_interactions
WHEN EXISTS(SELECT 1 FROM community_interactions WHERE recipient_id=NEW.recipient_id AND created_at>NEW.created_at-60000)
BEGIN SELECT RAISE(ABORT,'INTERACTION_BUSY'); END;
CREATE TRIGGER community_interaction_sender BEFORE INSERT ON community_interactions
WHEN (SELECT count(*) FROM community_interactions WHERE sender_id=NEW.sender_id AND created_at>NEW.created_at-60000)>=2
BEGIN SELECT RAISE(ABORT,'INTERACTION_LIMIT'); END;
