const jwt = require("jsonwebtoken");
const { createToken } = require("./tokens");
const { SECRET_KEY } = require("../config");

describe("createToken", function () {
  test("works", async function () {
    const token = await createToken({username: "test"});
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
        iat: expect.any(Number),
        username: "test",
    });
  });

});
