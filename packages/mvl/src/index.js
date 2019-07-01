import compile from "moon-compiler/src/index";
import slash from "./slash";
import { addClass, scopeCSS } from "./css";

const scriptRE = /(?:(?:.|\n)*?)<script>((?:.|\n)*)<\/script>(?:(?:.|\n)*)/;
const styleRE = /(?:(?:.|\n)*?)<style>((?:.|\n)*)<\/style>(?:(?:.|\n)*)/;

module.exports = (name, input) => {
	let inputJS = null;
	let inputCSS = null;

	const scriptMatch = input.match(scriptRE);

	if (scriptMatch !== null) {
		inputJS = scriptMatch[1];
	}

	const styleMatch = input.match(styleRE);

	if (styleMatch !== null) {
		inputCSS = styleMatch[1];
	}

	let transform = (tree) => tree;
	let outputJS = null;
	let outputCSS = null;

	if (inputCSS !== null) {
		const scope = `moon-${slash(name)}`;

		transform = (tree) => {
			addClass(tree, scope);
			return tree;
		};

		outputCSS = scopeCSS(scope, inputCSS);
	}

	if (inputJS !== null) {
		outputJS = `import Moon from "moon";${compile(inputJS, { transform })}`;
	}

	return {
		js: outputJS,
		css: outputCSS
	};
};
