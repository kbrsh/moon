# bubble-stream-error

Node module for bubbling errors from 'sub-streams' to a master stream.

[![build status](https://secure.travis-ci.org/alessioalex/bubble-stream-error.png)](http://travis-ci.org/alessioalex/bubble-stream-error)

## examples

This is what you would normally do:

```js
randomStream.pipe(colorizeStream).pipe(choppedStream).pipe(finalStream);

// assign an error handler on each stream
[randomStream, colorizeStream, choppedStream, finalStream].forEach(function(stream) {
  stream.on('error', function handleError(err) {
    // ...
  });
});
```

With `bubble-stream-error`:

```js
var bubbleError = require('bubble-stream-error');

// ...

bubbleError(randomStream, colorizeStream, choppedStream, finalStream);
randomStream.pipe(colorizeStream).pipe(choppedStream).pipe(finalStream);

// assign a single error handler instead of 4
finalStream.on('error', function handleAllStreamErrors(err) {
  // ...
});
```

## tests

```bash
npm test
```

## License

[MIT](http://alessioalex.mit-license.org/)
