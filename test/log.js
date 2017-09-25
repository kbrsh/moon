const path = require("path");
const fs = require("fs");

console.log(fs.readFileSync(path.resolve("./coverage/summary.txt")).toString());
console.log("\nOpen:\n  \033[0;34m'file://" + __dirname + "/test.html'\033[0;0m\n  in your browser to see Moon tests.");
