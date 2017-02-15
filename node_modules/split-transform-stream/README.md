# split-transform-stream

A combination of [through2](https://www.npmjs.org/package/through2) and [split](https://github.com/dominictarr/event-stream#split-matcher) with a straightforward interface.

[![build status](https://secure.travis-ci.org/alessioalex/split-transform-stream.png)](http://travis-ci.org/alessioalex/split-transform-stream)

## Usage

```js
splitStream(inputStream, write, [end], [splitText])
```
returns a stream

## Example

```js
var readStream = require('fs').createReadStream(__filename, 'utf8');
var splitStream = require('./index');
var write = function(line, encoding, next) {
  this.push(line.split(' ').reverse().join(' '));

  next();
};

// emitting lines in reverse
splitStream(readStream, write).on('data', function(data) {
  console.log(data);
}).on('error', function(err) {
  if (err) { throw err; }
}).on('end', function() {
  console.log('done');
});
```

## License

[MIT](http://alessioalex.mit-license.org/)
