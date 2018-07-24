const Moon = require("moon");
const slash = require("./lib/slash");
const scopeCSS = require("./lib/scopeCSS");

const addClass = (element, name) => {
	const attributes = element.attributes;
	const children = element.children;
	let value = name;
	let expression = false;
	let dynamic = false;

	for (let i = 0; i < attributes.length; i++) {
		const attribute = attributes[i];
		if (attribute.key === "class") {
			if (attribute.expression) {
				value = `(${attribute.value}) + " ${name}"`;
				expression = attribute.expression;
				dynamic = attribute.dynamic;
			} else {
				value = `${attribute.value} ${name}`;
			}

			attributes.splice(i, 1);
			break;
		}
	}

	attributes.push({
		key: "class",
		value: value,
		expression: expression,
		dynamic: dynamic
	});

	for (let i = 0; i < children.length; i++) {
		addClass(children[i], name);
	}

	return element;
};

module.exports = (name, mvl, jsPath, js, cssPath, css) => {
	let outputJS = "import Moon from \"moon\";";
	let outputCSS;

	let view = "";
	let data = "{};";

	if (js !== null) {
		outputJS += `import data from "${jsPath}";`;
		data = "data;";
	}

	if (css === null) {
		view = Moon.compile(mvl);
	} else {
		const scope = `moon-${name}-${slash(name)}`;
		view = Moon.generate(addClass(Moon.parse(mvl), scope), null);
		outputCSS = scopeCSS(scope, css);
	}

	js += `export default Moon.extend("${name}",function(){var options=${data}options.view=function(m,instance,locals){${view}};return options;});`;

	return {
		js: outputJS,
		css: outputCSS
	};
};
