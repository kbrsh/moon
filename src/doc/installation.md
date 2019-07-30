---
title: Installation
order: 1
---

Moon can be installed with a `<script>` tag or through `npm`. The view driver uses an extension of the JavaScript language, similar to JSX, that adds HTML-like syntax for creating views.

## CLI

Moon CLI can generate a scalable application with support for:

* Moon view language
* Hot module reloading
* Next generation CSS and JavaScript
* Optimized production builds

Moon CLI can be installed through `npm` and ran with `moon <name>`.

```sh
npm install -g moon-cli
moon my-app
```

## Browser

For the browser, Moon provides a `moon-browser` module that compiles `<script>` tags with type `"text/moon"` to support the Moon view language.

```html
<script src="https://unpkg.com/moon-browser"></script>
<script src="https://unpkg.com/moon"></script>

<script type="text/moon" src="scripts.js"></script>
<script type="text/moon">
	const paragraph = (<p>Hello Moon!</p>);
</script>
```

```sh
npm install moon
```
