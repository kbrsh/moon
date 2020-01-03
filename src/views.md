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

<a href="/play#function%20handleClick(%7B%20view%20%7D)%20%7B%0A%09console.log(view)%3B%20%2F%2F%20MouseEvent%0A%09return%20%7B%7D%3B%0A%7D%0A%0AMoon.use(%7B%0A%09view%3A%20Moon.view.driver(%22%23root%22)%0A%7D)%3B%0A%0AMoon.run(()%20%3D%3E%20%7B%0A%09return%20%7B%0A%09%09view%3A%20(%3Cbutton%20%40click%3D%7BhandleClick%7D%3EClick%20Me!%3C%2Fbutton%3E)%0A%09%7D%3B%0A%7D)%3B">Try it!</a>

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

<a href="/play#Moon.use(%7B%0A%09view%3A%20Moon.view.driver(%22%23root%22)%0A%7D)%3B%0A%0AMoon.run(()%20%3D%3E%20%7B%0A%09return%20%7B%0A%09%09view%3A%20(%3Cp%3EHello%20Moon!%3C%2Fp%3E)%0A%09%7D%3B%0A%7D)%3B">Try it!</a>

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

Property names can be empty. Property values can also be empty, in which case they default to `true`. Otherwise, the values can be strings or interpolated JavaScript expressions surrounded by curly braces. They are special syntax for function calls, where the content between tags is another property called `children`. This can contain other tags and text.

Additionally, Moon has special properties for `style` and `dataset`. Also, it adds `ariaset` instead of supporting `aria-*` attributes.

```js
const paragraph = (
	<div
		="empty"
		id={calculateId()}
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

<a href="/play#const%20calculateId%20%3D%20()%20%3D%3E%20Math.random()%3B%0A%0Aconst%20paragraph%20%3D%20(%0A%09%3Cdiv%0A%09%09%3D%22empty%22%0A%09%09id%3D%7BcalculateId()%7D%0A%09%09class%3D%22blue%22%0A%09%09empty%0A%09%09style%3D%7B%7B%20color%3A%20%22blue%22%20%7D%7D%0A%09%09dataset%3D%7B%7B%20foo%3A%20%22bar%22%20%7D%7D%0A%09%09ariaset%3D%7B%7B%20hidden%3A%20true%20%7D%7D%0A%09%3E%0A%09%09%3Cp%3EHello%20Moon!%3C%2Fp%3E%0A%09%3C%2Fdiv%3E%0A)%3B%0A%0AMoon.use(%7B%0A%09view%3A%20Moon.view.driver(%22%23root%22)%0A%7D)%3B%0A%0AMoon.run(()%20%3D%3E%20%7B%0A%09return%20%7B%0A%09%09view%3A%20paragraph%0A%09%7D%3B%0A%7D)%3B">Try it!</a>

### Text

Text is plaintext with support for basic HTML escape codes, which include `&amp;`, `&gt;`, `&lt;`, `&nbsp;`, and `&quot;`. The rest can be encoded as anything that is valid in a JavaScript string.

On top of that, it supports JavaScript expressions interpolated between curly braces.

```js
const paragraph = (
	<p>Hello {name}! The number of moons is: {count(planets) * 21.625}.</p>
);
```

<a href="/play#const%20count%20%3D%20arr%20%3D%3E%20arr.length%3B%0A%0Aconst%20name%20%3D%20%22Moon%22%3B%0Aconst%20planets%20%3D%20%5B%22Mercury%22%2C%20%22Venus%22%2C%20%22Earth%22%2C%20%22Mars%22%2C%20%22Jupiter%22%2C%20%22Saturn%22%2C%20%22Uranus%22%2C%20%22Neptune%22%5D%3B%0A%0Aconst%20paragraph%20%3D%20(%0A%09%3Cp%3EHello%20%7Bname%7D!%20The%20number%20of%20moons%20is%3A%20%7Bcount(planets)%20*%2021.625%7D.%3C%2Fp%3E%0A)%3B%0A%0AMoon.use(%7B%0A%09view%3A%20Moon.view.driver(%22%23root%22)%0A%7D)%3B%0A%0AMoon.run(()%20%3D%3E%20%7B%0A%09return%20%7B%0A%09%09view%3A%20paragraph%0A%09%7D%3B%0A%7D)%3B">Try it!</a>

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

<a href="/play#function%20handleClick(%7B%20view%20%7D)%20%7B%0A%09console.log(view)%3B%20%2F%2F%20MouseEvent%0A%09return%20%7B%0A%09%09view%3A%20(%3Cp%3ENew%20view!%3C%2Fp%3E)%0A%09%7D%3B%0A%7D%0A%0AMoon.use(%7B%0A%09view%3A%20Moon.view.driver(%22%23root%22)%0A%7D)%3B%0A%0AMoon.run(()%20%3D%3E%20%7B%0A%09return%20%7B%0A%09%09view%3A%20(%3Cbutton%20%40click%3D%7BhandleClick%7D%3EClick%20Me!%3C%2Fbutton%3E)%0A%09%7D%3B%0A%7D)%3B">Try it!</a>

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

<a href="/play#const%20Component%20%3D%20data%20%3D%3E%20(%0A%09%3Cdiv%20class%3D%22container%22%20id%3D%7Bdata.id%7D%3E%0A%09%09%3Cdiv%20class%3D%22content%22%20children%3D%7Bdata.children%7D%3E%3C%2Fdiv%3E%0A%09%3C%2Fdiv%3E%0A)%3B%0A%0Aconst%20element%20%3D%20(%0A%09%3CComponent%20id%3D%22my-component%22%3E%0A%09%09%3Cp%3EHello%20Moon!%3C%2Fp%3E%0A%09%3C%2FComponent%3E%0A)%3B%0A%0AMoon.use(%7B%0A%09view%3A%20Moon.view.driver(%22%23root%22)%0A%7D)%3B%0A%0AMoon.run(()%20%3D%3E%20%7B%0A%09return%20%7B%0A%09%09view%3A%20element%0A%09%7D%3B%0A%7D)%3B">Try it!</a>

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

<a href="/play#const%20foo%20%3D%20%22foo%22%3B%0Aconst%20condition%20%3D%20true%3B%0A%0Aconst%20conditional%20%3D%20(%0A%09%3Cdiv%3E%0A%09%09%3Cif%3D%7Bfoo%20%3D%3D%3D%20%22bar%22%7D%3E%0A%09%09%09%3Cp%3EFoo%20is%20bar!%3C%2Fp%3E%0A%09%09%3C%2Fif%3E%0A%09%09%3Celse-if%3D%7Bcondition%7D%3E%0A%09%09%09%3Cp%3ECondition%20is%20true!%3C%2Fp%3E%0A%09%09%3C%2Felse-if%3E%0A%09%09%3Celse%3E%0A%09%09%09%3Cp%3ECondition%20is%20false!%3C%2Fp%3E%0A%09%09%3C%2Felse%3E%0A%09%3C%2Fdiv%3E%0A)%3B%0A%0AMoon.use(%7B%0A%09view%3A%20Moon.view.driver(%22%23root%22)%0A%7D)%3B%0A%0AMoon.run(()%20%3D%3E%20%7B%0A%09return%20%7B%0A%09%09view%3A%20conditional%0A%09%7D%3B%0A%7D)%3B">Try it!</a>

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

<a href="/play#const%20array%20%3D%20%5B%22Mercury%22%2C%20%22Venus%22%2C%20%22Earth%22%2C%20%22Mars%22%2C%20%22Jupiter%22%2C%20%22Saturn%22%2C%20%22Uranus%22%2C%20%22Neptune%22%5D%3B%0A%0A%2F%2F%20Name%20and%20data%20options%0Aconst%20loop%20%3D%20(%0A%09%3Cfor%3D%7Bvalue%7D%20of%3D%7Barray%7D%20name%3D%22ul%22%20data%3D%7B%7B%20class%3A%20%22blue%22%20%7D%7D%3E%0A%09%09%3Cli%3E%7Bvalue%7D%3C%2Fli%3E%0A%09%3C%2Ffor%3E%0A)%3B%0A%0AMoon.use(%7B%0A%09view%3A%20Moon.view.driver(%22%23root%22)%0A%7D)%3B%0A%0AMoon.run(()%20%3D%3E%20%7B%0A%09return%20%7B%0A%09%09view%3A%20loop%0A%09%7D%3B%0A%7D)%3B">Try it!</a>

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
