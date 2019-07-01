const rollup = require("rollup");
const babel = require("rollup-plugin-babel");
const eslint = require("rollup-plugin-eslint").eslint;
const includePaths = require("rollup-plugin-includepaths");
const uglify = require("uglify-js");
const gzipSize = require("gzip-size");
const fs = require("fs");
const path = require("path");
const pkg = require("../package.json");
const SPACES_RE = /  /g;
const ENV_RE = /process\.env\.MOON_ENV/g;

async function build(package) {
	const options = require(`../packages/${package}/config.js`);
	const name = options.name;
	const exportName = options.exportName;
	const type = options.type;

	const comment = `${type === "executable" ? "#!/usr/bin/env node\n" : ""}/**
 * ${name} v${pkg.version}
 * Copyright 2016-2019 Kabir Shah
 * Released under the MIT License
 * https://kbrsh.github.io/moon
 */\r\n`;

	const bundle = await rollup.rollup({
		input: `./packages/${package}/src/index.js`,
		plugins: [
			includePaths({ paths: ["./packages"] }),
			eslint(),
			babel()
		],
		onwarn: (warning) => {
			if (warning.code !== "CIRCULAR_DEPENDENCY") {
				console.warn(`Rollup [Warn]: ${warning}`);
			}
		}
	});

	let { output } = await bundle.generate({
		name: exportName,
		format: "iife"
	});

	output = output[0].code;
	output = output.replace(SPACES_RE, "\t");

	if (type === "module") {
		output = fs.readFileSync("./build/wrapper.js").toString().replace("MODULE_NAME", exportName).replace("MODULE_CONTENT", output.split("\n").slice(1, -3).join("\n"));
	}

	output = output.replace("'use strict'", "\"use strict\"");

	const developmentCode = comment + output.replace(ENV_RE, '"development"');
	const productionCode = comment + uglify.minify(output.replace(ENV_RE, '"production"'), {
		output: {
			ascii_only: true
		}
	}).code;

	fs.writeFileSync(`./packages/${package}/dist/${package}.js`, developmentCode);
	fs.writeFileSync(`./packages/${package}/dist/${package}.min.js`, productionCode);

	console.log(`${name} development -> ${developmentCode.length / 1000}kb / ${gzipSize.sync(developmentCode) / 1000}kb (gzip)`);
	console.log(`${name} production -> ${productionCode.length / 1000}kb / ${gzipSize.sync(productionCode) / 1000}kb (gzip)\n`);
}

const packages = fs.readdirSync("./packages");

for (let i = 0; i < packages.length; i++) {
	const package = packages[i];

	if (package.slice(0, 4) === "moon" && fs.lstatSync(`./packages/${package}`).isDirectory()) {
		build(packages[i]);
	}
}
