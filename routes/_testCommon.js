"use strict";

const db = require("../db.js");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");

const testPlaylists = [];
const testFavoriteSongIds = [];
const tokens = [];

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM playlists");

  const u1 = await User.register({
    username: "u1",
    password: "password1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com"
  });

  tokens[0] = (await createToken({username: 'u1'}));

  const u2 = await User.register({
    username: "u2",
    password: "password2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com"
  });

  tokens[1] = (await createToken({username: 'u2'}));

  const u3 = await User.register({
    username: "u3",
    password: "password3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com"
  });

  tokens[2] = (await createToken({username: 'u3'}));

  const playlist1 = await User.createNewPlaylist(
        "p1",
        null,
        'u1'
  );
  const playlist2 = await User.createNewPlaylist(
        "p2",
        null,
        'u2'
  );
  const playlist3 = await User.createNewPlaylist(
        "p3",
        null,
        'u3'
  );

  await User.addSongToPlaylist(playlist1.playlist_id, "1");
  await User.addSongToPlaylist(playlist2.playlist_id, "2");
  await User.addSongToPlaylist(playlist3.playlist_id, "3");

  testPlaylists.push(playlist1);
  testPlaylists[1] = playlist2;
  testPlaylists[2] = playlist3;

  testFavoriteSongIds[0] = (await User.addSongToFavorites('u1', "1"));
  testFavoriteSongIds[1] = (await User.addSongToFavorites('u2', "2"));
  testFavoriteSongIds[2] = (await User.addSongToFavorites('u3', "3"));
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
  testFavoriteSongIds,
  tokens
};
