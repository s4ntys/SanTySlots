ALTER TABLE players ADD COLUMN avatar_data TEXT;
ALTER TABLE players ADD COLUMN bio TEXT NOT NULL DEFAULT '';
CREATE TABLE name_claims (normalized_name TEXT PRIMARY KEY, display_name TEXT NOT NULL, player_id TEXT NOT NULL, ip_hash TEXT NOT NULL, created INTEGER NOT NULL);
CREATE INDEX name_claims_player ON name_claims(player_id);
CREATE TABLE posts (id TEXT PRIMARY KEY, player_id TEXT NOT NULL, body TEXT NOT NULL DEFAULT '', image_data TEXT, created INTEGER NOT NULL);
CREATE INDEX posts_created ON posts(created DESC);
CREATE TABLE comments (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, player_id TEXT NOT NULL, body TEXT NOT NULL, created INTEGER NOT NULL);
CREATE INDEX comments_post_created ON comments(post_id, created);
