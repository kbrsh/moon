---
title: About
order: 0
---

Moon is more than just another JavaScript library — it's a new paradigm for application development based on pure functions.

An application is a function that uses the concept of **drivers**, functions that access the real world to provide information and perform effects. Drivers provide input to applications and then handle the output. It's a simple concept with endless potential. Pure functions bring clarity and immutability to application code, making it concise, modular, and easy to reason about.

The majority of JavaScript libraries today are based on a view that changes based on state. In practice, however, web applications are much more complex and often need to perform side effects along with updating the view. These include audio, HTTP requests, routing, timing events, DOM manipulation, etc. While most other libraries have these features as second-class citizens, Moon handles all effects equally with drivers.

At its core, Moon is a runtime that calls drivers and runs a functional application in the imperative browser environment. It uses drivers to get information from the real world and provides them as input to an application function. The function outputs data to various drivers, and Moon calls the drivers with the output to perform effects on the real world.

```play
// Import nodes from the view driver.
const button = Moon.view.m.button;

// The increment event handler acts just like `main`, and it can
// take driver inputs and returns driver outputs.
const increment = ({ data }) => {
	const dataNew = data + 1;

	// It returns data to the data driver to store, and a view to
	// the view driver to render.
	return {
		data: dataNew,
		view: <view data=dataNew/>
	};
};

// The view is a component that renders a button with a count.
const view = ({ data }) =>
	<button @click=increment>{data}</button>;

const main = () => {
	const data = 0;

	// In the beginning, the application sends output to the data
	// driver to store an initial count, and then it sends output
	// to the view driver to display it on the screen.
	return {
		data,
		view: <view data=data/>
	};
};

// Initialize drivers.
Moon.use({
	data: Moon.data.driver, // Holds state
	view: Moon.view.driver("#root") // Handles changes to the DOM
});

// Run the application.
Moon.run(main);
```

## Functional & Declarative

Many user interface libraries in the JavaScript landscape claim to be declarative but seldom incorporate purely functional ideas. Instead, they have imperative methods of updating state to update views, using function calls like `set` or reactive object property setters. These may be convenient at times, but often lead to bugs because of mutation. To get around this, they support a myriad of different libraries for immutability, leading to tooling fragmentation and confusion.

Moon is different and was designed from scratch with a novel approach to web applications, treating them as a function of driver inputs. All outputs to the browser, including the view, state, and HTTP requests, are all functions of driver inputs that capture data from outside sources and user input. There are no setter methods to learn, no lifecycle hooks to handle effects, and no need for a fragmented ecosystem of state management libraries.

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

Rather than creating "smart" components with general local state, components are "dumb" and only encode view data. For example, instead of a `toggle` component handling local state, it would only provide an event where the relevant global state `theme` would change.

One state tree means one source of truth for an application. Developers can quickly glance at the state of the whole application and have complete flexibility on the structure and type of the state. This declarative model of applications allows for modular code consisting of pure functions that focus on the "what" instead of the "how".

## Tiny & Fast

Since Moon's only job is to provide a runtime for a functional application, it weighs less than **2kb minified and gzipped**. Even with the built-in drivers, it still stays around the 2kb mark. The lightweight runtime means that browsers won't have to parse and run multiple megabytes of JavaScript, a practice that is quickly becoming the status quo.

The view driver is a default driver built into Moon. It uses a variety of techniques to optimize JavaScript performance for JIT (Just In Time) compilation. Under the hood, the view driver takes a virtual DOM tree as output from an application. This tree is highly optimized to have the same shape to allow for fast property access and node creation. The virtual DOM diffing algorithm was designed to run efficient transformations that make changes while touching the DOM as little as possible.

Since **view components are pure functions** in Moon, developers can choose to optimize specific components by using standard functional programming techniques such as memoization or caching. The view driver skips over nodes that stay the same over multiple renders. This combined with the purity of components opens up a lot of potential for optimization.

Using optimized algorithms and data structures, Moon runs faster than most user interface libraries while sustaining a lightweight footprint.

<img src="/img/size.png" alt="Sizes of popular frameworks relative to Moon." class="s-x-26 s-y-20"/>
<a href="https://rawgit.com/krausest/js-framework-benchmark/master/webdriver-ts-results/table.html"><img src="/img/speed.png" alt="Performance of popular frameworks relative to Moon." class="s-x-26 s-y-20"/></a>

## Intuitive & Consistent

Moon's API only consists of two functions for initialization along with the APIs of individual drivers. The rest of an application is made from composing functions. Developers have the freedom to structure projects however they'd like. Since functions are just JavaScript, they can be split up across files and imported like anything else.

Meanwhile, other APIs often have a multitude of functions for managing different effects and state, and they usually require a well-defined type and structure for parameters. In addition, other view templating languages are inconsistent. They accept different types for different parts of a template and impose a learning barrier by introducing concepts like directives, flow control, and implicit children flattening.

Views in Moon are based on HTML, a familiar language for defining documents. The language is an alternative syntax for function calls that can help structure views in a more organized fashion. Components in Moon are pure functions that return views, and they are called with the same syntax as tags.

```js
// Moon View
const paragraph = <p class="blue">Hello World!</p>;
const box = <box type="alert">Something went wrong!</box>;
const posts = <ul children=(posts.map(post => <li>{post}</li>))/>;
const container = <div><paragraph*></div>;

// Compiled to JS
const paragraph = p({
	class: "blue",
	children: [Moon.view.m.text({ data: "Hello World!" })]
});
const box = box({
	type: "alert",
	children: [
		Moon.view.m.text({ data: "Something went wrong!" })
	]
});
const posts = ul({
	children: posts.map(post =>
		li({ children: [Moon.view.m.text({ data: post })] })
	)
});
const container = div({ children: [paragraph] });
```

## Conclusion

In Moon, an application is a function with inputs and outputs handled by drivers. The concept's simplicity allows for a fast implementation with a small footprint, both of which constantly get overlooked in web development today. Functional programming brings clarity and composability to applications, and single state trees can lead to a clear mental model of a complex application. It also leads to a minimal API, required only to initialize a functional application in the imperative browser environment.

In essence, applications run on the Moon while drivers update the Earth.
