/* eslint-disable func-names */
'use strict';

var test = require('tape');
var proxyquire = require('proxyquire');
var slice = require('sliced');

test('it should call `bubble-stream-error` with the streams args', function(t) {
  var streams = [1, 2, 3];

  var pumpChain = proxyquire('./', {
    pump: function() {},
    'bubble-stream-error': function() {
      t.deepEqual(slice(arguments), streams);
      t.end();
    }
  });

  pumpChain.apply(null, streams);
});

test('it should call `pump` with the array returned by `bubble-stream-error`', function(t) {
  var streams = [1, 2, 3];

  var pumpChain = proxyquire('./', {
    pump: function() {
      t.deepEqual(slice(arguments), streams.reverse());
      t.end();
    },
    'bubble-stream-error': function() {
      return slice(arguments).reverse();
    }
  });

  pumpChain.apply(null, streams);
});
