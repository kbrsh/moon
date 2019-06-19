var MoonMVL = module.exports;

function merge(obj1, obj2) {
	for (var key in obj2) {
		obj1[key] = obj2[key];
	}

	return obj1;
}

var config = {
	theme: "nox",
	lineNumbers: true,
	indentWithTabs: true
};

var MVLEditor = CodeMirror(document.getElementById("editor-mvl"), merge(config, {
	mode: "htmlmixed"
}));

var JSEditor = CodeMirror(document.getElementById("editor-javascript"), merge(config, {
	mode: "javascript"
}));
