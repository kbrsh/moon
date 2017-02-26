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
