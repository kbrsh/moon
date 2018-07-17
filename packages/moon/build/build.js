const rollup = require("rollup");
const buble = require("rollup-plugin-buble");
const eslint = require("rollup-plugin-eslint");
const uglify = require("uglify-js");
const gzipSize = require("gzip-size");
const fs = require("fs");
const path = require("path");
const pkg = require("../package.json");
const cwd = process.cwd();
const ENV_RE = /process\.env\.MOON_ENV/g;

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
		input: path.join(cwd, "/src/index.js"),
		plugins: [
			eslint(),
			buble()
		]
	});

	let { code } = await bundle.generate(options);
	code = fs.readFileSync(path.join(cwd, "/src/wrapper.js")).toString().replace("INSERT", code.split("\n").slice(1, -3).join("\n")).replace("'use strict'", "\"use strict\"");

	const developmentCode = comment + code.replace(ENV_RE, '"development"');
	const productionCode = comment + uglify.minify(code.replace(ENV_RE, '"production"')).code;

	fs.writeFileSync(path.join(cwd, "/dist/moon.js"), developmentCode);
	fs.writeFileSync(path.join(cwd, "/dist/moon.min.js"), productionCode);

	console.log("Moon development -> " + developmentCode.length / 1000 + "kb");
	console.log("Moon production -> " + productionCode.length / 1000 + "kb");
	console.log("");
	console.log("Moon development (gzipped) -> " + gzipSize.sync(developmentCode) / 1000 + "kb");
	console.log("Moon production (gzipped) -> " + gzipSize.sync(productionCode) / 1000 + "kb");
}

build();
