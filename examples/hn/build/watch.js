"use strict";

const fs = require("fs")
const spawn = require("child_process").spawn;

fs.watch("css", {
    recursive: true
}, (e, file) => {
    const p = spawn("npm", ["run", "bundle-css"], {
        stdio: "inherit"
    });
});
