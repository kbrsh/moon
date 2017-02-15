async-to-gen
============

[![npm](https://img.shields.io/npm/v/async-to-gen.svg?maxAge=86400)](https://www.npmjs.com/package/async-to-gen)
[![Build Status](https://img.shields.io/travis/leebyron/async-to-gen.svg?style=flat&label=travis&branch=master)](https://travis-ci.org/leebyron/async-to-gen)

Turn your JavaScript with [async functions](https://github.com/tc39/ecmascript-asyncawait) into ES6 generators so they can be used in modern
browsers or in node.js (v0.12 or newer).

Async functions are an exciting new proposed addition to JavaScript. The v8 team
is [hard at work](https://bugs.chromium.org/p/v8/issues/detail?id=4483) getting it right, which means it could appear in future versions of node.js. However if
you're impatient like me, then you probably just can't wait to get rid of your
promise triangles and [callback hell](http://callbackhell.com/).

You can use [Babel](https://babeljs.io/) to accomplish this, but `async-to-gen`
is a faster, simpler, zero-configuration alternative with minimal dependencies
for super-fast `npm install` and transform time.

Also, `async-to-gen` provides support for [async generators](https://github.com/tc39/proposal-async-iteration)
which return Async Iterators, a great syntax and primitive for producing and
operating on streams of data.


## Get Started!

Use the command line:

```sh
npm install --global async-to-gen
```

```sh
async-to-gen --help
async-to-gen input.js > output.js

# source maps!
async-to-gen input.js --sourcemaps inline > output.js
```

Or the JavaScript API:

```sh
npm install async-to-gen
```

```js
var asyncToGen = require('async-to-gen');
var fs = require('fs');

var input = fs.readFileSync('input.js', 'utf8');
var output = asyncToGen(input).toString();
fs.writeFileSync('output.js', output);

// source maps!
var map = asyncToGen(input).generateMap();
fs.writeFileSync('output.js.map', JSON.stringify(output));
```


## Use `async-node`

Wherever you use `node` you can substitute `async-node` and have a super fast
async functions aware evaluator or REPL.

```sh
$ async-node
> async function answer() {
... return await 42
... }
undefined
> promise = answer()
Promise { <pending> }
> promise.then(console.log)
Promise { <pending> }
42
```


## Use the require hook

Using the require hook allows you to automatically compile files on the fly when
requiring in node, useful during development:

```js
require('async-to-gen/register')
require('./some-module-with-async-functions')
```

You can also provide options to the require hook:

```js
// Disable inline source maps for use with development tools.
require('async-to-gen/register')({ sourceMaps: false })
```

Use options to define exactly which files to `includes` or `excludes` with regular
expressions. All files are included by default except those found in the
`node_modules` folder, which is excluded by default. Pass `excludes: null` to not
exclude any files.

```js
require('async-to-gen/register')({ includes: /\/custom_path\// })
```

> #### Don't use the require hook in packages distributed on NPM
> As always, don't forget to use `async-to-gen` to compile files before distributing
> your code on npm, as using the require hook affects the whole runtime and not
> just your module and may hurt the runtime performance of code that includes it.


## Use in Build Systems:

**Rollup**: [`rollup-plugin-async`](https://github.com/leebyron/rollup-plugin-async)


## Common Usage

#### Async I/O

Async functions are great for writing asynchronous code that *looks* synchronous,
and that's perfect for writing code that needs to perform async I/O operations.

One of the original motivations for Node.js was [non-blocking I/O](https://www.youtube.com/watch?v=ztspvPYybIY), perfect! However its core libraries
[do not yet support Promises](https://github.com/nodejs/node/pull/5020), nor do many popular libraries written for Node 😭.

Do not fret, we can fix this with [promisify-node](https://github.com/nodegit/promisify-node)!

```js
const promisify = require('promisify-node');
const fs = promisify('fs');

async function emojify(filePath) {
  const contents = await fs.readFile(filePath, 'utf8')
  const edited = contents.replace(/:\)/g, '😉')
  await fs.writeFile(filePath, edited, 'utf8')
}
```

#### Mocha

Writing tests in mocha? Async functions are super handy for testing any code
using promises and already work out of the box! To enable async functions in
mocha include the require hook when you run your tests:

```bash
mocha --require async-to-gen/register test.js
```

Then in your tests, use async functions in your `it` clauses:

```js
describe('My Promising Module', () => {

  it('promises to give a value', async () => {
    expect(await myFunction('input')).to.equal('output')
  })

})
```

Testing your [express](http://expressjs.com/) app?
Try [supertest](https://github.com/visionmedia/supertest/) and async functions:

```js
const express = require('express')
const request = require('supertest')

const app = express()
app.get('/foo', (req, res) => res.send('bar'))

describe('My express app', () => {

  it('loads foo', async () => {
    const response = await request(app).get('/foo')
    expect(response.body).to.equal('bar')
  })

})
```

#### Jest

Writing tests in Jest? Use the [scriptPreprocessor](http://facebook.github.io/jest/docs/api.html#scriptpreprocessor-string) entry in your jest configuration in package.json:

```js
{
  "name": "my-project",
  "jest": {
    "scriptPreprocessor": "async-to-gen"
  },
  "devDependencies": {
    "async-to-gen": "*"
  }
}
```

#### Scripts

Have interactive scripts that require lots of input from the user? Async
functions make writing those much easier! Check out [interactive-script](https://github.com/leebyron/interactive-script).

```bash
npm install interactive-script
```

Then write your script:

```js
const interactive = require('interactive-script')
interactive(async (say, ask) => {
  say('What is your favorite number?')
  let num;
  do {
    num = Math.ceil(Math.random() * 100)
  } while (!await ask(`Is it ${num}? `, 'yN'))
  say(`Great, I think ${num} is a fine number.`)
})
```

And run it with `async-node`:

```bash
async-node myScript.js
```

#### Streams

Streaming data can be a challenging thing to get right. While [Observables](http://reactivex.io/documentation/observable.html) have provided a great library for
streamed data, Async Generators provides language-level support for this concept!

Consider subscribing to a web socket within an program using async functions:

```js
async function* stockTickerInEuro(symbol) {
  var socket = await openWebSocket('ws://stocks.com/' + symbol)
  try {
    for await (var usd of socket) {
      var euro = usd * await loadExchangeRateUSD2EUR()
      yield euro
    }
  } finally {
    closeWebSocket(socket)
  }
}
```

Then calling this function produces an Async Iterator (an Iterator of Promises)
of stock ticker values.

```js
var ticker = stockTickerInEuro('AAPL')
ticker.next().then(step => console.log(step.value))
```

Or use `for-await-of` loops within another async function:

```js
async function bloombergTerminal() {
  for await (var price of stockTickerInEuro('AAPL')) {
    console.log(price)
  }
}
```

## Dead-Simple Transforms

When `async-to-gen` transforms async functions, it makes as few edits as
possible, and does not affect the location of lines in a file, leading to easier
to understand stack traces when debugging.

It also includes a very small conversion function at the bottom of the file.
How small? 204 chars for async functions and 533 chars for async generators.

**Before:**

```js
async function foo() {
  return await x
}
```

**After:**

```js
function foo() {return __async(function*(){
  return yield x
}())}

function __async(g){/* small helper function */}
```


## Using with Babel

Don't bother using both! If you're already using Babel (maybe you need JSX,
other proposed features, or are supporting older versions of Node) then you
might be excited to hear that using [babel-preset-es2017](https://babeljs.io/docs/plugins/preset-es2017/)
in your `.babelrc` will provide support for async functions!

Babel is an amazing tool that you should consider using, however `async-to-gen`
intentionally makes some different choices to provide a different set of
trade-offs. Babel is general-purpose and supports a wider set of features but
requires some configuration and more dependencies and those features may cost
build performance or output code quality. `async-to-gen` can only do one thing,
but that simplicity lends itself towards faster builds and cleaner output.

Ultimately, if you only need to add async function support you should try
`async-to-gen` but if you need more features then you should use Babel.
