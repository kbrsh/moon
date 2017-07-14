---
title: Instance
---

The root Moon instance is the core of your application, this is where any top level data should be defined, and it should be mounted on the root element that contains all of your components, directives, and templates.

#### Initializing

A new Moon instance should always be made using the _new_ keyword, and should contain an object containing all of the options. An instance does not require any options, but if you provide an `el` option, it will be mounted to this element.

```js
new Moon({
  // options
});
```

If you do not provide an `el` option, the app must be mounted manually, like:

```js
app.mount("#app");
```

If you provide a template option, Moon compiles this instead of the `outerHTML` of the element. For example:

```js
new Moon({
  template: "<div>Content</div>"
});
```

A Moon component takes all options a regular instance takes, but cannot take an `el` option.

#### Data

All data in an instance should be provided in the `data` option, these are all available via `{{mustache}}` templates in your code. These data properties are **reactive**, changing them with `.set` will also update the DOM.

#### Methods

Methods allow you to reuse certain actions in you code, for example, instead of always incrementing a counter, you can just call a method.

Using `this` inside a method is a reference to the instance, so you can do `this.set`. This also means that you will have to call it in a special way (when doing it manually), you have to use the `app.callMethod` method.

```js
const app = new Moon({
  data: {
    count: 0
  },
  methods: {
    increment: function() {
      this.set("count", this.get("count") + 1);
    }
  }
});

app.callMethod("increment");
// count => 1
```

Methods are also available inside of templates, available as you would call any function.

```html
<div id="app">
  <p>{{reverse(msg)}}</p>
  <p>{{reverse("racecaR")}}</p>
</div>
```

```js
const app = new Moon({
  el: "#app",
  data: {
    msg: "!nooM olleH"
  },
  methods: {
    reverse: function(str) {
      return str.split("").reverse().join("");
    }
  }
});
```

#### Computed Properties

If you have a value that depends on other values and returns some dynamic result, then you should use a computed property. Computed properties are analyzed for their dependencies, and will only run when needed.

For example:

```js
const app = new Moon({
  el: "#app",
  data: {
    msg: "Hello Moon!",
    count: 0
  },
  computed: {
    reversedMsg: {
      get: function() {
        return this.get("msg").split("").reverse().join("");
      }
    }
  }
});

app.set("msg", "New Message"); // Will cause `reversedMsg` to evaluate
app.set("count", 1); // `reversedMsg` will be cached
```

This caching behavior efficiently prevents any complex computations to be run only when needed. If a property that the computed property depends on is updated, then the computed property is evaluated again and analyzed for new dependencies.

#### Lifecycle

Like React and Vue, Moon calls certain lifecycle hooks throughout the life of your instance/component.

These can be defined in the `hooks` option, for example:

```js
new Moon({
  hooks: {
    init: function() {
      // called when first creating
    },
    mounted: function() {
      // called when element is mounted and the first build has been run
    },
    updated: function() {
      // called every time data is updated
    },
    destroyed: function() {
      // called when it is destroyed, the component might be removed
      // from the DOM
    }
  }
});
```

Just like how you can mount an instance manually, you can also use:

```js
app.destroy();
```

This will destroy the instance, which will:

* Prevent Reactive Updates
* Teardown Event Listeners

You can always mount it again, and the data will be restored and reactive.
