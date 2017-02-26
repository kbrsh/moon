---
title: Instance
order: 4
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
var app = new Moon({
  data: {
    count: 0
  },
  methods: {
    increment: function() {
      this.set("count", this.get("count")+1);
    }
  }
});

app.callMethod("increment");
// count => 1
```
