---
title: Instance Methods
---

##### **constructor**

- Arguments:
  - `{Object} options`

The `options` object is defined as follows:

- Properties:
  - `{String} root`: DOM identifier to find the element in which to set the insance to. It uses `document.querySelector` to get the desired element.
  - `{String} name`: some name for the app. Defaults to `Root`.
  - `{Object|Function} data`: the data used by instance. Can be accessed via `{{mustache}}` notation and is reactive. If a function is used, it must return an object with the properties such as an normal `data` object. Defaults to `{}`.
  - `{Object} methods`: methods of the instance. These can be called via `instance.methods.yourMethod(param)`. `this`, inside these methods, refers to the instance itself. So you can use it to access data using `this.get('someVar')`. Defaults to `{}`.
  - `{Object} computed`: computed properties of the instance. Every object defined inside this one must have, at least, a `get` or `set` function. The `get` will return some value, depending on some function defined condition. And the `set` receive the value to be set. These can also be accessed via `{{mustache}}` notation and are reactive. No effect if `undefined`.
  - `{Object} hooks`: hooks for use during the lifecycle of the instance. All of them must be functions. Defaults to `{}`.
  - `{Function} render`: custom render functions. Defaults to a `noop` function.

All of them can be later accessed by their names via `insance.option` (except for the `render` property, which can be acessed via `instance.compiledRender`).

Usage:
```js
const options = {
  root: "#app", // it can be a '.class' or even 'div'
  data: {
    text: "Counter: ",
    counter: 0
  },
  methods: {
    // call via 'app.methods.toText()''
    toText: function() {
      return this.data.toString();
    }
  },
  // threated same way as normal data: "app.get('someComp')"
  computed: {
    someComp: {
      get: function() {
        return this.get("counter");
      },
      set: function(val) {
        if(val > 10) {
          this.set("counter", val);
        }
      }
    }
  },
  hooks: {
    mounted: function() {
      this.set("counter", 10);
    }
  }
};

const app = new Moon(options);
```

Every Moon instance comes with built in methods specific to that instance, you can call them like: `instance.foo`.

##### **get**

- Arguments:
  - `{String} property`
- Returns: `{String} value`

Usage:
```js
instance.get("property").foo.bar;
```

Can return a value from Moon instance data.

##### **set**

- Arguments:
  - `{String} keypath`
  - `{Any} value`
  - `{Object} [obj]`

Usage:
```js
instance.set("foo", "baz");
// Shallow merge with data and notifies observer
instance.set({
  foo: true,
  bar: [1, 2, 3]
});
```

Used to set Moon instance data, ensuring that a DOM build is queued. If an object is used, it will set the properties based on the key values.

##### **mount**

- Arguments:
  - `{String|Node} selector`

Usage:
```js
instance.mount("#app");
instance.mount(root);
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
  type: "foo" // event name
}
```
