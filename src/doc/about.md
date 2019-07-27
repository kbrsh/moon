---
title: About
order: 0
---

Moon is more than just a JavaScript library — it's a new paradigm for application development based on pure functions.

An application is defined as a function that uses the concept of **drivers**, functions that access the real world to provide information and perform effects. Using drivers, an application takes driver inputs and returns driver outputs. It's a simple concept but it brings endless potential. Pure functions bring clarity and immutability to application code, making it concise, modular, and easy to reason about.

At its' core, Moon is a runtime that calls drivers and runs a functional application in the imperative browser environment. It uses drivers to get information from the real world and provides them as input to an application function. The function outputs data to various drivers, and Moon sends calls the drivers with the output to perform effects on the real world.

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

## Tiny & Fast

Since Moon's only job is to provide a runtime for a functional application, it weighs less than **1kb minified and gzipped**. Even with the built-in drivers, it still stays around the 1kb mark. The lightweight runtime means that browsers won't have to parse and run multiple megabytes of JavaScript, a practice that is quickly becoming the status quo.

The **view driver** is a default driver built into Moon. It uses a variety of techniques to optimize JavaScript performance for JIT (Just In Time) compilation. Under the hood, the view driver takes a **virtual DOM tree** as output from an application. This tree is highly optimized to have the same shape to allow for fast property access and node creation. The virtual DOM diffing algorithm was designed to run efficient transformations that make changes while touching the DOM as little as possible.

Using optimized algorithms and data structures, Moon runs faster than most user interface libraries while sustaining a lightweight footprint.

## Functional & Declarative

TODO

## Intuitive & Consistent

TODO
