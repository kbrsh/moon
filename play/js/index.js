var MoonMVL = module.exports;

var config = {
	theme: "nox",
	mode: "htmlmixed",
	value: "<div>Hello Moon!</div>",
	lineNumbers: true,
	indentWithTabs: true
};

var editor = CodeMirror(document.getElementById("editor"), config);
var result = document.getElementById("result");

function render() {
	var value = editor.getValue();
	var compiled = MoonMVL("Component", value);
	result.srcdoc = `
		<!DOCTYPE html>
		<html>
			<head>
				<title>Moon | Playground Result</title>

				<style>${compiled.css}</style>
			</head>
			<body>
				<div id="root"></div>
				<script src="/play/js/lib/moon.js"></script>
				<script>${compiled.js.replace(`import Moon from "moon";`, "")}</script>
				<script>Moon({ root: "#root", view: "<Component/>" });</script>
			</body>
		</html>
	`;
}

editor.on("change", render);
render();
