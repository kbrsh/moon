const rollup = require("rollup");
const fs = require("fs");
const path = require("path");
const cwd = process.cwd();

const options = {
  format: "iife",
  name: "Moon"
};

async function build() {
  const bundle = await rollup.rollup({
    input: path.join(cwd, "/src/index.js")
  });

  const { code } = await bundle.generate(options);
  fs.writeFileSync(path.join(cwd, "/dist/moon.js"), fs.readFileSync(path.join(cwd, "/src/wrapper.js")).toString().replace("INSERT", code.split("\n").slice(1, -3).join("\n")).replace("'use strict'", "\"use strict\""));
}

build();
