var MoonMVL = module.exports;

var config = {
	theme: "nox",
	mode: "htmlmixed",
	value: `<div>
	<h1>Todo List</h1>
	<for={$todo, $index} of={todos} name="ul">
		<li @click={() => { remove($index); }}>{$todo}</li>
	</for>
	<input placeholder="What do you need to do?" @keydown={append}/>
</div>

<script>
	export default {
		data: {
			todos: ["Learn Moon", "Build an application", "Take a nap"],

			append(event, { todos }) {
				if (event.keyCode === 13) {
					Moon.set({
						todos: todos.concat([event.target.value])
					});

					event.target.value = "";
				}
			},
			remove(index) {
				Moon.set({
					todos: todos.filter((todo, todoIndex) => index !== todoIndex)
				});
			}
		}
	};
</script>`,
	lineNumbers: true,
	indentWithTabs: true
};

var editor = CodeMirror(document.getElementById("editor"), config);
var result = document.getElementById("result");

function render() {
	var value = editor.getValue();
	var compiled = MoonMVL("Root", value);
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
				<script>${compiled.js.replace(`import Moon from "moon";`, "").replace("Moon(_moonOptions);", `_moonOptions.root="#root";Moon(_moonOptions);`)}</script>
			</body>
		</html>
	`;
}

editor.on("change", render);
render();
