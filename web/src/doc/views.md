---
title: Views
order: 3
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

<div id="view-example-1" class="example"></div>

<script>
	Moon({
		root: "#view-example-1",
		view: "<div class={name}>{message}</div>",
		name: "interpolation",
		message: "Hello Moon!"
	});
</script>

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

<div id="view-example-2" class="example"></div>

<script>
	Moon({
		root: "#view-example-2",
		view: "<div If={condition}>Condition is truthy.</div><div Else>Condition is falsy.</div>",
		condition: Math.random() <= 0.5 ? false : true
	});
</script>
