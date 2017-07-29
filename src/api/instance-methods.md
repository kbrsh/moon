---
title: Instance Methods
---

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
  - `{String|Node} selector`

Usage:
```js
instance.mount("#app");
instance.mount(el);
```

Used to manually mount an instance to an element, compiling a template or using a render function, and running the initial build.

##### **destroy**

Usage:
```js
instance.destroy();
```

Used to manually destroy (unmount) an instance. Updated data won't be queued anymore, unless mounted again.

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
// remove specific listener
instance.off("foo", listener);

// remove all listeners for the "foo" event
instance.off("foo");

// remove all event listeners
instance.off();
```

Used to remove an event listener from a certain event.

##### **emit**

- Arguments:
  - `{String} event`
  - `{Object} data` (optional)

Usage:
```js
instance.emit("foo");
instance.emit("foo", {bar: true});
```

Used to emit an event, invoking all current event listeners for that specific events. If there is custom data provided, it will attach this data and provide it as the first parameter. By default, the custom data will always have a `type` to indicate the type of event fired:

```js
{
  type: 'foo' // event name
}
```
