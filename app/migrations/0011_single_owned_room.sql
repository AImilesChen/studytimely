-- Preserve all rooms/records. A trusted active subscription grants ten open rooms.
-- created_at is the server's final creation time, never a client-supplied value.
DROP TRIGGER community_room_owner_limit;
CREATE TRIGGER community_room_owner_limit BEFORE INSERT ON community_rooms
WHEN NEW.closed_at=0 AND
 (SELECT count(*) FROM community_rooms WHERE owner_id=NEW.owner_id AND closed_at=0)>=
 CASE WHEN EXISTS(SELECT 1 FROM community_entitlements e JOIN community_profiles p ON p.account_id=e.account_id WHERE p.id=NEW.owner_id AND e.expires_at>NEW.created_at) THEN 10 ELSE 1 END
BEGIN SELECT RAISE(ABORT,'ROOM_LIMIT'); END;

CREATE TRIGGER community_room_owner_update_limit BEFORE UPDATE OF owner_id,closed_at ON community_rooms
WHEN NEW.closed_at=0 AND (OLD.closed_at<>0 OR OLD.owner_id<>NEW.owner_id) AND
 (SELECT count(*) FROM community_rooms WHERE owner_id=NEW.owner_id AND closed_at=0 AND id<>NEW.id)>=
 CASE WHEN EXISTS(SELECT 1 FROM community_entitlements e JOIN community_profiles p ON p.account_id=e.account_id WHERE p.id=NEW.owner_id AND e.expires_at>unixepoch('now')*1000) THEN 10 ELSE 1 END
BEGIN SELECT RAISE(ABORT,'ROOM_LIMIT'); END;
