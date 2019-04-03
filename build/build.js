const rollup = require("rollup");
const babel = require("rollup-plugin-babel");
const eslint = require("rollup-plugin-eslint").eslint;
const uglify = require("uglify-js");
const gzipSize = require("gzip-size");
const fs = require("fs");
const path = require("path");
const pkg = require("../package.json");
const SPACES_RE = /  /g;
const ENV_RE = /process\.env\.MOON_ENV/g;

async function build(package) {
	const options = require(`../packages/${package}/config.js`);

	const comment = `/**
 * ${options.name} v${pkg.version}
 * Copyright 2016-2019 Kabir Shah
 * Released under the MIT License
 * https://kbrsh.github.io/moon
 */\r\n`;

	const bundle = await rollup.rollup({
		input: `./packages/${package}/src/index.js`,
		plugins: [
			eslint(),
			babel()
		]
	});

	let { output } = await bundle.generate({
		name: options.exportName,
		format: options.format
	});

	output = output[0].code;
	output = output.replace(SPACES_RE, "\t");
	output = options.transform(output);

	const developmentCode = comment + output.replace(ENV_RE, '"development"');
	const productionCode = comment + uglify.minify(output.replace(ENV_RE, '"production"'), {
		output: {
			ascii_only: true
		}
	}).code;

	fs.writeFileSync(`./packages/${package}/dist/${package}.js`, developmentCode);
	fs.writeFileSync(`./packages/${package}/dist/${package}.min.js`, productionCode);

	console.log(`${options.name} development -> ` + developmentCode.length / 1000 + "kb");
	console.log(`${options.name} production -> ` + productionCode.length / 1000 + "kb");
	console.log("");
	console.log(`${options.name} development (gzipped) -> ` + gzipSize.sync(developmentCode) / 1000 + "kb");
	console.log(`${options.name} production (gzipped) -> ` + gzipSize.sync(productionCode) / 1000 + "kb");
	console.log("");
}

const packages = fs.readdirSync("./packages");

for (let i = 0; i < packages.length; i++) {
	const package = packages[i];

	if (fs.lstatSync(`./packages/${package}`).isDirectory()) {
		build(packages[i]);
	}
}
