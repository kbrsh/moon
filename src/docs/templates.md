---
title: Templates
---

Moon has a custom templating syntax similar to Mustache. All **attributes** and **text** are compiled for these templates.

Here is an example:

```html
<h1 id="{{id}}">{{data}}</h1>
```

Templates can have a valid Javascript path for accessing properties on an array, object, or both. For example:

```html
<h1>{{data.foo.bar[5].baz}}</h1>
```

**Note:** Internally, this will be converted to something like:

```js
instance.get('data').foo.bar[5].baz
```

### HTML

By default, text data will be escaped, meaning that you cannot have HTML in it. If you do, it will be rendered as plain text. To render HTML, use the [`m-html`](./../api/directives.html#-html-) directive.

### Directives

Directives are prefixed with `m-` (or `Moon.config.prefix`)

They are shorthands for the compiler, for example, `m-if` will tell the compiler to conditionally render some element.
