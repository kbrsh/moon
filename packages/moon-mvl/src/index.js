import slash from "./slash";
import { addClass, scopeCSS } from "./css";

const Moon = require("moon");

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

	const tree = Moon.parse(Moon.lex(input));
	let outputJS;
	let outputCSS = null;

	if (inputCSS !== null) {
		const scope = `moon-${slash(name)}`;

		addClass(tree, scope);

		outputCSS = scopeCSS(scope, inputCSS);
	}

	if (inputJS === null) {
		outputJS = "const _moonOptions={};";
	} else {
		outputJS = inputJS.replace("export default", "const _moonOptions=");
	}

	outputJS = `import Moon from "moon";${outputJS}_moonOptions.name="${name}";_moonOptions.view=function(m,data){${Moon.generate(tree)}};Moon(_moonOptions);`;

	if (hot) {
		outputJS += `
			import { registerCSS } from "moon-mvl/lib/hot";

			const _moonRemoveCSS = registerCSS(\`${outputCSS}\`);

			if (module.hot) {
				module.hot.dispose(() => {
					Moon.set({});

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
