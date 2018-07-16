---
title: Components
order: 5
---

Components allow you to split up your application into smaller, composable parts called _components_. Components are constructors that create new instances. They have the same API as the root Moon component, as both are component instances.

Once a component is registered using `Moon.extend`, it can be used anywhere with a tag. Component names must start with a capital letter, and component data should be a function in order to create new data for each component instance.

```mvl
<!-- Root View -->
<Counter/>
<Counter/>
<Counter/>
```

```mvl
<!-- Counter View -->
<button @click={update("count", count + 1)}>
	{count}
</button>
```

```js
Moon.component("Counter", function() {
	return {
		count: 0
	}
});

Moon({
	root: "#root"
});
```

<div id="example-components-definition" class="example"></div>

<script>
	Moon.extend("Counter", function() {
		return {
			view: "<button @click={update(\"count\", count + 1)}>{count}</button>",
			count: 0
		}
	});

	Moon({
		root: "#example-components-definition",
		view: "<Counter/><Counter/><Counter/>"
	});
</script>
