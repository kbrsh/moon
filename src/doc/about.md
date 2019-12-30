---
title: About
order: 0
---

Moon is more than just a JavaScript library — it's a new paradigm for application development based on pure functions.

An application is defined as a function that uses the concept of **drivers**, functions that access the real world to provide information and perform effects. Using drivers, an application takes driver inputs and returns driver outputs. It's a simple concept with endless potential. Pure functions bring clarity and immutability to application code, making it concise, modular, and easy to reason about.

The majority of JavaScript libraries today are based on a view that changes based on state. In practice, however, web applications are much more complex and often need to perform side effects along with updating the view. These include audio, HTTP requests, routing, timing events, DOM manipulation, etc. While most other libraries have these features as second-class citizens, Moon handles all effects with drivers.

At its core, Moon is a runtime that calls drivers and runs a functional application in the imperative browser environment. It uses drivers to get information from the real world and provides them as input to an application function. The function outputs data to various drivers, and Moon calls the drivers with the output to perform effects on the real world.

```js
// The increment event handler acts just like `Root`, and it can take driver
// inputs and returns driver outputs.
const increment = ({ data, view }) => {
	const dataNew = data + 1;

	// It returns data to the data driver to store, and a view to the view driver
	// to render.
	return {
		data: dataNew,
		view: (<View data={dataNew}/>)
	};
};

// The view is a component that renders a button with a count.
const View = ({ data }) => (<button @click={increment}>{data}</button>);

const Root = ({ data, view }) => {
	// This application receives input from the data and view drivers. The data
	// driver provides the count state, and the view driver provides event
	// information.

	// In the beginning, the application only needs to output to the view, so it
	// specifies data to send to the view driver.
	return {
		view: (<View data={data}/>)
	};
};

// Initialize drivers.
Moon.use({
	data: Moon.data.driver(0), /* The data driver holds state. */
	view: Moon.view.driver("#root") /* The view driver handles changes to the DOM. */
});

// Run the application.
Moon.run(Root);
```

<a href="/play#%2F%2F%20The%20increment%20event%20handler%20acts%20just%20like%20%60Root%60%2C%20and%20it%20can%20take%20driver%0A%2F%2F%20inputs%20and%20returns%20driver%20outputs.%0Aconst%20increment%20%3D%20(%7B%20data%2C%20view%20%7D)%20%3D%3E%20%7B%0A%20%20%20%20const%20dataNew%20%3D%20data%20%2B%201%3B%0A%0A%20%20%20%20%2F%2F%20It%20returns%20data%20to%20the%20data%20driver%20to%20store%2C%20and%20a%20view%20to%20the%20view%20driver%0A%20%20%20%20%2F%2F%20to%20render.%0A%20%20%20%20return%20%7B%0A%20%20%20%20%20%20%20%20data%3A%20dataNew%2C%0A%20%20%20%20%20%20%20%20view%3A%20(%3CView%20data%3D%7BdataNew%7D%2F%3E)%0A%20%20%20%20%7D%3B%0A%7D%3B%0A%0A%2F%2F%20The%20view%20is%20a%20component%20that%20renders%20a%20button%20with%20a%20count.%0Aconst%20View%20%3D%20(%7B%20data%20%7D)%20%3D%3E%20(%3Cbutton%20%40click%3D%7Bincrement%7D%3E%7Bdata%7D%3C%2Fbutton%3E)%3B%0A%0Aconst%20Root%20%3D%20(%7B%20data%2C%20view%20%7D)%20%3D%3E%20%7B%0A%20%20%20%20%2F%2F%20This%20application%20receives%20input%20from%20the%20data%20and%20view%20drivers.%20The%20data%0A%20%20%20%20%2F%2F%20driver%20provides%20the%20count%20state%2C%20and%20the%20view%20driver%20provides%20event%0A%20%20%20%20%2F%2F%20information.%0A%0A%20%20%20%20%2F%2F%20In%20the%20beginning%2C%20the%20application%20only%20needs%20to%20output%20to%20the%20view%2C%20so%20it%0A%20%20%20%20%2F%2F%20specifies%20data%20to%20send%20to%20the%20view%20driver.%0A%20%20%20%20return%20%7B%0A%20%20%20%20%20%20%20%20view%3A%20(%3CView%20data%3D%7Bdata%7D%2F%3E)%0A%20%20%20%20%7D%3B%0A%7D%3B%0A%0A%2F%2F%20Initialize%20drivers.%0AMoon.use(%7B%0A%20%20%20%20data%3A%20Moon.data.driver(0)%2C%20%2F*%20The%20data%20driver%20holds%20state.%20*%2F%0A%20%20%20%20view%3A%20Moon.view.driver(%22%23root%22)%20%2F*%20The%20view%20driver%20handles%20changes%20to%20the%20DOM.%20*%2F%0A%7D)%3B%0A%0A%2F%2F%20Run%20the%20application.%0AMoon.run(Root)%3B">Try it!</a>

## Functional & Declarative

Many user interface libraries in the JavaScript landscape claim to be declarative but seldom incorporate purely functional ideas. Instead, they have imperative methods of updating state to update views, using function calls like `set` or reactive object property setters. These may be convenient at times, but often lead to bugs because of mutation. To get around this, they support a myriad of different libraries for immutability, leading to tooling fragmentation and confusion.

Moon is different, and was designed from scratch with a novel approach to web applications, treating them as a function of driver inputs. All outputs to the browser, including the view, state, and HTTP requests, are all functions of driver inputs that capture data from outside sources and user input. There are no setter methods to learn, no lifecycle hooks to handle effects, and no need for a fragmented ecosystem of state management libraries.

Instead, developers write functions that return outputs based on user events and driver inputs, and they have the freedom to create custom effects with their own drivers. State is often stored in a single state tree rather than being spread across local and global state. For example, the entire state of an application might be represented as:

```js
{
	state: "loading",
	user: {
		name: "",
		picture: ""
	},
	posts: {
		state: "loaded",
		list: [],
		selected: null
	},
	theme: "dark"
}
```

Rather than creating "smart" components with general local state, components are "dumb" and only encode view data. For example, instead of a `Toggle` component handling local state, it would only provide an event where the relevant global state `theme` would change.

One state tree means one source of truth for an application. Developers can quickly glance at the state of the whole application and have complete flexibility on the structure and type of the state. This declarative model of applications allows for modular code consisting of pure functions that focus on the "what" instead of the "how".

## Tiny & Fast

Since Moon's only job is to provide a runtime for a functional application, it weighs less than **1kb minified and gzipped**. Even with the built-in drivers, it still stays around the 1kb mark. The lightweight runtime means that browsers won't have to parse and run multiple megabytes of JavaScript, a practice that is quickly becoming the status quo.

The view driver is a default driver built into Moon. It uses a variety of techniques to optimize JavaScript performance for JIT (Just In Time) compilation. Under the hood, the view driver takes a virtual DOM tree as output from an application. This tree is highly optimized to have the same shape to allow for fast property access and node creation. The virtual DOM diffing algorithm was designed to run efficient transformations that make changes while touching the DOM as little as possible.

Since **view components are pure functions** in Moon, developers can choose to optimize specific components by using standard functional programming techniques such as memoization or caching. The view driver skips over nodes that stay the same over multiple renders. This combined with the purity of components opens up a lot of potential for optimization.

Using optimized algorithms and data structures, Moon runs faster than most user interface libraries while sustaining a lightweight footprint.

![Sizes of popular frameworks relative to Moon.](/img/size-large.png)
<a class="linkPlain" href="https://rawgit.com/krausest/js-framework-benchmark/master/webdriver-ts-results/table.html">![Performance of popular frameworks relative to Moon.](/img/speed-large.png)</a>

## Intuitive & Consistent

Moon's API only consists of two functions for initialization along with the APIs of individual drivers. The rest of an application is made from composing functions. Developers have the freedom to structure projects however they'd like. Since functions are just JavaScript, they can be split up across files and imported like anything else.

Meanwhile, other APIs often have a multitude of functions for managing different effects and state, and they usually require a well-defined type and structure for parameters. In addition, other view templating languages are inconsistent. They accept different types for different parts of a template and impose a learning barrier by introducing concepts like directives, flow control, and implicit children flattening.

Views in Moon are based on HTML, a familiar language for defining documents. The language is an alternative syntax for function calls that can help structure views in a more organized fashion. Components in Moon are pure functions that return views, and they are called with the same syntax as tags. All control flow concepts are implemented as built-in components. They can be thought of as function calls, but they're compiled to their more efficient counterparts for performance.

```js
// Moon View
const paragraph = (<p class="blue">Hello World!</p>);
const box = (<Box type="alert">Something went wrong!</Box>);
const posts = (<for={post} of={posts}>{post}</for>);

// Compiled to JS
var m0, m1, m2, m3, m4, m5, m6;

const paragraph = (function() {
	if (m0 === undefined) {
		// Static nodes are defined here.
		m0 = Moon.view.m("p", { class: "blue" }, [
			Moon.view.m("text", { "": "Hello World!" }, [])
		]);
	}
	return m0;
})();

const box = (function() {
	if (m1 === undefined) {
		// <Box/> gets compiled to a function call.
		m1 = Box({
			type: "alert",
			children: [Moon.view.m("text", { "": "Something went wrong!" }, [])]
		});
	}
	return m1;
})();

const posts = (function() {
	if (m5 === undefined) {
		m5 = [];
		m6 = {};
	}
	m2 = [];
	m3 = function(post) {
		return Moon.view.m("text", { "": post }, m5);
	};

	// <for> gets compiled to a for loop for efficiency.
	for (m4 = 0; m4 < posts.length; m4++) {
		m2.push(m3(posts[m4], m4));
	}

	return Moon.view.m("span", m6, m2);
})();
```

## Conclusion

In Moon, an application is a function with inputs and outputs handled by drivers. The concept's simplicity allows for a fast implementation with a small footprint, both of which constantly get overlooked in web development today. Functional programming brings clarity and composability to applications, and single state trees can lead to a clear mental model of a complex application. It also leads to a minimal API, required only to initialize a functional application in the imperative browser environment.

In essence, applications run on the Moon while drivers update the Earth.
