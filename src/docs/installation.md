---
title: Installation
---

#### Builds

Moon comes in two builds, **development**, and **production**. The development build is intended for use while developing, as Moon comes built with extra checks and helpful error messages. In the production build, these are stripped out and everything is minified.

* Development: [`moon.js`](https://unpkg.com/moonjs/dist/moon.js)
* Production: [`moon.min.js`](https://unpkg.com/moonjs/dist/moon.min.js)

#### CDN

Installing Moon is as easy as including a script tag to a CDN. The preferred CDN is [unpkg](https://unpkg.com):

```html
<!-- Production Build -->
<script src="https://unpkg.com/moonjs"></script>

<!-- Development Build -->
<script src="https://unpkg.com/moonjs/dist/moon.js"></script>
```

#### NPM

Moon is supported in Node environments, but to actually update/patch elements, it requires the DOM.

```sh
$ npm install moonjs
```

```js
// Production Build
const Moon = require("moonjs");

// Development Build
const Moon = require("moonjs/dist/moon.js");
```

#### Building from Scratch

To edit the source files and build Moon from scratch, clone the repo, and edit any files in the `src` directory.

```sh
$ npm run build
```

This will output the built files in the `dist/` directory. To run unit tests, run:

```sh
$ npm run test
```
