---
title: Guide
order: 2
---

This guide will introduce you to the basics of Moon while creating a simple todo application. Get started by [installing Moon](/moon/doc/installation.html) and adding the following to the `<body>` of an HTML file. You can also follow along and load the examples in the [playground](/moon/play).

```html
<div id="root"></div>
```

This is a root element where Moon's view driver will mount the view. For the following guide, along with the rest of the documentation, the above HTML is assumed.

To get started with a basic todo view, add the following contents to a JavaScript file linked to the HTML page or a `<script>` tag.

```js
const Todos = ({ data }) => (
	<for={todo} of={data.todos} name="ul">
		<li>{todo}</li>
	</for>
);

Moon.use({
	data: Moon.data.driver({
		todo: "",
		todos: [
			"Learn Moon",
			"Take a nap",
			"Go Shopping"
		]
	}),
	view: Moon.view.driver("#root")
});

Moon.run(({ data }) => ({
	view: (<Todos data={data}/>)
}));
```

<a href="/moon/play#const%20Todos%20%3D%20(%7B%20data%20%7D)%20%3D%3E%20(%0A%09%3Cfor%3D%7Btodo%7D%20of%3D%7Bdata.todos%7D%20name%3D%22ul%22%3E%0A%09%09%3Cli%3E%7Btodo%7D%3C%2Fli%3E%0A%09%3C%2Ffor%3E%0A)%3B%0A%0AMoon.use(%7B%0A%09data%3A%20Moon.data.driver(%7B%0A%09%09todo%3A%20%22%22%2C%0A%09%09todos%3A%20%5B%0A%09%09%09%22Learn%20Moon%22%2C%0A%09%09%09%22Take%20a%20nap%22%2C%0A%09%09%09%22Go%20Shopping%22%0A%09%09%5D%0A%09%7D)%2C%0A%09view%3A%20Moon.view.driver(%22%23root%22)%0A%7D)%3B%0A%0AMoon.run((%7B%20data%20%7D)%20%3D%3E%20(%7B%0A%09view%3A%20(%3CTodos%20data%3D%7Bdata%7D%2F%3E)%0A%7D))%3B">Try it!</a>

First of all, the `Todo` function returns a view using the Moon view language. It uses an HTML-like syntax for creating views based on components. In this case, `<for>` is a component. You'll notice how we pass `name="ul"`, which tells the `<for>` component to wrap the loop in a `ul` tag. Inside the loop, we render an `li` element. The curly braces `{}` are for interpolating JavaScript expressions.

Everything in the view language is extra syntax for function calls. In the end, `<for>` and `<li>` boil down to a function call, like this:

```js
for({
	name: "ul"
	of: todos,
	children: (todo) => li({ children: [ text({ "": todo }) ] })
});
```

However, Moon compiles it to a normal `for` loop for performance.

Next, `Moon.use` is called with an object. This is how Moon configures **drivers**, programs that give input from the real world and handle output to the real world. In our case, we call it with two properties: `data` and `view`.

The `data` input and output is handled by the Moon data driver, which gives data as input and can accept new data as output. It is responsible for storing data. We pass it with default data as configuration, storing the current new todo along with a list of all of the todos.

The `view` input and output is handled by the Moon view driver, which gives event information as input and can accept a new view as output. It is responsible for providing a functional interface to the DOM, and uses a virtual DOM under the hood. We pass it the `#root` element to tell it where to mount.

Now, an input can be added to the view to allow the user to create todos.

```js
const Todos = ({ data }) => (
	<div>
		<input type="text" value={data.todo} @input={updateTodo}/>
		<button @click={createTodo}>Create</button>

		<for={todo} of={data.todos} name="ul">
			<li>{todo}</li>
		</for>
	</div>
);
```

The `@` syntax in front of attribute names is for DOM events. In this case, we are using the `@input` and `@click` events. The `@input` event runs a handler when the value of an input changes. The `@click` event runs a handler whenever there is a click.

Now we can add the event handlers.

```js
const updateTodo = ({ data, view }) => {
	const dataNew = { ...data, todo: view.target.value };

	return {
		data: dataNew,
		view: (<Todos data={dataNew}/>)
	};
};

const createTodo = ({ data }) => {
	const dataNew = {
		todo: "",
		todos: [...data.todos, data.todo]
	};

	return {
		data: dataNew,
		view: (<Todos data={dataNew}/>)
	};
};
```

The event handlers have the same structure as the function we passed to `Moon.run`. Every time Moon runs a function, it gives it inputs from drivers and expects outputs for drivers. Event handlers are no different.

For the `updateTodo` event handler, we get the event data using driver input from `view`. Using this, we make a copy of the data with the updated `todo`, and return new data along with a new view based on that data. These are handled by drivers to store the data and update the DOM for us.

For the `createTodo` event handler, we don't need the event data, only the current state data. Using this, we create a new `data` object with an empty `todo`. This will empty the input so that it doesn't retain the old value. We also create new `todos` using the current value of `data.todo`. We then return the new data along with a new view based on that data for drivers to handle.

<a href="/moon/play#const%20updateTodo%20%3D%20(%7B%20data%2C%20view%20%7D)%20%3D%3E%20%7B%0A%09const%20dataNew%20%3D%20%7B%20...data%2C%20todo%3A%20view.target.value%20%7D%3B%0A%0A%09return%20%7B%0A%09%09data%3A%20dataNew%2C%0A%09%09view%3A%20(%3CTodos%20data%3D%7BdataNew%7D%2F%3E)%0A%09%7D%3B%0A%7D%3B%0A%0Aconst%20createTodo%20%3D%20(%7B%20data%20%7D)%20%3D%3E%20%7B%0A%09const%20dataNew%20%3D%20%7B%0A%09%09todo%3A%20%22%22%2C%0A%09%09todos%3A%20%5B...data.todos%2C%20data.todo%5D%0A%09%7D%3B%0A%0A%09return%20%7B%0A%09%09data%3A%20dataNew%2C%0A%09%09view%3A%20(%3CTodos%20data%3D%7BdataNew%7D%2F%3E)%0A%09%7D%3B%0A%7D%3B%0A%0Aconst%20Todos%20%3D%20(%7B%20data%20%7D)%20%3D%3E%20(%0A%09%3Cdiv%3E%0A%09%09%3Cinput%20type%3D%22text%22%20value%3D%7Bdata.todo%7D%20%40input%3D%7BupdateTodo%7D%2F%3E%0A%09%09%3Cbutton%20%40click%3D%7BcreateTodo%7D%3ECreate%3C%2Fbutton%3E%0A%0A%09%09%3Cfor%3D%7Btodo%7D%20of%3D%7Bdata.todos%7D%20name%3D%22ul%22%3E%0A%09%09%09%3Cli%3E%7Btodo%7D%3C%2Fli%3E%0A%09%09%3C%2Ffor%3E%0A%09%3C%2Fdiv%3E%0A)%3B%0A%0AMoon.use(%7B%0A%09data%3A%20Moon.data.driver(%7B%0A%09%09todo%3A%20%22%22%2C%0A%09%09todos%3A%20%5B%0A%09%09%09%22Learn%20Moon%22%2C%0A%09%09%09%22Take%20a%20nap%22%2C%0A%09%09%09%22Go%20Shopping%22%0A%09%09%5D%0A%09%7D)%2C%0A%09view%3A%20Moon.view.driver(%22%23root%22)%0A%7D)%3B%0A%0AMoon.run((%7B%20data%20%7D)%20%3D%3E%20(%7B%0A%09view%3A%20(%3CTodos%20data%3D%7Bdata%7D%2F%3E)%0A%7D))%3B">Try it!</a>

This guide resulted in an extremely basic todo application, but can be extended to support more features. Try the following exercises to test your knowledge:

* Add support for removing/completing todos using [events](/moon/doc/views.html#events) and [`if`](/moon/doc/views.html#conditionals).
* Add support for editing todos using the `@dblclick` event.
* Add support for filtering todos using [data functions](/moon/doc/data.html).
* Make the application more modular using [components](/moon/doc/views.html#components).

By default, the [playground](/moon/play) has a fully functioning todo application that has a few more advanced features. Try extending it with what you've learned!
