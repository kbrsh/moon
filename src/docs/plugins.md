---
title: Plugins
---

Plugins allow for developers to add in their own modifications to Moon. Plugins allow for adding multiple components, directives, changing methods, or injecting custom options.

### Using Plugins

Include the plugin script, and use the global [`Moon.use`](../api/global-api.html#-use-) method.

```js
Moon.use(plugin);
```

### Making Plugins

A plugin has to be an object with an `init` method. This method is called when `Moon.use` is called, and is provided with `Moon` as a parameter.

For example:

```js
const plugin = {
  init: function(Moon) {
    Moon.component("example", {
      template: "<h1>Example Component</h1>"
    });
  }
}
```

As you can see, there is an `init` method that installs a component to Moon. This plugin can now be installed, and will include the component where it is installed.

```js
Moon.use(plugin);
```

Now you can use the registered component.

```html
<example></example>
```

A plugin can do anything with `Moon`, including registering as many components, directives, and methods as it needs.
