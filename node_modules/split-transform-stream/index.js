'use strict';

var split = require('split');
var through = require('through2');
var pump = require('pump-chain');

module.exports = function splitTransformStream(inputStream, write, end, splitText) {
  var w = write || function defaultWrite(chunk, enc, cb) {
    this.push(chunk);
    cb();
  };

  var splitStream = split(splitText);
  var stream = through({
    objectMode: true
  }, w, end);

  return pump(inputStream, splitStream, stream);
};
