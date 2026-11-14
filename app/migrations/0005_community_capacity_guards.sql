-- Additive defence for direct writes and concurrent joins/settings changes.
CREATE TRIGGER community_capacity_insert BEFORE INSERT ON community_rooms
WHEN typeof(NEW.capacity)!='integer' OR NEW.capacity<2 OR NEW.capacity>24
BEGIN SELECT RAISE(ABORT,'CAPACITY_INVALID'); END;
CREATE TRIGGER community_capacity_update BEFORE UPDATE OF capacity ON community_rooms
WHEN typeof(NEW.capacity)!='integer' OR NEW.capacity<2 OR NEW.capacity>24 OR
 NEW.capacity<(SELECT count(*) FROM community_members WHERE room_id=NEW.id AND banned=0 AND left_at=0)
BEGIN SELECT RAISE(ABORT,'CAPACITY_INVALID'); END;
