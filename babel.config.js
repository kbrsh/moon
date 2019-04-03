const fs = require("fs");

const overrides = [];
const packages = fs.readdirSync("./packages");

for (let i = 0; i < packages.length; i++) {
	const package = packages[i];

	if (fs.lstatSync(`./packages/${package}`).isDirectory()) {
		overrides.push({
			test: `./packages/${package}/dist/${package}.js`,
			presets: require(`./packages/${package}/config.js`).babel
		});
	}
}

module.exports = {
	presets: ["@babel/preset-env"],
	overrides: overrides
};
