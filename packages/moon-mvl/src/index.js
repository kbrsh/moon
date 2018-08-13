const Moon = require("moon");
const slash = require("./slash");
const { addClass, scopeCSS } = require("./css");

const scriptRE = /((?:.|\n)*?)<script>((?:.|\n)*)<\/script>((?:.|\n)*)/;
const styleRE = /((?:.|\n)*?)<style>((?:.|\n)*)<\/style>((?:.|\n)*)/;

module.exports = (name, input, hot) => {
	let inputJS = null;
	let inputCSS = null;

	input = input.replace(scriptRE, (match, prefix, script, suffix) => {
		inputJS = script;
		return prefix + suffix;
	});

	input = input.replace(styleRE, (match, prefix, style, suffix) => {
		inputCSS = style;
		return prefix + suffix;
	});

	let tree = Moon.parse(input);
	let outputJS;
	let outputCSS = null;

	if (inputCSS !== null) {
		const scope = `moon-${name}-${slash(name)}`;
		tree = addClass(tree, scope);
		outputCSS = scopeCSS(scope, inputCSS);
	}

	if (inputJS === null) {
		outputJS = "const _moonOptions={};";
	} else {
		outputJS = inputJS.replace("export default", "const _moonOptions=");
	}

	outputJS = `import Moon from "moon";export default Moon.extend("${name}",function(){${outputJS}_moonOptions.view=function(m,instance,locals){${Moon.generate(tree, null)}};return _moonOptions;});`;

	if (hot) {
		outputJS = `
			import { registerJS, registerCSS } from "moon-mvl/lib/hot";
			const _moonRemoveJS = [];
			const _moonRemoveCSS = registerCSS(\`${outputCSS}\`);
			${
				outputJS.replace("return _moonOptions;", `
					const _moonOnCreate = _moonOptions.onCreate;
					_moonOptions.onCreate = function() {
						_moonRemoveJS.push(registerJS(this));

						if (_moonOnCreate !== undefined) {
							_moonOnCreate();
						}
					};
					$&
				`)
			}
			if (module.hot) {
				module.hot.dispose(() => {
					for (let i = 0; i < _moonRemoveJS.length; i++) {
						_moonRemoveJS[i]();
					}

					_moonRemoveCSS();
				});
			}
		`;

		outputCSS = null;
	}

	return {
		js: outputJS,
		css: outputCSS
	};
};
