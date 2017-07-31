const Firebase = require("firebase/app");
require("firebase/database");

const path = require("path");

const express = require("express");
const app = express();

const isDevelopment = process.env.NODE_ENV === "development";

if(isDevelopment === true) {
  app.use("/dist/js", express.static(path.resolve("./dist/js")));
  app.use("/dist/css", express.static(path.resolve("./dist/css")));
  app.use("/img", express.static(path.resolve("./img")));
} else {
  app.use(express.static(path.resolve("./dist/")));
}

const indexPath = path.resolve(isDevelopment === true ? "./index.html" : "./dist/index.html");

app.get("/", (req, res) => {
  res.sendFile(indexPath);
});

app.listen(8080);
