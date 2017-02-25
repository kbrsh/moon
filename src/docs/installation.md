---
title: Installation
order: 1
---

#### CDN

Installing Moon is as easy as including a script tag to a CDN. The preferred CDN is [unpkg](https://unpkg.com):

```html
<script src="https://unpkg.com/moonjs@0.4.6"></script>
```

#### NPM

Moon is supported in RequireJS environments, but to actually update/patch elements, it requires the DOM.

```bash
$ npm install moonjs
```

```js
var Moon = require("moonjs");
```

#### Development Build

To edit the source files and build Moon from scratch, clone the repo, and edit any files in the `src` directory.

```bash
$ npm run build
```

This will output the built files in the `dist/` directory. To run unit tests, run:

```bash
$ npm run test
```
