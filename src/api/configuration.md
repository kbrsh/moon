---
title: Configuration
---

Moon comes with a global `Moon.config` object that can be used to set any custom settings provided.

##### **silent**

- Type: `Boolean`
- Default: `false`

Usage:
```js
Moon.config.silent = true;
```

Can toggle all logs (excluding errors)

##### **keycodes**

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
<input m-on:keyup.m="someMethod"/>
```

It will only fire when the `m` key is being clicked.

##### **delimiters**

- Type: `Array`
- Default: `["{{", "}}"]`

Usage:
```js
Moon.config.delimiters = ["${", "}"];
```

Can change the delimiters used in templates.

##### **version**

- Type: `String`

Usage:

```js
Moon.version;
```

Returns the current version of Moon in string format.
