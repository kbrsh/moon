var config = {
	theme: "nox",
	mode: "javascript",
	value: `const { div, h1, ul, li, input, button } = Moon.view.m;

const updateTodo = ({ data, view }) => {
	const dataNew = {
		...data,
		todo: view.target.value
	};

	return {
		data: dataNew,
		view: <Todos data=dataNew/>
	};
};

const createTodo = ({ data }) => {
	const dataNew = {
		todo: "",
		todos: [...data.todos, data.todo]
	};

	return {
		data: dataNew,
		view: <Todos data=dataNew/>
	};
};

const removeTodo = index => ({ data }) => {
	const dataNew = {
		...data,
		todos: data.todos.filter(
			(todo, todoIndex) =>
				todoIndex !== index
		)
	};

	return {
		data: dataNew,
		view: <Todos data=dataNew/>
	};
};

const Todos = ({ data }) => (
	<div>
		<h1>Todos</h1>
		<input
			type="text"
			placeholder="What needs to be done?"
			value=data.todo
			@input=updateTodo
		/>
		<button @click=createTodo>Create</button>
		<ul children=(data.todos.map((todo, index) =>
			<li @click=(removeTodo(index))>
				{todo}
			</li>
		))/>
	</div>
);

Moon.use({
	data: Moon.data.driver,
	view: Moon.view.driver("#root")
});

Moon.run(() => {
	const data = {
		todo: "",
		todos: [
			"Learn Moon",
			"Take a nap",
			"Go shopping"
		]
	};

	return {
		data,
		view: <Todos data=data/>
	};
});`,
	lineNumbers: true,
	indentWithTabs: true
};

var code = window.location.hash;

if (code.length > 0) {
	config.value = decodeURIComponent(code.slice(1));
}

var editor = CodeMirror(document.getElementById("editor"), config);
var result = document.getElementById("result");

function render() {
	var value = editor.getValue();

	result.srcdoc = `
		<!DOCTYPE html>
		<html>
			<head>
				<title>Moon | Playground Result</title>
			</head>
			<body>
				<div id="root"></div>
				<script src="/play/js/lib/moon.js"></script>
				<script>${MoonCompiler.compile(value)}</script>
			</body>
		</html>
	`;

	window.location.hash = encodeURIComponent(value);
}

editor.on("change", render);
render();
