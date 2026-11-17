-- Additive activity records; no existing rooms, history or limits are removed.
ALTER TABLE community_rooms ADD COLUMN study_subject TEXT NOT NULL DEFAULT 'general';
ALTER TABLE community_rooms ADD COLUMN announcement_key TEXT NOT NULL DEFAULT 'welcome';
CREATE TABLE community_activities (
 id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES community_rooms(id) ON DELETE CASCADE,
 title TEXT NOT NULL, subject TEXT NOT NULL, kind TEXT NOT NULL, starts_at INTEGER NOT NULL,
 zone TEXT NOT NULL, focus_minutes INTEGER NOT NULL CHECK(focus_minutes BETWEEN 5 AND 120),
 break_minutes INTEGER NOT NULL CHECK(break_minutes BETWEEN 0 AND 30),
 status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','running','ended','cancelled')),
 started_at INTEGER NOT NULL DEFAULT 0, ended_at INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX community_activities_room ON community_activities(room_id,created_at);
CREATE UNIQUE INDEX community_activity_running ON community_activities(room_id) WHERE status='running';
CREATE TRIGGER community_activity_schedule_limit BEFORE INSERT ON community_activities
WHEN (SELECT count(*) FROM community_activities WHERE room_id=NEW.room_id AND status='scheduled')>=20
BEGIN SELECT RAISE(ABORT,'ACTIVITY_LIMIT'); END;
CREATE TABLE community_activity_members (
 activity_id TEXT NOT NULL REFERENCES community_activities(id) ON DELETE CASCADE,
 profile_id TEXT NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
 subject TEXT NOT NULL, task_text TEXT NOT NULL DEFAULT '', reflection TEXT NOT NULL DEFAULT '',
 joined_at INTEGER NOT NULL, withdrawn_at INTEGER NOT NULL DEFAULT 0,
 first_started_at INTEGER NOT NULL DEFAULT 0, checked_out_at INTEGER NOT NULL DEFAULT 0,
 outcome TEXT NOT NULL DEFAULT '' CHECK(outcome IN ('','completed','partial','not_started')),
 seconds INTEGER NOT NULL DEFAULT 0 CHECK(seconds>=0), version INTEGER NOT NULL DEFAULT 1,
 PRIMARY KEY(activity_id,profile_id)
);
ALTER TABLE community_timers ADD COLUMN activity_id TEXT REFERENCES community_activities(id) ON DELETE SET NULL;
ALTER TABLE community_credits ADD COLUMN activity_id TEXT REFERENCES community_activities(id) ON DELETE SET NULL;
CREATE TRIGGER community_activity_credit AFTER INSERT ON community_credits WHEN NEW.activity_id IS NOT NULL BEGIN
 UPDATE community_activity_members SET seconds=seconds+NEW.seconds
 WHERE activity_id=NEW.activity_id AND profile_id=NEW.profile_id AND withdrawn_at=0
 AND EXISTS(SELECT 1 FROM community_activities a WHERE a.id=NEW.activity_id AND a.room_id=NEW.room_id AND a.started_at>0);
END;
