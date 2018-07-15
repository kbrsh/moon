---
title: Data
order: 3
---

Every Moon component is a Moon instance with properties and methods that are defined in the component definition.

### Root

The root instance is created using `Moon({})`. This invocation creates a new component constructor and initializes it.

```js
Moon({
	view: "{foo} {bar}",
	foo: 17,
	bar: "baz",
	log() {
		// Properties are available under `this`
		console.log(this.foo, this.bar);
	}
});
```

The above instance has the user-defined properties `foo` and `bar` and the method `log`. Additionally, Moon defines builtin properties and methods on each component to provide utilities for creating, updating, and destroying it.

### Create

To create the view and initialize all DOM elements, you use `instance.create(root)`. This method is meant to be used internally but can optionally be utilized in order to use a Moon component with an existing application.

```js
new ComponentConstructor().create(document.getElementById("root"));
```

### Update

To update the view and properties of an instance you use `instance.update()`. This method updates data within the component and queues a view update.

```js
// Queue a view update
this.update();

// Update one property and queue a view update
this.update("count", this.count + 1);

// Update multiple properties and queue a view update
this.update({
	foo: "bar",
	count: this.count + 1
});
```

### Destroy

To destroy a view and remove all DOM elements from the root you use `instance.destroy()`.

```js
this.destroy();
```
