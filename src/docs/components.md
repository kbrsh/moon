---
title: Components
---

Like React/Vue/Angular/Mithril, Moon provides a component system. There are two main types of components, we'll be talking about normal components.

##### Registering

To register a component, use the global `component` method, with the component name as the first argument, and all options as the second argument. A component can take (most) arguments a regular instance can take.

```js
Moon.component("name", {
  // options
});
```

Once this component is registered, you can use it in your HTML like:

```html
<component-name></component-name>
```

For example:

```html
<div id="app1">
  <my-component></my-component>
</div>
```

```js
Moon.component('my-component', {
  template: "<p>This is a Component!</p>"
});

const app1 = new Moon({
  el: "#app1"
});
```

This will render:

<div id="app1" class="example">
  <my-component></my-component>
</div>

<script>
Moon.component('my-component', {
  template: "<p>This is a Component!</p>"
});

var app1 = new Moon({
  el: "#app1"
});
</script>

Components can be nested within each other, and each have their own scope. Updating one component's data **will not** update any other components other than itself.

##### Props

Components do not have access to data from their parent. To pass data down from the parent, you can use `props`. Define them in your component options, and you will have access to them via `{{mustache}}` templates. You can pass them by putting them as attributes.

```html
<div id="app2">
  <my-component content="{{parentMsg}}"></my-component>
</div>
```

```js
Moon.component('my-component', {
  props: ['content'],
  template: "<p>Data from Parent: {{content}}</p>"
});

const app2 = new Moon({
  el: "#app2",
  data: {
    parentMsg: "Parent Data"
  }
});
```

<div id="app2" class="example">
  <my-component content="{{parentMsg}}"></my-component>
</div>

<script>
Moon.component('my-component', {
  props: ['content'],
  template: "<p>Data from Parent: {{content}}</p>"
});

var app2 = new Moon({
  el: "#app2",
  data: {
    parentMsg: "Parent Data"
  }
});
</script>

Go ahead, try entering `app2.set('parentMsg', 'New Parent Data')` and watch the component being updated!

##### Data

When a component needs to have a local state, the `data` option works as normal. On components, the `data` option _must be a function_. This allows each component to have a new local state, independent of other components. This function should return an object.

This example shows a counter component. Each counter has a different, individual count, which is incremented by its respective button. As you can see, a component can have data, methods, and get/set methods!

```html
<div id="app3">
  <counter-component></counter-component>
  <counter-component></counter-component>
</div>
```

```js
Moon.component("counter-component", {
  template: `<div>
    <p>Count: {{count}}</p>
    <button m-on:click="increment">Increment</button>
  </div>`,
  data: function() {
    return {
      count: 0
    }
  },
  methods: {
    increment: function() {
      this.set("count", this.get("count") + 1);
    }
  }
});

const app3 = new Moon({
  el: "#app3"
});
```

<div id="app3" class="example">
  <counter-component></counter-component>
  <counter-component></counter-component>
</div>

<script>
Moon.component("counter-component", {
  template: '<div><p>Count: {{count}}</p><button m-on:click="increment">Increment</button></div>',
  data: function() {
    return {
      count: 0
    }
  },
  methods: {
    increment: function() {
      this.set("count", this.get("count") + 1);
    }
  }
});

var app3 = new Moon({
  el: "#app3"
});
</script>

Go ahead, click each counter!

##### Parent/Child Communication

Moon, like Vue and React, allows parent and child components to communicate with a simple concept: *props down, events up*.

For a parent to communicate with a child, you use [props]("./components.html#props"). But how can a child let a parent know about its activity? For this, we use the event system. While events are normally local to an instance, Moon allows children to emit an event that parents can listen on, by using `m-on` when creating a component.

Using something like: `m-on:eventName="parentMethod"` will call a method on the parent when a child event is emitted.

Here is an example of two local children incrementing a single count on the parent:

```html
<div id="app4">
  <h5>Total Count: {{total}}</h5>
  
  <counter-child-component m-on:increment="incrementTotal">
  </counter-child-component>

  <counter-child-component m-on:increment="incrementTotal">
  </counter-child-component>
</div>
```

```js
Moon.component("counter-child-component", {
  template: `<div>
    <p>Count: {{count}}</p>
    <button m-on:click="increment">Increment</button>
  </div>`,
  data: function() {
    return {
      count: 0
    }
  },
  methods: {
    increment: function() {
      this.set("count", this.get("count") + 1);
      this.emit("increment");
    }
  }
});

const app4 = new Moon({
  el: "#app4",
  data: {
    total: 0
  },
  methods: {
    incrementTotal: function() {
      this.set("total", this.get("total") + 1);
    }
  }
});
```

As you can see, each child counter will emit an `increment` event, which the parent listens to by using `m-on` on the component element.

<div id="app4" class="example">
  <h5>Total Count: {{total}}</h5>
  <counter-child-component m-on:increment="incrementTotal"></counter-child-component>
  <counter-child-component m-on:increment="incrementTotal"></counter-child-component>
</div>

<script>
Moon.component("counter-child-component", {
  template: '<div><p>Count: {{count}}</p><button m-on:click="increment">Increment</button></div>',
  data: function() {
    return {
      count: 0
    }
  },
  methods: {
    increment: function() {
      this.set("count", this.get("count") + 1);
      this.emit("increment");
    }
  }
});

var app4 = new Moon({
  el: "#app4",
  data: {
    total: 0
  },
  methods: {
    incrementTotal: function() {
      this.set("total", this.get("total") + 1);
    }
  }
});
</script>

##### Slots

When you have a component that needs to distribute content passed to it, it can get messy when attempting to achieve it with props. Instead, you can provide a component with HTML, and the component can distribute it accordingly.

To do this, Moon has _slots_. A component template can have the `slot` element anywhere with an optional `name` attribute. When a new component instance is created, the content inside of it is distributed. Any elements without a `slot` attribute will be put into the default slot, and any elements with the `slot` attribute will be put inside their respective slot.

```html
<div id="app10">
  <slot-component>
    <h1>Default Slot Content. Parent data: {{parentMsg}}</h1>
    <p slot="paragraph">Named slot content.</p>
  </slot-component>
</div>
```

```js
Moon.component('slot-component', {
  template: `<div>
    <slot></slot>
    <h5>Component Content.</h5>
    <slot name="paragraph"></slot>
  </div>`
});

const app10 = new Moon({
  el: "#app10",
  data: {
    parentMsg: "Parent Data"
  }
});
```

<div id="app10" class="example">
  <slot-component>
    <h1>Default Slot Content. Parent data: {{parentMsg}}</h1>
    <p slot="paragraph">Named slot content.</p>
  </slot-component>
</div>

<script>
Moon.component('slot-component', {
  template: "<div><slot></slot><h5>Component Content.</h5><slot name='paragraph'></slot></div>"
});

var app10 = new Moon({
  el: "#app10",
  data: {
    parentMsg: "Parent Data"
  }
});
</script>

Go ahead, try entering `app10.set("parentMsg", "New Parent Data");` and watch the component update.
