---
title: Global API
---

Moon comes with global methods available via `Moon.foo` that don't come with every instance.

##### **use**

- Arguments:
  - `{Object} plugin`

Usage:
```js
Moon.use(plugin);
```

Can initialize and begin using a Moon plugin. Calls the `init` method of the plugin provided with `Moon` as a parameter.

##### **compile**

- Arguments:
  - `{String} html`

Usage:
```js
Moon.compile("<h1>{{msg}}</h1>");
```

Can be used to precompile Moon templates to render functions (to be used internally)

##### **nextTick**

- Arguments:
  - `{Function} task`

Usage:
```js
Moon.nextTick(function() {
  // some task
});
```

Can be used to do tasks after Moon has finished updating the DOM. Since Moon's DOM updates are done asynchronously, the DOM will not be changed right after setting a property, instead, it will be queued.

##### **directive**

- Arguments:
  - `{String} name`
  - `{Function} action`

Usage:
```js
Moon.directive('custom', function(el, val) {
  // some task with the element
});
```

Can be used to create custom directives for Moon, the example above, a directive called `m-custom` will be created. This can be used anywhere, and will be automatically extracted from the DOM during runtime. These directives will be compiled as an **expression**, meaning there are no mustache templates, but plain Javascript.

You will be provided with the element the directive is in, and the value of the directive.

##### **component**

- Arguments:
  - `{String} name`
  - `{Object} opts`
- Return: `{Function} component`

Usage:
```js
Moon.component('my-component', {
  template: "<h1>Custom Component</h1>"
});
```

Used to create custom components, usable in HTML like `<my-component></my-component>`. Can take all options a Moon instance takes (except `el`)

A component can take all of the options of a Moon instance, and is essentially an instance with special behavior.
