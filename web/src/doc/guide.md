---
title: Guide
order: 2
---

This guide will introduce you to the basics of Moon while creating a simple todo application. Get started by creating an `index.html` file with the following contents.

```html
<!DOCTYPE html>
<html>
	<head>
		<title>Moon Todo</title>
	</head>
	<body>
		<div id="root"></div>

		<script id="view" type="text/mvl">
			<!-- View -->
		</script>

		<script src="//unpkg.com/moon"></script>
		<script>
			// Data
		</script>
	</body>
</html>
```

The view script is a special script of type `text/mvl`, meaning it uses the _Moon View Language_ to define the main view of the todo app. The data script is a script that will create the app and define the data that the view is responsible for displaying.

For the following examples, along with the rest of the documentation, the above HTML file can be used. If a code sample is in `mvl`, you can assume that it goes under the view section. Likewise, if a code sample is in `js` you can assume it goes under the data section.

To get started with a basic todo view, add the following contents to their corresponding sections.

```mvl
<ul>
	<li For={$todo in todos}>{$todo.value}</li>
</ul>
```

```js
Moon({
	root: "#root",
	view: document.getElementById("view").innerHTML,
	todos: []
});
```

The view is just like an HTML file, but the `For` attribute is special and provided by Moon. It is a _component_ using _directive syntax_, where a single element is passed as an argument. In this case, the `For` component will iterate through every item in the `todos` array and will alias it to a _local_ named `$todo`. For each of these, a new `<li>` element will be appended with the contents of `$todo.value`.

Notice the single curly braces `{}`, they are there to _interpolate_ data from the data provided to `Moon`. In this case, we provide two options: `root` and `view` along with our own custom data: `todos`.

The `root` option decides where the view will be created, and the `view` option defines what the view will be. The `todos` are just an empty array since the user will be responsible for creating them.

Now, an input can be added to the view to allow the user to create todos.

```mvl
<input type="text" @bind={value}/>
<button @click={createTodo()}>Create</button>
```

The `@` syntax in front of attribute names is for _events_: lifecycle events, browser events, and custom events. In this case, we are using the `@bind` and `@click` events. The `@bind` event binds the value of an input to a given variable and the value of the variable to the value of the input (two-way data binding). The `@click` event handles the browser click event and will call `createTodo()` when invoked.

Change the data section to match the following to hold a value and create a todo.

```js
Moon({
	root: "#root",
	view: document.getElementById("view").innerHTML,
	value: "",
	todos: [],
	createTodo() {
		this.todos.push({
			value: this.value,
			complete: false
		});

		this.update({
			value: "",
			todos: this.todos
		});
	}
});
```

Since the `value` property will be set by the `@bind` event, it will be available under `this` like all other properties. After pushing a new todo to the existing list of todos, we call the builtin method `update` with new values for `value` and `todos` to update the view.

<div id="example-guide" class="example"></div>

<script>
	Moon({
		root: "#example-guide",
		view: "<ul><li For={$todo in todos}>{$todo.value}</li></ul><input type=\"text\" @bind={value}/><button @click={createTodo()}>Create</button>",
		value: "",
		todos: [],
		createTodo: function() {
			this.todos.push({
				value: this.value,
				complete: false
			});

			this.update({
				value: "",
				todos: this.todos
			});
		}
	});
</script>

This guide resulted in an extremely basic todo application, but can be extended to support more features. Try the following exercises to test your knowledge.

* Add support for removing/completing todos using [events](./views.html#events) and [`If`](./views.html#conditionals).
* Add support for editing todos using the `@dblclick` event.
* Add support for filtering todos using [data functions](./data.html).
* Make the application more modular using [components](./components.html).
