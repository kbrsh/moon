---
title: Views
order: 4
---

The view driver is a driver that handles visual output using the DOM in a browser. It uses a virtual DOM under the hood to ensure fast updates, and it works by replacing the old view with a new one.

## Configuration

The `Moon.data.view` is a function that takes a root element where views will be mounted. This can be a query selector or a direct reference to a DOM element. The view driver will replace this element with the view structure you provide.

```js
// Creates a view driver that mounts on an existing element using a query
// selector.
Moon.view.driver("#root");

// Creates a view driver that mounts on an existing element using a direct DOM
// reference.
Moon.view.driver(document.getElementById("root"));
```

## Input

The view driver provides event information as input. This is useful for event handlers which return their own views, as they can have access to the DOM event information.

```js
function handleClick({ view }) {
	console.log(view); // MouseEvent
	return {};
}

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => {
	return {
		view: (<button @click={handleClick}>Click Me!</button>)
	};
});
```

## Output

The view driver accepts a new view as output and renders it to the DOM using a performant virtual DOM diffing algorithm. This should be a completely new virtual DOM. This keeps immutability and prevents bugs, as every view completely replaces the old one.

```js
Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => {
	return {
		view: (<p>Hello Moon!</p>)
	};
});
```

Moon views are often defined using the _Moon View Language_. The Moon view language is a template language based on HTML and adds support for data interpolation, events, and components.

### JavaScript Syntax

The Moon view language is a superset of JavaScript, and it allows a new type of expression. This expression returns view nodes, and must always be enclosed in parentheses.

```js
// Valid
const paragraph = (<p>Hello Moon!</p>);

// Invalid
const paragraph = <p>Hello Moon!</p>;
```

### Tags

Tags return new view nodes, and they follow normal HTML tag names. They can also have data, which correspond to properties (not attributes) on DOM elements.

Property names can be empty. Property values can also be empty, in which case they default to `true`. Otherwise, the values can be strings or interpolated JavaScript expressions. They are special syntax for function calls, where the content between tags is another property called `children`. This can contain other tags and text.

Additionally, Moon has special properties for `style` and `dataset`. Also, it adds `ariaset` instead of supporting `aria-*` attributes.

```js
const paragraph = (
	<div
		="empty"
		class="blue"
		empty
		style={{ color: "blue" }}
		dataset={{ foo: "bar" }}
		ariaset={{ hidden: true }}
	>
		<p>Hello Moon!</p>
	</div>
);
```

### Text

Text is plaintext with support for basic HTML escape codes, which include `&amp;`, `&gt;`, `&lt;`, `&nbsp;`, and `&quot;`. The rest can be encoded as anything that is valid in a JavaScript string.

```js
const paragraph = (<p>Hello { name }!</p>);
```

### Events

Browser events such as `click` or `input` can be handled by creating an attribute prepended with `@` with one function as a value. This function will be ran like an application, with the DOM event available from the input from the `view` driver.

```js
function handleClick({ view }) {
	console.log(view); // MouseEvent
	return {
		view: (<p>New view!</p>)
	};
}

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => {
	return {
		view: (<button @click={handleClick}>Click Me!</button>)
	};
});
```

### Components

Components are functions of data objects that return view nodes. They are useful for making reusable parts of your view that can be configured through data. Since the data object is also passed children, components can also render children inside of their view node result.

Components should always start with an uppercase letter and return a view object so that Moon can detect which elements are components.

```js
const Component = data => (
	<div class="container" id={data.id}>
		<div class="content" children={data.children}></div>
	</div>
);

const element = (
	<Component id="my-component">
		<p>Hello Moon!</p>
	</Component>
);

/*
	Results in:

	<div class="container" id="my-component">
		<div class="content">
			<p>Hello Moon!</p>
		</div>
	</div>
*/
```

### Conditionals

Elements can be rendered based on certain conditions using the `if`, `else-if`, and `else` components. These components only render their first child if the condition matches. `else-if` and `else` are not required, and `else` defaults to rendering an empty text element.

```js
const conditional = (
	<div>
		<if={foo === "bar"}>
			<p>Foo is bar!</p>
		</if>
		<else-if={condition}>
			<p>Condition is true!</p>
		</else-if>
		<else>
			<p>Condition is false!</p>
		</else>
	</div>
);
```

### Loops

Elements can be rendered multiple times for every element in an array using the `for` component. The empty property accepts two local variables that will be available to every child element. The `of` property will accept an array to iterate over, with the first local variable being the element of the array and the second being the index. The `in` property will accept an object to iterate over, with the first local being the key of the object, and the second being the value.

By default, `for` will render everything inside a `<span>` element. To customize this, you can use the `name` property to set the tag name. Also, you can use the `data` property to set the DOM property data.

```js
// Array
const loop = (
	<for={value} of={array}>
		<p>{value}</p>
	</for>
);

// Array with index local
const loop = (
	<for={value, index} of={array}>
		<p>{index}: {value}</p>
	</for>
);

// Object
const loop = (
	<for={key} in={object}>
		<p>{key}</p>
	</for>
);

// Object with value local
const loop = (
	<for={key, value} of={object}>
		<p>{key}: {value}</p>
	</for>
);

// Name and data options
const loop = (
	<for={value} of={array} name="ul" data={{ class: "blue" }}>
		<li>{value}</li>
	</for>
);
```

### Under the Hood

View nodes are created with `Moon.view.m`. This is a function that takes a type, data, and children. Components are called with data, and one of the properties, `children`, contains child nodes.

```js
// Moon view language
const paragraph = (<p class="blue">Hello Moon!</p>);
const component = (<Component class="blue">Hello Moon!</Component>);

// Function calls
const paragraph = Moon.view.m("p", { class: "blue" }, [
	Moon.view.m("text", { "": "Hello Moon!" }, [])
]);

const component = Component({ class: "blue", children: [
	Moon.view.m("text", { "": "Hello Moon!" }, [])
]});
```
