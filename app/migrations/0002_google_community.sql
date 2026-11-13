-- Additive V2 migration. Existing accounts/workspaces are retained.
ALTER TABLE accounts ADD COLUMN google_sub TEXT;
CREATE UNIQUE INDEX accounts_google_sub ON accounts(google_sub) WHERE google_sub IS NOT NULL;
CREATE TABLE oauth_states (
 state_hash TEXT PRIMARY KEY, binder_hash TEXT NOT NULL, verifier TEXT NOT NULL,
 nonce TEXT NOT NULL, expires_at INTEGER NOT NULL, link_account TEXT,
 link_session_hash TEXT, return_path TEXT NOT NULL DEFAULT '/account'
);
CREATE TABLE community_profiles (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
 nickname TEXT NOT NULL, public_ranking INTEGER NOT NULL DEFAULT 0,
 accepted_at INTEGER NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE community_rooms (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
 name TEXT NOT NULL, visibility TEXT NOT NULL CHECK(visibility IN ('public','private')),
 goal_minutes INTEGER NOT NULL DEFAULT 120, capacity INTEGER NOT NULL DEFAULT 8,
 invite_token TEXT NOT NULL UNIQUE, invitations_open INTEGER NOT NULL DEFAULT 1,
 round_ends_at INTEGER NOT NULL DEFAULT 0, closed_at INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL, version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX community_rooms_directory ON community_rooms(visibility,closed_at,created_at);
CREATE TABLE community_members (
 room_id TEXT NOT NULL REFERENCES community_rooms(id) ON DELETE CASCADE,
 profile_id TEXT NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
 joined_at INTEGER NOT NULL, last_seen INTEGER NOT NULL DEFAULT 0,
 banned INTEGER NOT NULL DEFAULT 0, muted_until INTEGER NOT NULL DEFAULT 0, left_at INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(room_id,profile_id)
);
CREATE TABLE community_timers (
 profile_id TEXT PRIMARY KEY REFERENCES community_profiles(id) ON DELETE CASCADE,
 room_id TEXT NOT NULL REFERENCES community_rooms(id) ON DELETE CASCADE,
 lease TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('running','paused','check')),
 started_at INTEGER NOT NULL, last_at INTEGER NOT NULL, check_at INTEGER NOT NULL,
 credited_seconds INTEGER NOT NULL DEFAULT 0
);
CREATE TRIGGER community_room_owner_limit BEFORE INSERT ON community_rooms
WHEN (SELECT count(*) FROM community_rooms WHERE owner_id=NEW.owner_id AND closed_at=0)>=3
BEGIN SELECT RAISE(ABORT,'ROOM_LIMIT'); END;
CREATE TRIGGER community_member_capacity BEFORE INSERT ON community_members
WHEN NEW.banned=0 AND NEW.left_at=0 AND
 (SELECT count(*) FROM community_members WHERE room_id=NEW.room_id AND banned=0 AND left_at=0)>=(SELECT capacity FROM community_rooms WHERE id=NEW.room_id)
BEGIN SELECT RAISE(ABORT,'ROOM_FULL'); END;
CREATE TRIGGER community_rejoin_capacity BEFORE UPDATE OF left_at,banned ON community_members
WHEN (OLD.left_at>0 OR OLD.banned=1) AND NEW.banned=0 AND NEW.left_at=0 AND
 (SELECT count(*) FROM community_members WHERE room_id=NEW.room_id AND banned=0 AND left_at=0)>=(SELECT capacity FROM community_rooms WHERE id=NEW.room_id)
BEGIN SELECT RAISE(ABORT,'ROOM_FULL'); END;
CREATE TRIGGER community_join_limit BEFORE INSERT ON community_members
WHEN NEW.banned=0 AND NEW.left_at=0 AND
 (SELECT count(*) FROM community_members m JOIN community_rooms r ON r.id=m.room_id WHERE m.profile_id=NEW.profile_id AND m.banned=0 AND m.left_at=0 AND r.closed_at=0)>=10
BEGIN SELECT RAISE(ABORT,'MEMBERSHIP_LIMIT'); END;
CREATE TRIGGER community_rejoin_limit BEFORE UPDATE OF left_at,banned ON community_members
WHEN (OLD.left_at>0 OR OLD.banned=1) AND NEW.banned=0 AND NEW.left_at=0 AND
 (SELECT count(*) FROM community_members m JOIN community_rooms r ON r.id=m.room_id WHERE m.profile_id=NEW.profile_id AND m.banned=0 AND m.left_at=0 AND r.closed_at=0)>=10
BEGIN SELECT RAISE(ABORT,'MEMBERSHIP_LIMIT'); END;
CREATE TABLE community_daily (
 profile_id TEXT NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
 day TEXT NOT NULL, seconds INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(profile_id,day)
);
CREATE TABLE community_room_daily (
 room_id TEXT NOT NULL REFERENCES community_rooms(id) ON DELETE CASCADE,
 profile_id TEXT NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
 day TEXT NOT NULL, seconds INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(room_id,profile_id,day)
);
CREATE TABLE community_credits (
 id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
 room_id TEXT NOT NULL REFERENCES community_rooms(id) ON DELETE CASCADE,
 day TEXT NOT NULL, seconds INTEGER NOT NULL CHECK(seconds BETWEEN 1 AND 90), created_at INTEGER NOT NULL
);
CREATE TRIGGER community_credit_cap BEFORE INSERT ON community_credits
WHEN COALESCE((SELECT seconds FROM community_daily WHERE profile_id=NEW.profile_id AND day=NEW.day),0)+NEW.seconds>28800
BEGIN SELECT RAISE(ABORT,'DAILY_CAP'); END;
CREATE TRIGGER community_credit_score AFTER INSERT ON community_credits BEGIN
 INSERT INTO community_daily(profile_id,day,seconds) VALUES(NEW.profile_id,NEW.day,NEW.seconds)
 ON CONFLICT(profile_id,day) DO UPDATE SET seconds=seconds+excluded.seconds;
 INSERT INTO community_room_daily(room_id,profile_id,day,seconds) VALUES(NEW.room_id,NEW.profile_id,NEW.day,NEW.seconds)
 ON CONFLICT(room_id,profile_id,day) DO UPDATE SET seconds=seconds+excluded.seconds;
END;
CREATE TABLE community_messages (
 id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES community_rooms(id) ON DELETE CASCADE,
 author_id TEXT NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
 text TEXT NOT NULL, created_at INTEGER NOT NULL, hidden INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX community_messages_room ON community_messages(room_id,created_at);
CREATE TABLE community_blocks (
 blocker_id TEXT NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
 blocked_id TEXT NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
 PRIMARY KEY(blocker_id,blocked_id)
);
CREATE TABLE community_reports (
 id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES community_rooms(id) ON DELETE CASCADE,
 reporter_id TEXT REFERENCES community_profiles(id) ON DELETE SET NULL,
 subject_id TEXT REFERENCES community_profiles(id) ON DELETE SET NULL,
 message_id TEXT REFERENCES community_messages(id) ON DELETE SET NULL,
 reason TEXT NOT NULL, detail TEXT NOT NULL, excerpt TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'open', created_at INTEGER NOT NULL,
 reviewed_at INTEGER, reviewer_id TEXT REFERENCES community_profiles(id) ON DELETE SET NULL
);
CREATE INDEX community_reports_open ON community_reports(status,created_at);
CREATE TABLE community_rank_history (
 day TEXT NOT NULL, profile_id TEXT NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
 rank INTEGER NOT NULL, seconds INTEGER NOT NULL, PRIMARY KEY(day,profile_id)
);
