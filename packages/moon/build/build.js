const rollup = require("rollup");
const babel = require("rollup-plugin-babel");
const eslint = require("rollup-plugin-eslint").eslint;
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
			babel()
		]
	});

	let { output } = await bundle.generate(options);
	output = output[0].code;

	output = fs.readFileSync(path.join(cwd, "/src/wrapper.js")).toString().replace("INSERT", output.split("\n").slice(1, -3).join("\n")).replace("'use strict'", "\"use strict\"");

	const developmentCode = comment + output.replace(ENV_RE, '"development"');
	const productionCode = comment + uglify.minify(output.replace(ENV_RE, '"production"')).output;

	fs.writeFileSync(path.join(cwd, "/dist/moon.js"), developmentCode);
	fs.writeFileSync(path.join(cwd, "/dist/moon.min.js"), productionCode);

	console.log("Moon development -> " + developmentCode.length / 1000 + "kb");
	console.log("Moon production -> " + productionCode.length / 1000 + "kb");
	console.log("");
	console.log("Moon development (gzipped) -> " + gzipSize.sync(developmentCode) / 1000 + "kb");
	console.log("Moon production (gzipped) -> " + gzipSize.sync(productionCode) / 1000 + "kb");
}

build();
