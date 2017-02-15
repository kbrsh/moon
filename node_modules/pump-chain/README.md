# pump-chain

A module that glues [pump](http://npm.im/pump) and [bubble-stream-error](http://npm.im/bubble-stream-error) to make life easier when piping streams internally and returning an outer stream.

[![build status](https://secure.travis-ci.org/alessioalex/pump-chain.png)](http://travis-ci.org/alessioalex/pump-chain)

## what problem does it solve?

Consider the situation when you are piping multiple streams internally and returning an outer stream.
That stream will be handled by users of your module so you need to make sure that the errors coming from the internal streams propagate to the outer one (which `bubble-stream-error` takes care of), otherwise they can't be caught and will blow up the process.
Also if one of the inner streams closes you want to make sure that the others get closed as well (which `pump` does).

## usage

Simply pass the streams you want to pipe together to `pump-chain`.

```js
var pump = require('pump-chain');
var crypto = require('crypto');
var fs = require('fs');
var zlib = require('zlib');

function getEncryptedCompressedWordsStream() {
  var gzip = zlib.createGzip();
  var password = new Buffer('car cat tree fireman');
  var aes = crypto.createCipher('aes-256-cbc', password);

  var rs = fs.createReadStream('/usr/share/dict/words');

  // uncomment to simulate an error
  /*
  var i = 0;
  rs.on('data', function() {
    if (++i === 3) {
      this.emit('error', new Error('3 is unlucky!'));
    }
  });
  */

  return pump(rs, aes, gzip);
}

getEncryptedCompressedWordsStream().on('error', function handleError(err) {
  console.error('\n!!! something bad happened while streaming stuff !!!\n');
  throw err;
}).pipe(process.stdout);
```

## tests

```bash
npm test
```

## related

[mississippi stream utility collection](https://github.com/maxogden/mississippi) which includes more useful stream modules similar to this one

## license

[MIT](http://alessioalex.mit-license.org/)
