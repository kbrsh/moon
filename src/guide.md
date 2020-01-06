---
title: Guide
order: 2
---

This guide will introduce you to the basics of Moon while creating a simple todo application. Get started by [installing Moon](/installation) and adding the following to the `<body>` of an HTML file. You can also follow along and load the examples in the [playground](/play).

```html
<div id="root"></div>
```

This is a root element where Moon's view driver will mount the view. Begin the script by importing the HTML elements from Moon's view driver that will be used in the view. A script can be added to a JavaScript file linked to the HTML page or a script tag.

```js
const { div, h1, ul, li, input, button } = Moon.view.m;
```

For the following guide, along with the rest of the documentation, the above HTML and JavaScript is assumed.

After initializing the application, add the following to the script to display a basic todo list view.

```js
const viewTodos = ({ data }) =>
	<ul children=(data.todos.map(todo =>
		<li>{todo}</li>
	))/>;

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
			"Go Shopping"
		]
	};

	return {
		data,
		view: <viewTodos data=data/>
	};
});
```

<a href="/play/#const%20%7B%20div%2C%20h1%2C%20ul%2C%20li%2C%20input%2C%20button%20%7D%20%3D%20Moon.view.m%3B%0A%0Aconst%20viewTodos%20%3D%20(%7B%20data%20%7D)%20%3D%3E%0A%09%3Cul%20children%3D(data.todos.map(todo%20%3D%3E%0A%09%09%3Cli%3E%7Btodo%7D%3C%2Fli%3E%0A%09))%2F%3E%3B%0A%0AMoon.use(%7B%0A%09data%3A%20Moon.data.driver%2C%0A%09view%3A%20Moon.view.driver(%22%23root%22)%0A%7D)%3B%0A%0AMoon.run(()%20%3D%3E%20%7B%0A%09const%20data%20%3D%20%7B%0A%09%09todo%3A%20%22%22%2C%0A%09%09todos%3A%20%5B%0A%09%09%09%22Learn%20Moon%22%2C%0A%09%09%09%22Take%20a%20nap%22%2C%0A%09%09%09%22Go%20Shopping%22%0A%09%09%5D%0A%09%7D%3B%0A%0A%09return%20%7B%0A%09%09data%2C%0A%09%09view%3A%20%3CviewTodos%20data%3Ddata%2F%3E%0A%09%7D%3B%0A%7D)%3B">Try it!</a>

First of all, the `viewTodos` function returns a view. It uses an HTML-like syntax for creating views based on components. In this case, the `ul` and `li` components. Rather than using the normal children syntax for `ul`, they are manually defined with an attribute. This attribute maps every single todo to an `li` element with the todo content as its text. Curly braces are used for interpolation `{todo}`.

Everything in the view language is extra syntax for function calls. In the end, it boils down to:

```js
const viewTodos = ({ data }) =>
	ul({
		children: data.todos.map(todo =>
			li({ children: [Moon.view.m.text({ data: todo })] })
		)
	});
```

Next, `Moon.use` is called with an object. This is how Moon configures **drivers**, programs that give input from the real world and handle output to the real world. In our case, it is called with two properties: `data` and `view`.

The `data` input and output is handled by the Moon data driver, which gives data as input and can accept new data as output. It is responsible for storing data.

The `view` input and output is handled by the Moon view driver, which gives event information as input and can accept a new view as output. It is responsible for providing a functional interface to the DOM, and uses a virtual DOM under the hood. It is passed the `#root` element to tell it where to mount.

Now, an input can be added to the view to allow the user to create todos.

```js
const viewTodos = ({ data }) =>
	<div>
		<input type="text" value=data.todo @input=updateTodo/>
		<button @click=createTodo>Create</button>

		<ul children=(data.todos.map(todo =>
			<li>{todo}</li>
		))/>
	</div>;
```

The `@` syntax in front of attribute names is for DOM events: in this case, the `@input` and `@click` events. The `@input` event runs a handler when the value of an input changes. The `@click` event runs a handler whenever there is a click.

The event handlers will then look like:

```js
const updateTodo = ({ data, view }) => {
	const dataNew = { ...data, todo: view.target.value };

	return {
		data: dataNew,
		view: <viewTodos data=dataNew/>
	};
};

const createTodo = ({ data }) => {
	const dataNew = {
		todo: "",
		todos: [...data.todos, data.todo]
	};

	return {
		data: dataNew,
		view: <viewTodos data=dataNew/>
	};
};
```

The event handlers have the same structure as the function we passed to `Moon.run`. Every time Moon runs a function, it gives it inputs from drivers and expects outputs for drivers. Event handlers are no different.

For the `updateTodo` event handler, the view driver provides event data as input. Using this, new data is created with the updated `todo`. This new data is returned to the data driver to store, and the new view is returned to the view driver to update the DOM.

For the `createTodo` event handler, new data is created again. It has an empty `todo` to clear the input and new `todos` using the current value of `data.todo`. The new data and view are returned to their corresponding drivers to make changes to the real world.

<a href="/play/#const%20%7B%20div%2C%20h1%2C%20ul%2C%20li%2C%20input%2C%20button%20%7D%20%3D%20Moon.view.m%3B%0A%0Aconst%20updateTodo%20%3D%20(%7B%20data%2C%20view%20%7D)%20%3D%3E%20%7B%0A%09const%20dataNew%20%3D%20%7B%20...data%2C%20todo%3A%20view.target.value%20%7D%3B%0A%0A%09return%20%7B%0A%09%09data%3A%20dataNew%2C%0A%09%09view%3A%20%3CviewTodos%20data%3DdataNew%2F%3E%0A%09%7D%3B%0A%7D%3B%0A%0Aconst%20createTodo%20%3D%20(%7B%20data%20%7D)%20%3D%3E%20%7B%0A%09const%20dataNew%20%3D%20%7B%0A%09%09todo%3A%20%22%22%2C%0A%09%09todos%3A%20%5B...data.todos%2C%20data.todo%5D%0A%09%7D%3B%0A%0A%09return%20%7B%0A%09%09data%3A%20dataNew%2C%0A%09%09view%3A%20%3CviewTodos%20data%3DdataNew%2F%3E%0A%09%7D%3B%0A%7D%3B%0A%0Aconst%20viewTodos%20%3D%20(%7B%20data%20%7D)%20%3D%3E%0A%09%3Cdiv%3E%0A%09%09%3Cinput%20type%3D%22text%22%20value%3Ddata.todo%20%40input%3DupdateTodo%2F%3E%0A%09%09%3Cbutton%20%40click%3DcreateTodo%3ECreate%3C%2Fbutton%3E%0A%0A%09%09%3Cul%20children%3D(data.todos.map(todo%20%3D%3E%0A%09%09%09%3Cli%3E%7Btodo%7D%3C%2Fli%3E%0A%09%09))%2F%3E%0A%09%3C%2Fdiv%3E%3B%0A%0AMoon.use(%7B%0A%09data%3A%20Moon.data.driver%2C%0A%09view%3A%20Moon.view.driver(%22%23root%22)%0A%7D)%3B%0A%0AMoon.run(()%20%3D%3E%20%7B%0A%09const%20data%20%3D%20%7B%0A%09%09todo%3A%20%22%22%2C%0A%09%09todos%3A%20%5B%0A%09%09%09%22Learn%20Moon%22%2C%0A%09%09%09%22Take%20a%20nap%22%2C%0A%09%09%09%22Go%20Shopping%22%0A%09%09%5D%0A%09%7D%3B%0A%0A%09return%20%7B%0A%09%09data%2C%0A%09%09view%3A%20%3CviewTodos%20data%3Ddata%2F%3E%0A%09%7D%3B%0A%7D)%3B">Try it!</a>

This guide resulted in an extremely basic todo application, but can be extended to support more features. Try the following exercises to test your knowledge:

* Add support for removing/completing todos using [events](/view#events) and [conditionals](/view#conditionals).
* Add support for editing todos using the `@dblclick` event.
* Make the application more modular using [components](/view#components).

By default, the [playground](/play) has a fully functioning todo application that has a few more advanced features. Try extending it with what you've learned!
