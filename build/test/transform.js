const babel = require("@babel/core");
const compiler = require("../../packages/moon-compiler/dist/moon-compiler.min.js");

module.exports = {
	process(src, filename) {
		return babel.transformSync(compiler.compile(src), { filename, sourceMaps: true });
	}
};
