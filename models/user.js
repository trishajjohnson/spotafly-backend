"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** User model and related functions for users. */

class User {

  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, img_url }
   *
   * Throws UnauthorizedError if user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
          `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  img_url
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, img_url }
   *
   * If img_url is not provided upon signup, function will provide a 
   * default image.
   * 
   * Throws BadRequestError on duplicates.
   **/

  static async register(
      { username, password, firstName, lastName, imgUrl, email }) {
    const duplicateCheck = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`,
        [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    let profileUrl;
    
    if(!imgUrl || imgUrl === "" || imgUrl === null) {
      profileUrl = "https://i.pinimg.com/474x/65/25/a0/6525a08f1df98a2e3a545fe2ace4be47.jpg";
    } else {
      profileUrl = imgUrl;
    }

    const result = await db.query(
          `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            img_url,
            email)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName",  email, img_url as "imgUrl"`,
        [
          username,
          hashedPassword,
          firstName,
          lastName,
          profileUrl,
          email
        ],
    );
    
    // Upon registration, a "Favorite Songs" playlist is created and
    // inserted into user's playlists.

    await db.query(
      `INSERT INTO playlists (playlist_name, img_url, username)
       VALUES ($1, $2, $3)`,
    ["Favorite Songs", "https://ak.picdn.net/shutterstock/videos/3361085/thumb/1.jpg", username]);

    const user = result.rows[0];
    return user;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, playlists, img_url, favoriteSongs }
   * where playlists are { playlist_id, playlist_name, img_url, username }
   * and favoriteSongs is an array of song_ids of the songs included int he "Favorite
   * Songs" playlist. 
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  img_url,
                  email
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    const favoritePlaylist = await db.query(
      `SELECT p.playlist_id
       FROM playlists AS p
       WHERE p.username = $1 AND p.playlist_name = $2`, 
      [username, "Favorite Songs"]);

    const favoriteSongs = await db.query(
      `SELECT s.song_id
       FROM songs_playlists AS s
       WHERE s.playlist_id = $1`, 
      [favoritePlaylist.rows[0].playlist_id]);

    user.favoriteSongs = favoriteSongs.rows.map(s => s.song_id);

    const userPlaylistsRes = await db.query(
          `SELECT p.playlist_id, p.playlist_name, p.img_url
           FROM playlists AS p
           WHERE p.username = $1`, [username]);

    user.playlists = userPlaylistsRes.rows.map(p => p);

    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   * { firstName, lastName, password, email, img_url }
   * Password is only used to verify correct user and password
   * before updating.  Password is not changed. If password is incorrect,
   * Alert will be thrown.
   *
   * Returns { username, firstName, lastName, email, img_url }
   *
   * Throws NotFoundError if not found.
   *
   */

  static async update(username, data) {
    const userRes = await db.query(
      `SELECT password
       FROM users
       WHERE username = $1`,
    [username],
    );

    if (!userRes.rows[0]) throw new NotFoundError(`No user: ${username}`);

    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        firstName: "first_name",
        lastName: "last_name",
        imgUrl: "img_url"
      });
    const usernameVarIdx = "$" + (values.length + 1);

    const isValid = await bcrypt.compare(data.password, userRes.rows[0].password);

    if (!isValid) throw new BadRequestError("Incorrect password");

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                img_url AS "imgUrl",
                                email`;

    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    delete user.password;

    const favoritePlaylist = await db.query(
      `SELECT p.playlist_id
       FROM playlists AS p
       WHERE p.username = $1 AND p.playlist_name = $2`, 
      [username, "Favorite Songs"]);

    const favoriteSongs = await db.query(
      `SELECT s.song_id
       FROM songs_playlists AS s
       WHERE s.playlist_id = $1`, 
      [favoritePlaylist.rows[0].playlist_id]);

    user.favoriteSongs = favoriteSongs.rows.map(s => s.song_id);

    const userPlaylistsRes = await db.query(
          `SELECT p.playlist_id, p.playlist_name, p.img_url
           FROM playlists AS p
           WHERE p.username = $1`, [username]);

    user.playlists = userPlaylistsRes.rows.map(p => p);

    return user;
  }

  /** Add song to favorites: update db, returns {added: song_id}.
   *
   * - username: username adding song to favorites
   * - song_id: id of song being added
   **/

  static async addSongToFavorites(username, songId) {
    const preCheck2 = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`, [username]);

    const user = preCheck2.rows[0];

    if (!user) throw new NotFoundError(`No username: ${username}`);

    const favoritesPlaylist = await db.query(
      `SELECT playlist_id
       FROM playlists
       WHERE playlist_name = $1 AND username = $2`, 
      ["Favorite Songs", username]);

    const preCheck = await db.query(
          `SELECT song_id
           FROM songs_playlists
           WHERE playlist_id = $1 AND song_id = $2`, 
          [favoritesPlaylist.rows[0].playlist_id, songId]);

    const song = preCheck.rows[0];

    if (song) throw new BadRequestError(`Song already in favorites: ${songId}`);

    const favorite = await db.query(
          `INSERT INTO songs_playlists (song_id, playlist_id)
           VALUES ($1, $2)
           RETURNING song_id`,
        [songId, favoritesPlaylist.rows[0].playlist_id]);

    if(favorite) return {added: favorite.rows[0].song_id};
  }

  /** Remove song from favorites: update db, returns {deleted: song_id}.
   *
   * - username: username adding song to favorites
   * - song_id: id of song being added
   **/

  static async removeSongFromFavorites(username, songId) {
    const preCheck2 = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`, [username]);

    const user = preCheck2.rows[0];

    if (!user) throw new NotFoundError(`No username: ${username}`);

    const favoritesPlaylist = await db.query(
      `SELECT playlist_id
       FROM playlists
       WHERE playlist_name = $1 AND username = $2`, 
      ["Favorite Songs", username]);

    const result = await db.query(
        `DELETE
        FROM songs_playlists
        WHERE playlist_id = $1 AND song_id = $2
        RETURNING song_id`,
      [favoritesPlaylist.rows[0].playlist_id, songId],
    );

    const song = result.rows[0];

    if (!song) throw new NotFoundError(`No song: ${songId}`);
    
    return { deleted: song.song_id }
  }

  /** Creates new playlist: update db, returns undefined.
   *
   * - username: username creating playlist
   * - playlist_name: name of playlist (required)
   * - img_url: URL for playlist image (optional - default image provided)
   * 
   * returns new playlist
   **/

  static async createNewPlaylist(playlist_name, img_url, username) {
    let result;
    if(!img_url || img_url === undefined) {
      const default_img = "https://us.123rf.com/450wm/soloviivka/soloviivka1606/soloviivka160600001/59688426-music-note-vector-icon-white-on-black-background.jpg?ver=6";
      result = await db.query(
        `INSERT INTO playlists (playlist_name, img_url, username)
         VALUES ($1, $2, $3)
         RETURNING playlist_id, playlist_name, img_url, username`,
      [playlist_name, default_img, username]);
    } else {
      result = await db.query(
            `INSERT INTO playlists (playlist_name, img_url, username)
             VALUES ($1, $2, $3)
             RETURNING playlist_id, playlist_name, img_url, username`,
          [playlist_name, img_url, username]);
    }

    const playlist = result.rows[0];
    return playlist;
  }

  /** Deletes playlist from DB: update db, returns playlist_id.
   *
   * - playlist_Id: playlist_id
   * 
   * returns playlist_id
   **/

  static async removePlaylist(playlistId) {
    const result = await db.query(
      `DELETE 
       FROM playlists
       WHERE playlist_id = $1
       RETURNING playlist_id`, 
    [playlistId]);

    const playlist = result.rows[0];
    if (!playlist) throw new NotFoundError(`No playlist: ${playlistId}`);

    return {deleted: playlist.playlist_id};
  }

  /** Add song to playlist: update db, returns undefined.
   *
   * - playlist_id: playlist_id
   * - song_id: id of song being added
   **/

  static async addSongToPlaylist(playlistId, songId) {
    const result = await db.query(
      `SELECT playlist_id
       FROM playlists
       WHERE playlist_id = $1`, 
      [playlistId]);
    
    const playlist = result.rows[0];

    if(!playlist) throw new NotFoundError(`No playlist found: ${playlistId}`);

    const preCheck = await db.query(
          `SELECT song_id
           FROM songs_playlists
           WHERE playlist_id = $1 AND song_id = $2`, 
          [playlistId, songId]);

    const song = preCheck.rows[0];

    if (song) throw new BadRequestError(`Song already in playlist: ${songId}`);

    const added = await db.query(
          `INSERT INTO songs_playlists (song_id, playlist_id)
           VALUES ($1, $2)
           RETURNING song_id`,
        [songId, playlistId]);

    return {added: added.rows[0].song_id}
  }

  /** Remove song from playlist: update db, returns song_id.
   *
   * - playlist_id: playlist_id for song to be removed from
   * - song_id: id of song being removed
   **/

  static async removeSongFromPlaylist(songId, playlistId) {
    const preCheck = await db.query(
      `SELECT playlist_id
       FROM playlists
       WHERE playlist_id = $1`, 
      [playlistId]);
    
    const playlist = preCheck.rows[0];

    if(!playlist) throw new NotFoundError(`No playlist found: ${playlistId}`);

    const result = await db.query(
      `DELETE
      FROM songs_playlists
      WHERE playlist_id = $1 AND song_id = $2
      RETURNING song_id`,
    [playlistId, songId],
  );

  const song = result.rows[0];
  
  if (!song) throw new BadRequestError(`No song: ${songId}`);

  return {deleted: song.song_id};
  }

   /** Given a playlist_id, return data about playlist.
   *
   * Returns { playlist_id, playlist_name, img_url, username }
   *
   * Throws NotFoundError if playlist not found.
   **/

  static async getPlaylist(id) {
    const playlistRes = await db.query(
          `SELECT playlist_id,
                  playlist_name,
                  img_url,
                  username
            FROM playlists
            WHERE playlist_id = $1`,
        [id],
    );

    const playlist = playlistRes.rows[0];

    if (!playlist) throw new NotFoundError(`No playlist: ${id}`);
    
    const playlistSongsRes = await db.query(
          `SELECT p.song_id
            FROM songs_playlists AS p
            WHERE p.playlist_id = $1`, [id]
    );
            
    playlist.tracks = playlistSongsRes.rows.map(t => t.song_id);

    return playlist;
  }

}


module.exports = User;
 