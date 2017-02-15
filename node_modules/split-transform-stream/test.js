/* eslint-disable no-console, func-names */
'use strict';

var test = require('tap').test;
var splitStream = require('./index');
var fs = require('fs');

test('basic', function(assert) {
  var readStream = fs.createReadStream(__filename, 'utf8');

  var write = function(line, encoding, next) {
    this.push(line.toUpperCase());

    next();
  };

  var lines = [];

  splitStream(readStream, write).on('data', function(data) {
    lines.push(data);
  }).on('error', function(err) {
    if (err) { throw err; }
  }).on('end', function() {
    var content = fs.readFileSync(__filename, 'utf8');

    assert.equal(lines.length, content.split('\n').length);
    assert.end();
  });
});
