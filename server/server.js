const express = require("express");
const app = express();
const pg = require("pg-promise");
app.get("/", (req, res) => {
  console.log("Hello there!");
  res.send("General Kenobi...");
});

app.listen(3000);
