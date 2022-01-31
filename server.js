"use strict";

const app = require("./app");
const { PORT } = require("./config");

app.listen(PORT, function () {
  console.log({PORT})
  console.log(`Started on http://localhost:3001`);
});
