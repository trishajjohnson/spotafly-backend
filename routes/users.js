"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureCorrectUser, ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const userUpdateSchema = require("../schemas/userUpdate.json");
const newPlaylistSchema = require("../schemas/newPlaylist.json");

const router = express.Router();


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, email, img_url, favoriteSongs, playlists }
 *   where playlists is { playlist_id, playlist_name, img_url, username }
 *
 * Authorization required: same user-as-:username
 **/

router.get("/:username", ensureCorrectUser, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email, img_url }
 *
 * Returns { username, firstName, lastName, email, img_url, favoriteSongs, playlists }
 *
 * Authorization required: same-user-as-:username
 **/

router.patch("/:username", ensureCorrectUser, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** POST /[username]/favorites/add 
 *
 * Returns {"added": songId}
 *
 * Authorization required: same-user-as-:username
 * */

router.post("/:username/favorites/add", ensureCorrectUser, async function (req, res, next) {
  try {
    const { username, songId } = req.body;
    const result = await User.addSongToFavorites(username, songId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[username]/favorites/remove 
 *
 * Returns {"deleted": songId}
 *
 * Authorization required: same-user-as-:username
 * */

router.delete("/:username/favorites/remove", ensureCorrectUser, async function (req, res, next) {
  try {
    const { username, songId } = req.body;
    const result = await User.removeSongFromFavorites(username, songId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

/** POST /[username]/playlists/add-new
 *
 * Returns { newPlaylist }
 *
 * Authorization required: same-user-as-:username
 * */

router.post("/:username/playlists/add-new", ensureCorrectUser, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, newPlaylistSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError("You must name your playlist.");
    }

    const { username, playlist_name, img_url } = req.body;
    const result = await User.createNewPlaylist(playlist_name, img_url, username);
    return res.json({ result });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[username]/playlists/[id]/remove 
 *
 * Returns {"deleted": playlist}
 *
 * Authorization required: same-user-as-:username
 * */

router.delete("/:username/playlists/:id/remove", ensureCorrectUser, async function (req, res, next) {
  try {
    const { playlistId } = req.body;
    const result = await User.removePlaylist(playlistId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

/** POST /[username]/playlists/[id]/add-song
 *
 * Returns {"added": songId}
 *
 * Authorization required: same-user-as-:username
 * */

router.post("/:username/playlists/:id/add-song", ensureCorrectUser, async function (req, res, next) {
  try {
    const { songId, playlistId } = req.body;
    const result = await User.addSongToPlaylist(playlistId, songId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[username]/playlists/[id]/remove-song 
 *
 * Returns {"deleted": songId}
 *
 * Authorization required: same-user-as-:username
 * */

router.delete("/:username/playlists/:id/remove-song", ensureCorrectUser, async function (req, res, next) {
  try {
    const { songId, playlistId } = req.body;
    const result = await User.removeSongFromPlaylist(songId, playlistId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

/** GET /[username]/playlists/[id]
 *
 * Returns { playlist }
 *
 * Authorization required: same-user-as-:username
 * */

router.get("/:username/playlists/:id", ensureCorrectUser, async function (req, res, next) {
  try {
    const { id } = req.params;
    const playlist = await User.getPlaylist(id);
    return res.json({ playlist });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
