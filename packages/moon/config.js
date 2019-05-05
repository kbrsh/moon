const fs = require("fs");

module.exports = {
	name: "Moon",
	exportName: "Moon",
	format: "iife",
	transformBefore: (output) => fs.readFileSync("./packages/moon/src/wrapper.js").toString().replace("INSERT", output.split("\n").slice(1, -3).join("\n")).replace("'use strict'", "\"use strict\""),
	transformAfter: (developmentCode, productionCode) => ({ developmentCode, productionCode })
};
