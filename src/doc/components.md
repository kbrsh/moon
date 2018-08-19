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
Moon.extend("Counter", function() {
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

### Arguments

Components can take _arguments_, which will be set on the instance data.

```mvl
<!-- Root View -->
<ColoredParagraph color="red"/>
<ColoredParagraph color="blue"/>
<ColoredParagraph color={color}/>
```

```mvl
<!-- ColoredParagraph View -->
<p style={"color:" + color}>
	Ut Lunam, citius quam lux, levior quam totum.
</p>
```

```js
Moon.extend("ColoredParagraph", {});

Moon({
	root: "#root",
	color: "green"
});
```

<div id="example-components-arguments" class="example"></div>

<script>
	Moon.extend("ColoredParagraph", function() {
		return {
			view: "<p style={\"color:\" + color}>Ut Lunam, citius quam lux, levior quam totum.</p>"
		}
	});

	var ComponentsArguments = Moon({
		root: "#example-components-arguments",
		view: "<ColoredParagraph color=\"red\"/><ColoredParagraph color=\"blue\"/><ColoredParagraph color={color}/>",
		color: "green"
	});
</script>

Try entering `ComponentsArguments.update("color", "black")` in the console to update the color of the last colored paragraph.

### Events

Components emit events to notify their parent of an action. Parents can listen to a component's custom events or lifecycle events.

```mvl
<!-- Root View -->
<Term @change={update("firstTerm", $event)}/>
<p>+</p>
<Term @change={update("secondTerm", $event)}/>
<p>= {sum}</p>
```

```mvl
<!-- Term View -->
<input type="number" value="0" @input={change($event)}/>
```

```js
Moon.extend("Term", function() {
	return {
		change($event) {
			this.emit("change", parseInt($event.target.value));
		}
	};
});

Moon({
	root: "#root",
	firstTerm: 0,
	secondTerm: 0,
	sum() {
		return this.firstTerm + this.secondTerm;
	}
});
```

<div id="example-components-events" class="example"></div>

<script>
	Moon.extend("Term", function() {
		return {
			view: "<input type=\"number\" value=\"0\" @input={change($event)}/>",
			change($event) {
				this.emit("change", parseInt($event.target.value));
			}
		}
	});

	Moon({
		root: "#example-components-events",
		view: "<Term @change={update(\"firstTerm\", $event)}/><p>+</p><Term @change={update(\"secondTerm\", $event)}/><p>= {sum()}</p>",
		firstTerm: 0,
		secondTerm: 0,
		sum() {
			return this.firstTerm + this.secondTerm;
		}
	});
</script>

### Single-file Components

A project using single-file components can be generated using [Moon CLI](./installation.html#cli). A single-file component has a view, styles, and data.

The component can be imported anywhere for use with:

```js
import Component from "./components/Component.mvl";
```

##### View

The main content of an `mvl` file is the view. Every element other than `script` and `style` will be part of the component view.

```mvl
<h1>{name}</h1>
```

##### Style

If a `style` tag is present, it will be _scoped_ to the component and included in the bundle. This means that the styles will only apply to the component they are styling.

```mvl
<style>
	h1 {
		color: blue;
	}
</style>
```

##### Data

If a `script` tag is present, the default export will be used as the data for the component.

```mvl
<script>
	export default {
		name: "Moon",
		updateName() {
			this.update("name", "New Moon");
		}
	}
</script>
```

##### Overall

The overall component can be created in one `mvl` file.

```mvl
<h1>{name}</h1>

<style>
	h1 {
		color: blue;
	}
</style>

<script>
	export default {
		name: "Moon",
		updateName() {
			this.update("name", "New Moon");
		}
	}
</script>
```
