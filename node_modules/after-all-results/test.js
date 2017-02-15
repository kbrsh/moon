'use strict';

var test = require('tape');
var aar = require('./');

test('should call the callback when all async stuff is done', function (t) {
  var next = aar(function (err, results) {
    t.error(err);
    t.equal(results.length, 2);
    t.deepEqual(results, [1, 2]);
    t.end();
  });
  process.nextTick(next().bind(null, null, 1));
  process.nextTick(next().bind(null, null, 2));
});

test('should pass on arguments to nested callbacks', function (t) {
  var next = aar(function (err, results) {
    t.equal(results.length, 1);
    t.end();
  });
  var cb = next(function (a1, a2, a3) {
    t.equal(a1, 1);
    t.equal(a2, 2);
    t.equal(a3, 3);
  });
  process.nextTick(cb.bind(null, 1, 2, 3));
});

test('should call the callback with the first error after all async stuff is done', function (t) {
  var next = aar(function (err, results) {
    t.equal(err.message, 'first');
    t.equal(results.length, 2);
    t.end();
  });
  setTimeout(next().bind(null, new Error('second')), 20);
  setTimeout(next().bind(null, new Error('first')), 10);
});

test('should handle multiple async batches', function (t) {
  var calledNext1 = false;
  var next1 = aar(function (err, results) {
    t.error(err);
    t.equal(results.length, 1);
    calledNext1 = true;
  });
  var next2 = aar(function (err, results) {
    t.error(err);
    t.equal(results.length, 1);
    t.ok(calledNext1);
    t.end();
  });
  setTimeout(next1(), 10);
  setTimeout(next2(), 20);
});

test('should call the callback even if no calls to next() have been made', function (t) {
  aar(function (err, results) {
    t.deepEqual(results, []);
    t.end();
  });
});

test('should not care if one next-callback is called on the same tick', function (t) {
  var next = aar(function (err, results) {
    t.equal(results.length, 2);
    t.end();
  });
  next()();
  setTimeout(next(), 10);
});
