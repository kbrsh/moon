---
title: View
order: 4
---

The view driver is a driver that handles visual output using the DOM in a browser. It uses a virtual DOM under the hood to ensure fast updates, and it works by replacing the old view with a new one.

## Configuration

The `Moon.view.driver` is a function that takes a root element where views will be mounted. This can be a query selector or a direct reference to a DOM element. The view driver will replace this element with the view structure you provide.

```js
// Creates a view driver that mounts on an existing element using
// a query selector.
Moon.view.driver("#root");

// Creates a view driver that mounts on an existing element using
// a direct DOM reference.
Moon.view.driver(document.getElementById("root"));
```

## Nodes

The view driver accepts nodes as output. It also provides a large set of utility functions to create nodes. These can create HTML elements, text nodes, or custom nodes. They accept a data object as a parameter to store DOM properties, which can include information such as `class`, `style`, or `children`.

```js
// Create a div element.
Moon.view.m.div({});

// Create a text node.
Moon.view.m.text({data: "Titan is a moon."});

// Create a "custom" element.
const custom = Moon.view.m.node("custom");
custom({ moon: "Titan" });
```

## Input

The view driver provides event information as input. This is useful for event handlers which return their own views, as they can have access to the DOM event information.

```play
const button = Moon.view.m.button;

function handleClick({ view }) {
	console.log(view); // MouseEvent
	return {};
}

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => ({
	view: <button @click=handleClick>Click Me!</button>
}));
```

## Output

The view driver accepts a new view as output and renders it to the DOM using a performant virtual DOM diffing algorithm. This should be a completely new virtual DOM. This keeps immutability and prevents bugs, as every view completely replaces the old one.

```play
const p = Moon.view.m.p;

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => ({
	view: <p>Hello Moon!</p>
}));
```

Moon views are often defined using the **Moon View Language**. The language is a DSL embedded in JavaScript based on HTML and adds syntactic sugar for function calls.

### JavaScript Syntax

The Moon view language is a superset of JavaScript, and it introduces three new types of expressions.

```js
// Node with data and children
const paragraph = <p class="titan">Hello Moon!</p>;
const paragraph = p({
	class: "titan",
	children: [Moon.view.m.text({ data: "Hello Moon!" })]
});

// Node with data
const input = <input placeholder="First name"/>;
const input = <input {placeholder: "First name"}/>;
const input = input({ placeholder: "First name" });

// Node
const wrapped = <div><paragraph*></div>;
const wrapped = div({ children: [paragraph] });
```

### Comments

The compiler ignores any text between pound signs. They can be escaped if needed. Comments are not allowed within text.

```js
# This is a comment. #
const paragraph = <p # comment here # foo=bar>Hello Moon!</p>;
```

### Tags

Tags return new view nodes. They can also have data, which correspond to properties (not attributes) on DOM elements. Data values can be strings, identifiers, arrays, objects, or JavaScript expressions surrounded by parenthesis. There are three types of tags.

#### Node

A node tag is equivalent to a variable reference. For example, a node may be hoisted or stored in some other variable. A node tag can allow it to be inserted or used, especially as the child of another node.

A node tag is an expression enclosed within an opening angle bracket (`<`) and an asterisk combined with a closing angle bracket (`*>`).

For example:

```play
const { div, p } = Moon.view.m;

// Store a node in a variable.
const paragraph = <p>Hello Moon!</p>;

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => ({
	// Use the node as the child of another
	view: <div><paragraph*></div>
}));
```

#### Node with Data

A node tag with data, or a self-closing tag, is used to call a function with a single data parameter. This parameter can optionally use HTML attribute syntax.

A node tag with data is an expression along with attributes or another expression enclosed within an opening angle bracket (`<`) and a forward slash combined with a closing angle bracket (`/>`).

For example:

```play
const { div, ul, li, p } = Moon.view.m;

const component = ({ moon }) => <p>The moon is {moon}.</p>;

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => ({
	view:
		<div>
			<component {moon: "Titan"}/>
			<component moon="Europa"/>
			<ul children=[
				<li>Moon</li>,
				<li>Titan</li>,
				<li>Europa</li>
			]/>
		</div>
}));
```

#### Node with Data and Children

A node tag with data and children is used to call a function with a single data parameter. This parameter must use HTML attribute syntax and will be passed with an extra `children` property containing any child nodes. The child nodes can be any type of node, text, or interpolated expressions within curly braces.

A node tag with data is an expression surrounded by angle brackets followed by children and a closing tag which can contain any text. Closing tags may even be left blank if preferred. Special characters in text can be escaped with a preceding backslash.

For example:

```play
const { div, p } = Moon.view.m;
const moon = "Titan";

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => ({
	// Create a div with an inner paragraph and an interpolated
	// expression.
	view:
		<div>
			<p>Hello Moon!</p>
			The value of `moon` is {moon}.
			Here are some escaped characters: \< \> \\ \{ \}
		</div>
}));
```

### Attributes

By default, Moon uses data to directly set DOM properties on nodes. However, some attributes cannot be set using properties, such as the `aria-*`, `data-*`, or `list` attributes. To get around this, the `attributes` object can hold data that will be set as attributes.

```play
const p = Moon.view.m.p;

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => ({
	view:
		<p attributes={
			"data-moon": "Titan",
			"aria-hidden": false
		}>
			Hello Moon!
		</p>
}));
```

### Style

The `style` property should be set using an object.

```play
const p = Moon.view.m.p;

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => ({
	view:
		<p style={
			color: "white",
			backgroundColor: "coral"
		}>
			Hello Moon!
		</p>
}));
```

### Focus

The `focus` property can set focus on elements. Only one element should have this value set to true in any given view.

```play
const input = Moon.view.m.input;

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => ({
	view: <input focus=false/>
}));

Moon.run(() => ({
	view: <input focus=true/>
}));
```

### Events

Browser events such as `click` or `input` can be handled by creating an attribute prepended with `@` with one function as a value. This function will be ran like an application, with the DOM event available from the input from the `view` driver.

```play
const { p, button } = Moon.view.m;

function handleClick({ view }) {
	console.log(view); // MouseEvent
	return {
		view: <p>New view!</p>
	};
}

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => ({
	view: <button @click=handleClick>Click Me!</button>
}));
```

### Components

Components are functions of data objects that return view nodes. They are useful for making reusable parts of your view that can be configured through data. Since the data object is also passed children, components can also render children inside of their view node result.

```play
const { div, p } = Moon.view.m;

const component = data =>
	<div class="container" id=data.id>
		<div class="content" children=data.children/>
	</div>;

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => ({
	view:
		<component id="my-component">
			<p>Hello Moon!</p>
		</component>
}));
```

### Conditionals

Elements can be rendered based on certain conditions using the ternary operator or normal if statements.

```play
const { div, p } = Moon.view.m;
const moon = "Titan";

// Ternary
const conditionalTernary =
	<div>
		<(
			moon === "Titan" ?
				<p>The moon is Titan!</p> :
				<p>The moon is not Titan, it is {moon}.</p>
		)*>
	</div>;

// If statements
let paragraph;

if (moon === "Titan") {
	paragraph = <p>The moon is Titan!</p>;
} else {
	paragraph = <p>The moon is not Titan, it is {moon}.</p>;
}

const conditionalIfStatement = <div><paragraph*></div>;

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => ({
	view:
		<div>
			<conditionalTernary*>
			<conditionalIfStatement*>
		</div>
}));
```

### Loops

Lists can be mapped to views using `map` or for loops.

```play
const { div, ul, li } = Moon.view.m;
const moons = [
	"Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn",
	"Uranus", "Neptune"
];

// Map
const loopMap =
	<ul children=(moons.map(moon =>
		<li>{moon}</li>
	))/>;

// For loop
const children = [];

for (let i = 0; i < moons.length; i++) {
	children.push(<li>{moons[i]}</li>);
}

const loopFor = <ul children=children/>;

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => ({
	view:
		<div>
			<loopMap*>
			<loopFor*>
		</div>
}));
```
