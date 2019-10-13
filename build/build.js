const rollup = require("rollup");
const babel = require("rollup-plugin-babel");
const eslint = require("rollup-plugin-eslint").eslint;
const uglify = require("uglify-js");
const gzipSize = require("gzip-size");
const fs = require("fs");
const path = require("path");
const version = require("../package.json").version;
const spacesRE = /  /g;
const versionRE = /process\.env\.MOON_VERSION/g;
const envRE = /process\.env\.MOON_ENV/g;

const resolver = {
	resolveId(id, origin) {
		return path.extname(id) === "" ? path.join("./packages", id) + ".js" : id;
	}
};

async function build(package) {
	const options = require(`../packages/${package}/config.js`);
	const name = options.name;
	const nameExport = options.nameExport;
	const type = options.type;

	const comment = `${type === "executable" ? "#!/usr/bin/env node\n" : ""}/**
 * ${name} v${version}
 * Copyright 2016-2019 Kabir Shah
 * Released under the MIT License
 * https://kbrsh.github.io/moon
 */\r\n`;

	try {
		const bundle = await rollup.rollup({
			input: `./packages/${package}/src/index.js`,
			plugins: [
				resolver,
				eslint(),
				babel()
			],
			onwarn: warning => {
				if (warning.code !== "CIRCULAR_DEPENDENCY") {
					console.warn(`Rollup [Warn]: ${warning}`);
				}
			}
		});

		let { output } = await bundle.generate({
			name: nameExport,
			format: "iife"
		});

		output = output[0].code;
		output = output.replace(spacesRE, "\t");

		if (type === "module") {
			output = fs.readFileSync("./build/wrapper.js").toString().replace("MODULE_NAME", nameExport).replace("MODULE_CONTENT", output.split("\n").slice(1, -3).join("\n"));
		}

		output = output.replace("'use strict'", "\"use strict\"");
		output = output.replace(versionRE, `"${version}"`);

		const developmentCode = comment + output.replace(envRE, '"development"');
		const productionCode = comment + uglify.minify(output.replace(envRE, '"production"'), {
			output: {
				ascii_only: true
			}
		}).code;

		fs.writeFileSync(`./packages/${package}/dist/${package}.js`, developmentCode);
		fs.writeFileSync(`./packages/${package}/dist/${package}.min.js`, productionCode);

		console.log(`${name} development -> ${developmentCode.length / 1000}kb / ${gzipSize.sync(developmentCode) / 1000}kb (gzip)`);
		console.log(`${name} production -> ${productionCode.length / 1000}kb / ${gzipSize.sync(productionCode) / 1000}kb (gzip)\n`);
	} catch (error) {
		console.error(error);
	}
}

const packages = fs.readdirSync("./packages");

for (let i = 0; i < packages.length; i++) {
	const package = packages[i];

	if (package.slice(0, 4) === "moon" && fs.lstatSync(`./packages/${package}`).isDirectory()) {
		build(packages[i]);
	}
}
