var config = {
	theme: "nox",
	mode: "javascript",
	value: `alert("hello world");`,
	lineNumbers: true,
	indentWithTabs: true
};

var editor = CodeMirror(document.getElementById("editor"), config);
var result = document.getElementById("result");

function render() {
	result.srcdoc = `
		<!DOCTYPE html>
		<html>
			<head>
				<title>Moon | Playground Result</title>
			</head>
			<body>
				<div id="root"></div>
				<script src="/play/js/lib/moon.js"></script>
				<script>${MoonCompiler.compile(editor.getValue())}</script>
			</body>
		</html>
	`;
}

editor.on("change", render);
render();
