---
title: API
---

This is a complete guide to Moon's API, including all instance methods and global methods.

#### Configuration

Moon comes with a global `Moon.config` object that can be used to set any custom settings provided.

##### **silent**

- Type: `Boolean`
- Default: `false`

Usage:
```js
Moon.config.silent = true;
```

Can toggle all logs (excluding errors)

##### **prefix**

- Type: `String`
- Default: `"m"`

Usage:
```js
Moon.config.prefix = "data-m";
```

Can set the prefix used for directives (ie `data-m-if` instead of `m-if`). Just remember, all directives are not present in runtime.

##### **keycode**

- Arguments:
  - `{Object} keycodes`

Usage:
```js
Moon.config.keycodes({
  m: 77
});
```

Can set custom keycodes usable in `m-on` modifiers. For example:

```html
<input m-on="keyup.m:someMethod"/>
```

It will only fire when the `m` key is being clicked.

##### **version**

- Type: `String`

Usage:

```js
Moon.version;
```

Returns the current version of Moon in string format.

#### Global

Moon comes global methods available via `Moon.foo` that don't come with every instance.

##### **use**

- Arguments:
  - `{Object} plugin`

Usage:
```js
Moon.use(myPlugin);
```

Can initialize and begin using a Moon plugin.

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

Can be used to create custom directives for Moon, the example above, a directive called `m-custom` will be created. This can be used anywhere, and will be automatically extracted from the DOM during runtime.

You will be provided with the element the directive is in, and the value of the directive.
