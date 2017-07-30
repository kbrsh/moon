"use strict";

const fs = require("fs");
const path = require("path");

module.exports.empty = (dir) => {
  if(fs.lstatSync(dir).isFile()) {
    fs.unlinkSync(dir);
    return;
  }
  const files = fs.readdirSync(dir);
  for(let i = 0; i < files.length; i++) {
    let filePath = path.join(dir, files[i]);
    if(fs.existsSync(filePath)) {
      module.exports.empty(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  }
}
