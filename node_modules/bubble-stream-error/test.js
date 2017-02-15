/* eslint-disable no-console, func-names */
'use strict';

var EventEmitter = require('events').EventEmitter;
var test = require('tape');
var bubbleError = require('./');

test('it should return the arguments as an array', function(t) {
  var emitter1 = new EventEmitter();
  var emitter2 = new EventEmitter();
  var emitter3 = new EventEmitter();
  var streams = [emitter1, emitter2, emitter3];

  t.deepEqual(streams, bubbleError.apply(null, streams));

  t.end();
});

test('it should bubble up the error to the last stream', function(t) {
  var emitter1 = new EventEmitter();
  var emitter2 = new EventEmitter();
  var emitter3 = new EventEmitter();
  var streams = [emitter1, emitter2, emitter3];
  var err = new Error('test');

  bubbleError.apply(null, streams);

  emitter3.on('error', function(e) {
    t.equal(e, err);
    t.end();
  });

  emitter1.emit('error', err);
});

test('it should only emit an error event once', function(t) {
  var emitter1 = new EventEmitter();
  var emitter2 = new EventEmitter();
  var emitter3 = new EventEmitter();
  var streams = [emitter1, emitter2, emitter3];
  var err = new Error('test');

  bubbleError.apply(null, streams);

  emitter3.on('error', function(e) {
    t.equal(e, err);
    t.end();
  });

  emitter1.emit('error', err);
  emitter2.emit('error', err);
});

test('it should not bubble up other events', function(t) {
  var emitter1 = new EventEmitter();
  var emitter2 = new EventEmitter();
  var emitter3 = new EventEmitter();
  var streams = [emitter1, emitter2, emitter3];

  bubbleError.apply(null, streams);

  emitter2.on('data', function(d) {
    t.equal(d, 'test');
  });
  emitter3.on('data', function() {
    throw new Error('Unexpected data event');
  });

  emitter2.emit('data', 'test');

  t.end();
});
