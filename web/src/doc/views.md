---
title: Views
order: 4
---

Moon views are defined using the _Moon View Language_. The Moon view language is a template language based on HTML and adds support for data interpolation, events, and components.

### Interpolation

Properties from instance data can be interpolated into the view using a pair of curly braces: `{}`.

```mvl
<div class={name}>
	{message}
</div>
```

```js
Moon({
	root: "#root",
	name: "interpolation",
	message: "Hello Moon!"
});
```

<div id="example-view-interpolation" class="example"></div>

<script>
	var ViewInterpolation = Moon({
		root: "#example-view-interpolation",
		view: "<div class={name}>{message}</div>",
		name: "interpolation",
		message: "Hello Moon!"
	});
</script>

Try entering `ViewInterpolation.update("message", "New Message!")` in the console to update the view.

### Events

Browser events, component events, and lifecycle events can be handled by using an attribute starting with `@`.

##### Browser Events

Browser events such as `click` or `input` can be handled by creating an attribute prepended with `@` with one statement as a value. A special _local variable_ named `$event` will be available and holds the event object.

```mvl
<button @click={announce($event)}>
	Make Announcement
</button>
```

```js
Moon({
	root: "#root",
	announce($event) {
		alert($event.target.tagName + " was clicked.");
	}
});
```

<div id="example-view-browser-events" class="example"></div>

<script>
	Moon({
		root: "#example-view-browser-events",
		view: "<button @click={announce($event)}>Make Announcement</button>",
		announce($event) {
			alert($event.target.tagName + " was clicked.");
		}
	});
</script>

##### Bind Events

The `bind` event is a special event used to bind an input value to a variable and a variable to the input value.

```mvl
<p>{text}</p>
<input type="text" @bind={text}/>
```

```js
Moon({
	root: "#root",
	text: "Hello Moon!"
});
```

<div id="example-view-bind-events" class="example"></div>

<script>
Moon({
	root: "#example-view-bind-events",
	view: "<p>{text}</p><input type=\"text\" @bind={text}/>",
	text: "Hello Moon!"
});
</script>

##### Component Events

Learn about component events in the [components section](./components.html).

### Conditionals

Elements can be rendered based on certain conditions using the `If`, `ElseIf`, and `Else` components.

```mvl
<div If={condition}>
	Condition is truthy.
</div>
<div Else>
	Condition is falsy.
</div>
```

```js
Moon({
	root: "#root",
	condition: Math.random() <= 0.5 ? false : true
});
```

<div id="example-view-conditionals" class="example"></div>

<script>
	Moon({
		root: "#example-view-conditionals",
		view: "<div If={condition}>Condition is truthy.</div><div Else>Condition is falsy.</div>",
		condition: Math.random() <= 0.5 ? false : true
	});
</script>
