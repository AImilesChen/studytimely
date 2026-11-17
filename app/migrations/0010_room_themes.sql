-- Additive approved theme text; existing preset subjects and room data stay intact.
ALTER TABLE community_rooms ADD COLUMN custom_theme TEXT NOT NULL DEFAULT '' CHECK(length(custom_theme)<=40);
