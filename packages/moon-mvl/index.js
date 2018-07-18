const fs = require("fs");
const path = require("path");
const Moon = require("moon");
const slash = require("./slash/slash");

const cssRE = /([@#.="':\w\s\-\[\]()]+)(\s*,|(?:{[\s\n]*(?:[\w\n]+:[\w\s\n(),]+;[\s\n]*)*}))/g;
const trailingWhitespaceRE = /\s*$/;

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

module.exports = (file, contents) => {
	let js = "import Moon from \"moon\";";
	let css;

	let view = "";
	let data = "{};";

	const fileName = path.basename(file).slice(0, -4);
	const directoryName = path.dirname(file);
	const name = path.basename(directoryName);

	if (fs.existsSync(path.join(directoryName, fileName + ".js"))) {
		js += `import data from ".${path.sep}${fileName}.js";`;
		data = "data;";
	}

	const cssPath = path.join(directoryName, fileName + ".css");
	if (fs.existsSync(cssPath)) {
		const scope = `moon-${name}-${slash(name)}`;
		view = Moon.generate(addClass(Moon.parse(contents), scope), null);
		css = fs.readFileSync(cssPath).toString().replace(cssRE, (match, selector, rule) => {
			return selector.replace(trailingWhitespaceRE, "") + "." + scope + rule;
		});
	} else {
		view = Moon.compile(contents);
	}

	js += `export default Moon.extend("${name}",function(){var options=${data}options.view=function(m,instance,locals){${view}};return options;});`;

	return {
		js: js,
		css: css
	};
};
