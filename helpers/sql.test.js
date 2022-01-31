
const { sqlForPartialUpdate } = require("./sql");


describe("sqlForPartialUpdate", function () {
  test("works: 1 item", function () {
    const result = sqlForPartialUpdate(
        { f1: "v1" },
        { f1: "f1", fF2: "f2" });
    expect(result).toEqual({
      setCols: "\"f1\"=$1, \"img_url\"=$2",
      values: ["v1", "https://i.pinimg.com/474x/65/25/a0/6525a08f1df98a2e3a545fe2ace4be47.jpg"],
    });
  });

  test("works: 2 items", function () {
    const result = sqlForPartialUpdate(
        { f1: "v1", jsF2: "v2" },
        { jsF2: "f2" });
    expect(result).toEqual({
      setCols: "\"f1\"=$1, \"f2\"=$2, \"img_url\"=$3",
      values: ["v1", "v2", "https://i.pinimg.com/474x/65/25/a0/6525a08f1df98a2e3a545fe2ace4be47.jpg"],
    });
  });
});
