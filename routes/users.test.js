"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testPlaylists,
  testFavoriteSongIds,
  tokens
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** GET /users/:username */

describe("GET /users/:username", function () {

  test("works for same user", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${tokens[0]}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        img_url: "https://i.pinimg.com/474x/65/25/a0/6525a08f1df98a2e3a545fe2ace4be47.jpg",
        favoriteSongs: ['1'],
        playlists: [
            {
                playlist_id: expect.any(Number),
                playlist_name: "Favorite Songs",
                img_url: "https://ak.picdn.net/shutterstock/videos/3361085/thumb/1.jpg"
            },
            {
                playlist_id: expect.any(Number),
                playlist_name: "p1",
                img_url: "https://us.123rf.com/450wm/soloviivka/soloviivka1606/soloviivka160600001/59688426-music-note-vector-icon-white-on-black-background.jpg?ver=6"
            }
        ]
      },
    });
  });

  test("unauth for other users", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${tokens[1]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {

  test("works for same user", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
          password: "password1"
        })
        .set("authorization", `Bearer ${tokens[0]}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        imgUrl: "https://i.pinimg.com/474x/65/25/a0/6525a08f1df98a2e3a545fe2ace4be47.jpg",
        favoriteSongs: ['1'],
        playlists: [
            {
                playlist_id: expect.any(Number),
                playlist_name: "Favorite Songs",
                img_url: "https://ak.picdn.net/shutterstock/videos/3361085/thumb/1.jpg"
            },
            {
                playlist_id: expect.any(Number),
                playlist_name: "p1",
                img_url: "https://us.123rf.com/450wm/soloviivka/soloviivka1606/soloviivka160600001/59688426-music-note-vector-icon-white-on-black-background.jpg?ver=6"
            }
        ]
      },
    });
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${tokens[1]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${tokens[0]}`);
    expect(resp.statusCode).toEqual(400);
  });

});


/************************************** POST /users/:username/favorites/add */

describe("POST /users/:username/favorites/add", function () {
  const username = 'u1';
  const songId = '99';

  test("works for same user", async function () {
    const resp = await request(app)
        .post(`/users/u1/favorites/add`)
        .send({username, songId})
        .set("authorization", `Bearer ${tokens[0]}`);
    expect(resp.body).toEqual({ added: songId });
  });

  test("unauth for others", async function () {
    const resp = await request(app)
        .post(`/users/u1/favorites/add`)
        .send({username, songId})
        .set("authorization", `Bearer ${tokens[1]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post(`/users/u1/favorites/add`)
        .send({username, songId});
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request error for song already in favorites", async function () {
    const resp = await request(app)
        .post(`/users/u1/favorites/add`)
        .send({username, songId: '1'})
        .set("authorization", `Bearer ${tokens[0]}`);
    expect(resp.statusCode).toEqual(400);
  });

});

/************************************** DELETE /users/:username/favorites/remove */

describe("DELETE /users/:username/favorites/remove", function () {
  const username = 'u1';
  const songId = '1';

  test("works for same user", async function () {
    const resp = await request(app)
        .delete(`/users/u1/favorites/remove`)
        .send({username, songId})
        .set("authorization", `Bearer ${tokens[0]}`);
    expect(resp.body).toEqual({ deleted: songId });
  });

  test("unauth for others", async function () {
    const resp = await request(app)
        .delete(`/users/u1/favorites/remove`)
        .send({username, songId})
        .set("authorization", `Bearer ${tokens[1]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/users/u1/favorites/remove`)
        .send({username, songId});
    expect(resp.statusCode).toEqual(401);
  });


});

/************************************** POST /users/:username/playlists/add-new */

describe("POST /users/:username/playlists/add-new", function () {
  const data = {
    playlist_name: "new playlist",
    username: 'u1',
    img_url: "https://media.macphun.com/img/uploads/customer/how-to/579/15531840725c93b5489d84e9.43781620.jpg?q=85&w=1340"
  }

  test("works for same user", async function () {
    const resp = await request(app)
        .post(`/users/u1/playlists/add-new`)
        .send(data)
        .set("authorization", `Bearer ${tokens[0]}`);
    expect(resp.body).toEqual({
        playlist_id: expect.any(Number),
        playlist_name: "new playlist",
        username: "u1",
        img_url: "https://media.macphun.com/img/uploads/customer/how-to/579/15531840725c93b5489d84e9.43781620.jpg?q=85&w=1340"
    });
  });

  test("unauth for others", async function () {
    const resp = await request(app)
        .post(`/users/u1/playlists/add-new`)
        .send(data)
        .set("authorization", `Bearer ${tokens[1]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post(`/users/u1/playlists/add-new`)
        .send(data);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing playlist_name", async function () {
    const resp = await request(app)
        .post(`/users/u1/playlists/add-new`)
        .send({
          username: 'u1'
        })
        .set("authorization", `Bearer ${tokens[0]}`);
    expect(resp.statusCode).toEqual(400);
  });

});
/************************************** POST /users/:username/playlists/[id]/add-song */

describe("POST /users/:username/playlists/:id/add-song", function () {

  test("works for same user", async function () {
    const res = await request(app)
    .post(`/users/u1/playlists/add-new`)
    .send({
        playlist_name: "new playlist",
        username: 'u1',
        img_url: "https://media.macphun.com/img/uploads/customer/how-to/579/15531840725c93b5489d84e9.43781620.jpg?q=85&w=1340"
    })
    .set("authorization", `Bearer ${tokens[0]}`);
    const data = {
        playlist_id: res.playlist_id,
        songId: '99'
    }
    const resp = await request(app)
        .post(`/users/u1/playlists/${data.playlist_id}/add-song`)
        .send(data)
        .set("authorization", `Bearer ${tokens[0]}`);
    expect(resp.body).toEqual({added: data.playlist_id});
  });

  test("unauth for others", async function () {
    const resp = await request(app)
        .post(`/users/u1/playlists/${testPlaylists[0].playlist_id}/add-song`)
        .send(data)
        .set("authorization", `Bearer ${tokens[1]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post(`/users/u1/playlists/${testPlaylists[0].playlist_id}/add-song`)
        .send(data);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing playlist_name", async function () {
    const resp = await request(app)
        .post(`/users/u1/playlists/${testPlaylists[0].playlist_id}/add-song`)
        .send({
          playlist_id: testPlaylists[0].playlist_id
        })
        .set("authorization", `Bearer ${tokens[0]}`);
    expect(resp.statusCode).toEqual(400);
  });

});
