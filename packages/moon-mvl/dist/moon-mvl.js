/**
 * Moon MVL v1.0.0-beta.2
 * Copyright 2016-2018 Kabir Shah
 * Released under the MIT License
 * https://kbrsh.github.io/moon
 */
var Moon = require("moon");

var slash = require("./slash");

var _require = require("./css"),
		addClass = _require.addClass,
		scopeCSS = _require.scopeCSS;

var scriptRE = /((?:.|\n)*?)<script>((?:.|\n)*)<\/script>((?:.|\n)*)/;
var styleRE = /((?:.|\n)*?)<style>((?:.|\n)*)<\/style>((?:.|\n)*)/;

module.exports = function (name, input, hot) {
	var inputJS = null;
	var inputCSS = null;
	input = input.replace(scriptRE, function (match, prefix, script, suffix) {
		inputJS = script;
		return prefix + suffix;
	});
	input = input.replace(styleRE, function (match, prefix, style, suffix) {
		inputCSS = style;
		return prefix + suffix;
	});
	var tree = Moon.parse(input);
	var outputJS;
	var outputCSS = null;

	if (inputCSS !== null) {
		var scope = "moon-".concat(name, "-").concat(slash(name));
		tree = addClass(tree, scope);
		outputCSS = scopeCSS(scope, inputCSS);
	}

	if (inputJS === null) {
		outputJS = "const _moonOptions={};";
	} else {
		outputJS = inputJS.replace("export default", "const _moonOptions=");
	}

	outputJS = "import Moon from \"moon\";".concat(outputJS, "_moonOptions.view=function(m,instance,locals){").concat(Moon.generate(tree, null), "};export default Moon.extend(\"").concat(name, "\",_moonOptions);");

	if (hot) {
		outputJS = "\n\t\t\timport { registerJS, registerCSS } from \"moon-mvl/lib/hot\";\n\t\t\tconst _moonRemoveJS = [];\n\t\t\tconst _moonRemoveCSS = registerCSS(`".concat(outputCSS, "`);\n\t\t\t").concat(outputJS.replace("export default", "\n\t\t\t\t\tconst _moonOnCreate = _moonOptions.onCreate;\n\t\t\t\t\t_moonOptions.onCreate = function() {\n\t\t\t\t\t\t_moonRemoveJS.push(registerJS(this));\n\n\t\t\t\t\t\tif (_moonOnCreate !== undefined) {\n\t\t\t\t\t\t\t_moonOnCreate(this, []);\n\t\t\t\t\t\t}\n\t\t\t\t\t};\n\t\t\t\t\t$&\n\t\t\t\t"), "\n\t\t\tif (module.hot) {\n\t\t\t\tmodule.hot.dispose(() => {\n\t\t\t\t\tfor (let i = 0; i < _moonRemoveJS.length; i++) {\n\t\t\t\t\t\t_moonRemoveJS[i]();\n\t\t\t\t\t}\n\n\t\t\t\t\t_moonRemoveCSS();\n\t\t\t\t});\n\t\t\t}\n\t\t");
		outputCSS = null;
	}

	return {
		js: outputJS,
		css: outputCSS
	};
};
