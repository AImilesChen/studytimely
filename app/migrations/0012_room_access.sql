-- Retain memberships/history; selections only determine current participation rights.
CREATE TABLE community_room_preferences (
 owner_id TEXT PRIMARY KEY REFERENCES community_profiles(id) ON DELETE CASCADE,
 free_room_id TEXT REFERENCES community_rooms(id) ON DELETE SET NULL,
 version INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL
);
ALTER TABLE community_rooms ADD COLUMN free_member_ids TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(free_member_ids));
ALTER TABLE community_rooms ADD COLUMN free_seats_chosen_at INTEGER NOT NULL DEFAULT 0;
