# Stealthy-Require

[![Build Status](https://img.shields.io/travis/analog-nico/stealthy-require/master.svg?style=flat-square)](https://travis-ci.org/analog-nico/stealthy-require)
[![Coverage Status](https://img.shields.io/coveralls/analog-nico/stealthy-require.svg?style=flat-square)](https://coveralls.io/r/analog-nico/stealthy-require)
[![Dependency Status](https://img.shields.io/david/analog-nico/stealthy-require.svg?style=flat-square)](https://david-dm.org/analog-nico/stealthy-require)

This is probably the closest you can currently get to require something in node.js with completely bypassing the require cache.

The restrictions are:

- [Native modules cannot be required twice.](https://github.com/nodejs/node/issues/5016) Thus this module bypasses the require cache only for non-native (e.g. JS) modules.
- The require cache is only bypassed for all operations that happen synchronously when a module is required. If a module lazy loads another module at a later time that require call will not bypass the cache anymore.

This means you should have a close look at all internal require calls before you decide to use this library.

## Installation

[![NPM Stats](https://nodei.co/npm/stealthy-require.png?downloads=true)](https://npmjs.org/package/stealthy-require)

This is a module for node.js and is installed via npm:

``` bash
npm install stealthy-require --save
```

## Usage

Let's say you want to bypass the require cache for this require call:

``` js
var request = require('request');
```

With `stealthy-require` you can do that like this:

``` js
var stealthyRequire = require('stealthy-require');

var requestFresh = stealthyRequire(require.cache, function () {
    return require('request');
});
```

The require cache is bypassed for the module you require (i.e. `request`) as well as all modules the module requires (i.e. `http` and many more).

## Usage with Module Bundlers

- [Webpack](https://webpack.github.io) works out-of-the-box like described in the [Usage section](#usage) above.
- [Browserify](http://browserify.org) does not expose `require.cache`. However, as of `browserify@13.0.1` the cache is passed as the 6th argument to CommonJS modules. Thus you can pass this argument instead:

``` js
// Tweak for Browserify - using arguments[5] instead of require.cache
var requestFresh = stealthyRequire(arguments[5], function () {
    return require('request');
});
```

## Contributing

To set up your development environment for `stealthy-require`:

1. Clone this repo to your desktop,
2. in the shell `cd` to the main folder,
3. hit `npm install`,
4. hit `npm install gulp -g` if you haven't installed gulp globally yet, and
5. run `gulp dev`. (Or run `node ./node_modules/.bin/gulp dev` if you don't want to install gulp globally.)

`gulp dev` watches all source files and if you save some changes it will lint the code and execute all tests. The test coverage report can be viewed from `./coverage/lcov-report/index.html`.

If you want to debug a test you should use `gulp test-without-coverage` to run all tests without obscuring the code by the test coverage instrumentation.

## Change History

- v1.0.0 (2016-07-18)
    - **Breaking Change:** API completely changed. Please read the [Usage section](#usage) again.
    - Redesigned library to support module bundlers like [Webpack](https://webpack.github.io) and [Browserify](http://browserify.org)
- v0.1.0 (2016-05-26)
    - Initial version

## License (ISC)

In case you never heard about the [ISC license](http://en.wikipedia.org/wiki/ISC_license) it is functionally equivalent to the MIT license.

See the [LICENSE file](LICENSE) for details.
