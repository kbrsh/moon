# after-all-results

If you have multiple async function calls that you want to run in
parallel and collect all their results in an array, this is the module
for you.

It's like [after-all](https://github.com/sorribas/after-all) with a
build in results aggregator.

[![build status](https://secure.travis-ci.org/watson/after-all-results.png)](http://travis-ci.org/watson/after-all-results)

## Installation

```
npm install after-all-results
```

## Usage

First require the module:

```javascript
var afterAll = require('after-all-results');
```

Then initialize with a callback that should be called once all the async
stuff is done:

```javascript
var next = afterAll(function (err, results) {
  // all done!
  console.log(results);
});
```

The returned `next` function is essentially just a smart
callback-generator. The after-all-results module will wait and not call
the all-done function until all the generated callbacks have been
called:

```javascript
someAsyncFunction(next());
anotherAsyncFunction(next());
```

**Note:** It is important that all `next()` calls are done on the same
tick as the inital call to `afterAll()`!

### Bonus: Inception mode

```javascript
var next = afterAll(function (err, results) {
  // results will be an array of `arg1` from below
  console.log('Done with everything!');
});

async(next(function (err, arg1, arg2) {
  console.log('Done with first call to async');
});

async(next(function (err, arg1, arg2) {
  console.log('Done with second call to async');
});
```

## License

MIT
