/* eslint-disable no-console, func-names */
'use strict';

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
