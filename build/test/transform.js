const babel = require("@babel/core");
const compile = require("../../packages/moon-compiler/dist/moon-compiler.min.js");

module.exports = {
	process(src, filename) {
		return babel.transformSync(compile(src), { filename, sourceMaps: true });
	}
};
