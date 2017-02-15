[![Dependency Status](http://img.shields.io/david/srod/node-version.svg?style=flat)](https://david-dm.org/srod/node-version)
[![devDependency Status](http://img.shields.io/david/dev/srod/node-version.svg?style=flat)](https://david-dm.org/srod/node-version#info=devDependencies)
[![NPM version](http://img.shields.io/npm/v/node-version.svg?style=flat)](https://www.npmjs.org/package/node-version)

# Node-version

A quick module that returns current node version parsed into parts.

## Installation

```shell
npm install node-version
```

## Quick Start

```js
var currentVersion = require('node-version');

/*
console.log(currentVersion);

{
    original: 'v0.4.10', // same as process.version
    short: '0.4',
    long: '0.4.10',
    major: '0',
    minor: '4',
    build: '10'
}
*/
```

## Warning

Version 1.0.0 break 0.1.0 since its API changes.

Change

```js
var currentVersion = new (require('../lib/node-version').version);
```

To

```js
var currentVersion = require('node-version');
```
