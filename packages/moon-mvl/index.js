const fs = require("fs");
const path = require("path");
const Moon = require("moon");
const slash = require("./lib/slash");


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
	const fileName = path.basename(file).slice(0, -4);
	const directoryName = path.dirname(file);
	const name = path.basename(directoryName);

	let js = "import Moon from \"moon\";";
	let css;

	let view = "";
	let data = "{};";

	if (fs.existsSync(path.join(directoryName, fileName + ".js"))) {
		js += `import data from ".${path.sep}${fileName}.js";`;
		data = "data;";
	}

	const cssPath = path.join(directoryName, fileName + ".css");
	if (fs.existsSync(cssPath)) {
		const scope = `moon-${name}-${slash(name)}`;
		view = Moon.generate(addClass(Moon.parse(contents), scope), null);
		css = scopeCSS(scope, fs.readFileSync(cssPath).toString());
	} else {
		view = Moon.compile(contents);
	}

	js += `export default Moon.extend("${name}",function(){var options=${data}options.view=function(m,instance,locals){${view}};return options;});`;

	return {
		name: name,
		fileName: fileName,
		js: js,
		css: css
	};
};
