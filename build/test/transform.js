const babel = require("@babel/core");
const compile = require("../../packages/moon-compiler/dist/moon-compiler.min.js");

module.exports = {
	process(src) {
		return babel.transformSync(compile(src), { sourceMaps: true });
	}
};
