/* eslint-disable no-console, func-names */
'use strict';

var RandomStream = require('random-stream');
var Colorize = require('colorize-stream');
var Chopped = require('chopped-stream');
var through2 = require('through2');
var bubbleError = require('./');
var pump = require('pump');

function getColoredRandomGibberishStream() {
  var randomStream = RandomStream({
    min: 1, // in milliseconds
    max: 50 // in milliseconds
  });
  var colorizeStream = Colorize('cyan');
  var choppedStream = Chopped(100);
  var finalStream = through2();

  // artificially create an error in an intermediate stream to test the bubbling
  var i = 0;

  choppedStream.on('data', function() {
    if (++i === 3) {
      this.emit('error', new Error('3 is unlucky!'));
    }
  });

  // bubbleError will return the array of streams passed as params
  // pump is used to pipe the streams && destroy them when they're done
  // this will return `finalStream`
  return pump.apply(null, bubbleError(
    randomStream, colorizeStream, choppedStream, finalStream
  ));
}

getColoredRandomGibberishStream().on('error', function(err) {
  console.error('\nSomething bad happened: %s', err.message);
  process.exit(1);
}).pipe(process.stdout);
