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

Moon comes with global methods available via `Moon.foo` that don't come with every instance.

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

#### Instance Methods

Every Moon instance comes with built in methods specific to that instance, you can call them like: `instance.foo`.

##### **get**

- Arguments:
  - `{String} property`
- Returns: `{String} value`

Usage:
```js
instance.get('property').foo.bar;
```

Can return a value from Moon instance data.

##### **set**

- Arguments:
  - `{String} keypath`
  - `{Any} value`

Usage:
```js
instance.set('property.foo.bar', 'baz');
```

Used to set Moon instance data, ensuring that a DOM build is queued.

##### **callMethod**

- Arguments:
  - `{String} method`
  - `{Array} params` (optional)

Usage:
```js
instance.callMethod('foo', ['bar', 10]);
```

Used to call a method defined in the `methods` option of a Moon instance with the provided parameters. It should always be used to call a method manually, as `this` will refer to the Moon instance.

##### **mount**

- Arguments:
  - `{String} selector`

Usage:
```js
instance.mount("#app");
```

Used to manually mount an instance to an element, compiling a template or using a render function, and running the initial build.

##### **destroy**

Usage:
```js
instance.destroy();
```

Used to manually destroy (unmount) an instance. Updated data won't be queued anymore, unless mounted again.

##### **mount**

- Arguments:
  - `{String} selector`

Usage:
```js
instance.mount("#app");
```

Used to manually mount an instance to an element, compiling a template or using a render function, and running the initial build.

##### **build**

Usage:
```js
instance.build();
```

Used to force a build an instance, rerendering the virtual DOM, and patching.

##### **on**

- Arguments:
  - `{String} event`
  - `{Function} listener`

Usage:
```js
instance.on("foo", function(evt) {
  // do something
});
```

Used to attach an event listener to a certain event to the instance. You can also listen on a wildcard event (`*`) to attach an event listener that will be invoked if any event is called.

##### **off**

- Arguments:
  - `{String} event`
  - `{Function} listener`

Usage:
```js
instance.off("foo", listener);
```

Used to remove an event listener from a certain event.

##### **emit**

- Arguments:
  - `{String} event`
  - `{Object} data` (optional)

Usage:
```js
instance.emit("foo", {bar: true});
```

Used to emit an event, invoking all current event listeners for that specific events. If there is custom data provided, it will attach this data and provide it as the first parameter. By default, the custom data will always have a `type` to indicate the type of event fired:

```js
{
  type: 'foo' // event name
}
```
