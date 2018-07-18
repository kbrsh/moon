const fs = require("fs");
const path = require("path");
const Moon = require("moon");

const cssRE = /([@#.="':\w\s\-\[\]()]+)(\s*,|(?:{[\s\n]*(?:[\w\n]+:[\w\s\n(),]+;[\s\n]*)*}))/g;

module.exports = (file, contents) => {
	let js = "import Moon from \"moon\";";
	let css;
	let deps = [];

	let view = "";
	let data = "{};";

	const fileName = path.basename(file).slice(0, -4);
	const directoryName = path.dirname(file);
	const name = path.basename(directoryName);

	if (fs.existsSync(path.join(directoryName, fileName + ".js"))) {
		const dep = `.${path.sep}${fileName}.js`;
		deps.push(dep);
		js += `import data from "${dep}";`;
		data = "data;";
	}

	const cssPath = path.join(directoryName, fileName + ".css");
	if (fs.existsSync(cssPath)) {
		const scope = `moon-${name}-${slash(name)}`;
		view = Moon.parse(contents);
		css = fs.readFileSync(css).toString().replace(cssRE, (match, selector, rule) => {
			return selector.replace(trailingWhitespaceRE, "") + "." + scope;
		});
	} else {
		view = Moon.compile(contents);
	}

	js += `export default Moon.extend("${name}",function(){var options=${data}options.view=function(m,instance,locals){${view}};return options;});`;

	return {
		js: js,
		css: css,
		deps: deps
	};
};
