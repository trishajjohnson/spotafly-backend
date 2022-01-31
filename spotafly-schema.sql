CREATE TABLE users (
  username VARCHAR(25) PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  img_url TEXT,
  email TEXT NOT NULL
    CHECK (position('@' IN email) > 1)
);

-- CREATE TABLE favorite_songs (
--   song_id TEXT PRIMARY KEY,
--   username VARCHAR(25) NOT NULL
--     REFERENCES users ON DELETE CASCADE
-- );

CREATE TABLE playlists (
  playlist_id SERIAL PRIMARY KEY,
  playlist_name TEXT NOT NULL,
  img_url TEXT,
  username VARCHAR(25) NOT NULL
    REFERENCES users ON DELETE CASCADE
);

-- CREATE TABLE followed_artists (
--   artist_id SERIAL PRIMARY KEY,
--   artist_name TEXT NOT NULL,
--   username VARCHAR(25) NOT NULL
--     REFERENCES users ON DELETE CASCADE
-- );

CREATE TABLE songs_playlists (
  playlist_id INTEGER NOT NULL
    REFERENCES playlists ON DELETE CASCADE,
  song_id TEXT NOT NULL,                          /* might need to change; do I set to PRIMARY KEY?  No song table in DB, song_id comes from API */
  PRIMARY KEY (playlist_id, song_id)
);
