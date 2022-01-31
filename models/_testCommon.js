const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

const testPlaylists = [];
const testFavoriteSongIds = [];

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM playlists");

  const user = await db.query(`
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          img_url,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', $2, 'u1@email.com'),
               ('u2', $3, 'U2F', 'U2L', $4, 'u2@email.com')
        RETURNING username`,
      [
        await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
        "https://i.pinimg.com/474x/65/25/a0/6525a08f1df98a2e3a545fe2ace4be47.jpg",
        await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
        "https://i.pinimg.com/474x/65/25/a0/6525a08f1df98a2e3a545fe2ace4be47.jpg"
      ]);

  const playlists = await db.query(`
    INSERT INTO playlists(playlist_name, img_url, username)
    VALUES ('Favorite Songs', 'https://ak.picdn.net/shutterstock/videos/3361085/thumb/1.jpg', 'u1'),
           ('Favorite Songs', 'https://ak.picdn.net/shutterstock/videos/3361085/thumb/1.jpg', 'u2')
    RETURNING playlist_id, playlist_name, img_url`);
    
  testPlaylists.splice(0, 0, ...playlists.rows.map(r => r));

  const favoriteSongIds = await db.query(`
    INSERT INTO songs_playlists (song_id, playlist_id)
    VALUES ('1', $1),
           ('2', $2)
    Returning song_id`,
    [playlists.rows[0].playlist_id, playlists.rows[1].playlist_id]);

  testFavoriteSongIds.splice(0, 0, ...favoriteSongIds.rows.map(r => r.song_id));
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testPlaylists,
  testFavoriteSongIds
};