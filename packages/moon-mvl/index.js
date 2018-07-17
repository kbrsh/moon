const fs = require("fs");
const path = require("path");
const Moon = require("moon");

module.exports = function(file, contents) {
	let js = "import Moon from \"moon\";";
	let css = "";
	let deps = [];

	const view = "function(m,instance,locals){" + Moon.compile(this.contents) + "};";
	let data = "{};";

	const fileName = path.basename(file).slice(0, -4);
	const directoryName = path.dirname(file);
	if (fs.existsSync(path.join(directoryName, fileName + ".js"))) {
		const dep = `.${path.sep}${fileName}.js`;
		deps.push(dep);
		js += `import data from "${dep}";`;
		data = "data;";
	}

	js += `export default Moon.extend("${path.basename(directoryName)}",function(){var options=${data}options.view=${view}return options;});`;

	return {
		js: js,
		css: css,
		deps: deps
	};
};
