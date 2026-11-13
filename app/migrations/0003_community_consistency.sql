ALTER TABLE community_profiles ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
CREATE INDEX community_daily_day ON community_daily(day,profile_id);
CREATE INDEX community_room_daily_day ON community_room_daily(room_id,day);
CREATE INDEX community_members_profile ON community_members(profile_id,left_at,banned);
CREATE INDEX community_credits_expiry ON community_credits(created_at);
CREATE INDEX community_messages_expiry ON community_messages(created_at);
CREATE INDEX oauth_states_expiry ON oauth_states(expires_at);
