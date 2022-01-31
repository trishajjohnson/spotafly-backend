"use strict";

const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const db = require("../db.js");
const User = require("./user.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testPlaylists,
  testFavoriteSongIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** authenticate */

describe("authenticate", function () {
  test("works", async function () {
    const user = await User.authenticate("u1", "password1");
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      img_url: "https://i.pinimg.com/474x/65/25/a0/6525a08f1df98a2e3a545fe2ace4be47.jpg"
    });
  });

  test("unauth if no such user", async function () {
    try {
      await User.authenticate("nope", "password");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });

  test("unauth if wrong password", async function () {
    try {
      await User.authenticate("c1", "wrong");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

/************************************** register */

describe("register", function () {
  const newUser = {
    username: "new",
    firstName: "Test",
    lastName: "Tester",
    imgUrl: "https://i.pinimg.com/474x/65/25/a0/6525a08f1df98a2e3a545fe2ace4be47.jpg",
    email: "test@test.com"
  };

  const newUser2 = {
    username: "new2",
    firstName: "Test2",
    lastName: "Tester2",
    email: "test2@test.com"
  };

  test("works", async function () {
    let user = await User.register({
        ...newUser, 
        password: "password"
    });
    expect(user).toEqual(newUser);
    const found = await db.query("SELECT * FROM users WHERE username = 'new'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("works with no imgUrl passed by user", async function () {
    let user2 = await User.register({
      ...newUser2,
      password: "password"
    });
    expect(user2).toEqual({...newUser2, imgUrl: "https://i.pinimg.com/474x/65/25/a0/6525a08f1df98a2e3a545fe2ace4be47.jpg"});
    const found = await db.query("SELECT * FROM users WHERE username = 'new2'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("bad request with dup data", async function () {
    try {
      await User.register({
        ...newUser,
        password: "password",
      });
      await User.register({
        ...newUser,
        password: "password",
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let user = await User.get("u1");
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      img_url: "https://i.pinimg.com/474x/65/25/a0/6525a08f1df98a2e3a545fe2ace4be47.jpg",
      email: "u1@email.com",
      favoriteSongs: [testFavoriteSongIds[0]],
      playlists: [testPlaylists[0]]
    });
  });

  test("not found if no such user", async function () {
    try {
      await User.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    firstName: "NewF",
    lastName: "NewL",
    email: "new@email.com",
    imgUrl: "newUrl"
  };

  test("works", async function () {
    let user = await User.update("u1", {...updateData, password: "password1"});
    expect(user).toEqual({
      username: "u1",
      ...updateData,
      favoriteSongs: [testFavoriteSongIds[0]],
      playlists: [testPlaylists[0]]
    });
  });

  test("bad request if wrong password", async function () {
    try {
      await User.update("u1", {
          ...updateData, 
          password: "wrong"
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("not found if no such user", async function () {
    try {
      await User.update("nope", {
        firstName: "test", 
        password: "password"
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if no data", async function () {
    expect.assertions(1);
    try {
      await User.update("u1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** addSongToFavorites */

describe("addSongToFavorites", function () {

    test("works", async function () {
      const addSong = await User.addSongToFavorites("u1", "100");
      expect(addSong).toEqual({
        added: "100"
      });
    });
  
    test("not found error if no such user", async function () {
      try {
        await User.addSongToFavorites("nope", "100");
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  
    test("bad request error if song already in favorites", async function () {
      try {
        await User.addSongToFavorites("u1", "1");
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
});

/************************************** removeSongFromFavorites */

describe("removeSongFromFavorites", function () {

    test("works", async function () {
      const removedSong = await User.removeSongFromFavorites("u1", "1");
      expect(removedSong).toEqual({
        deleted: "1"
      });
    });
  
    test("not found error if no such user", async function () {
      try {
        await User.removeSongFromFavorites("nope", "1");
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  
    test("not found error if song isn't in favorites", async function () {
      try {
        await User.removeSongFromFavorites("u1", "100");
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
});

/************************************** createNewPlaylist */

describe("createNewPlaylist", function () {
    
    test("works", async function () {
      const newPlaylist = await User.createNewPlaylist(
          "p1", 
          "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8dmlld3xlbnwwfHwwfHw%3D&w=1000&q=80",
          "u1"
      );
      expect(newPlaylist).toEqual({
        playlist_id: expect.any(Number),
        playlist_name: "p1",
        img_url: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8dmlld3xlbnwwfHwwfHw%3D&w=1000&q=80",
        username: "u1"
      });
    });

    test("works without URL", async function () {
      const newPlaylist = await User.createNewPlaylist(
          "p1",
          null, 
          "u1"
      );
      expect(newPlaylist).toEqual({
        playlist_id: expect.any(Number),
        playlist_name: "p1",
        img_url: "https://us.123rf.com/450wm/soloviivka/soloviivka1606/soloviivka160600001/59688426-music-note-vector-icon-white-on-black-background.jpg?ver=6",
        username: "u1"
      });
    });
  
});

/************************************** removePlaylist */

describe("removePlaylist", function () {
   
    test("works", async function () {
      const addedPlaylist = await User.createNewPlaylist("p1", null, "u1");
      const deletedPlaylist = await User.removePlaylist(addedPlaylist.playlist_id);
      expect(deletedPlaylist).toEqual({
        deleted: addedPlaylist.playlist_id
      });
    });

    test("NotFoundError when playlist doesn't exist", async function () {
      try{
        await User.removePlaylist(0);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  
});

/************************************** addSongToPlaylist */

describe("addSongToPlaylist", function () {
   
    test("works", async function () {
      const playlist = await User.createNewPlaylist('p1', null, 'u1');
      const addedSong = await User.addSongToPlaylist(playlist.playlist_id, '99');
      expect(addedSong).toEqual({
        added: '99'
      });
    });

    test("NotFoundError when playlist doesn't exist", async function () {
      try{
        await User.addSongToPlaylist(0, '99');
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });

    test("BadRequestError when song already in playlist", async function () {
      const playlist = await User.createNewPlaylist('p1', null, 'u1');
      await User.addSongToPlaylist(playlist.playlist_id, '99');

      try{
        await User.addSongToPlaylist(playlist.playlist_id, '99');
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
  
});

/************************************** removeSongFromPlaylist */

describe("removeSongFromPlaylist", function () {
   
    test("works", async function () {
      const playlist = await User.createNewPlaylist('p1', null, 'u1');
      const addedSong = await User.addSongToPlaylist(playlist.playlist_id, '99');
      const removedSong = await User.removeSongFromPlaylist(addedSong.added, playlist.playlist_id);
      expect(removedSong).toEqual({
        deleted: '99'
      });
    });

    test("NotFoundError when playlist doesn't exist", async function () {
      try{
        await User.removeSongFromPlaylist('99', 0);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });

    test("BadRequestError when song not in playlist", async function () {
      const playlist = await User.createNewPlaylist('p1', null, 'u1');
      
      try{
        await User.removeSongFromPlaylist('99', playlist.playlist_id);
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
  
});

/************************************** getPlaylist */

describe("getPlaylist", function () {
   
    test("works", async function () {
      const newPlaylist = await User.createNewPlaylist('p1', null, 'u1');
      const fetchedP = await User.getPlaylist(newPlaylist.playlist_id);
      expect(fetchedP).toEqual({
        playlist_id: expect.any(Number),
        playlist_name: 'p1',
        img_url: "https://us.123rf.com/450wm/soloviivka/soloviivka1606/soloviivka160600001/59688426-music-note-vector-icon-white-on-black-background.jpg?ver=6",
        username: 'u1',
        tracks: []
      });
    });

    test("NotFoundError when playlist doesn't exist", async function () {
      try{
        await User.getPlaylist(0);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  
});