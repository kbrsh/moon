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

Moon CLI can be installed through `npm` and ran with `moon`.

```sh
npm install -g moon-cli
moon create my-app
```

## NPM

Moon can be manually installed through `npm`. To use the Moon view language with your build system, Moon provides a `moon-compiler` module along with modules for most bundlers, including Webpack and Rollup.

```sh
npm install moon
npm install moon-compiler
```

#### Webpack

```sh
npm install moon-loader
```

```js
// webpack.config.js
module.exports = {
	module: {
		rules: [
			{ test: /\.js/, use: "moon-loader" }
		]
	}
};
```

#### Rollup

```sh
npm install rollup-plugin-moon
```

```js
// rollup.config.js
import MoonPlugin from "rollup-plugin-moon";

export default {
	plugins: [
		MoonPlugin()
	]
};
```

## Browser

Moon can be embedded in the browser directly with a script tag. To use the Moon view language in the browser, Moon provides a `moon-browser` module that compiles `<script>` tags with type `"text/moon"`.

```html
<script src="https://unpkg.com/moon"></script>
<script src="https://unpkg.com/moon-browser"></script>

<script type="text/moon" src="scripts.js"></script>
<script type="text/moon">
	const paragraph = <p>Hello Moon!</p>;
</script>
```
