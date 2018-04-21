const rollup = require("rollup");
const uglify = require("uglify-js");
const fs = require("fs");
const path = require("path");
const pkg = require("../package.json");
const cwd = process.cwd();

const comment = `/**
 * Moon v${pkg.version}
 * Copyright 2016-2018 Kabir Shah
 * Released under the MIT License
 * https://kbrsh.github.io/moon
 */\r\n`;

const options = {
  format: "iife",
  name: "Moon"
};

async function build() {
  const bundle = await rollup.rollup({
    input: path.join(cwd, "/src/index.js")
  });

  let { code } = await bundle.generate(options);
  code = fs.readFileSync(path.join(cwd, "/src/wrapper.js")).toString().replace("INSERT", code.split("\n").slice(1, -3).join("\n")).replace("'use strict'", "\"use strict\"");

  fs.writeFileSync(path.join(cwd, "/dist/moon.js"), comment + code);
  fs.writeFileSync(path.join(cwd, "/dist/moon.min.js"), comment + uglify.minify(code).code);
}

build();
