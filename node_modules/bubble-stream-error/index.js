'use strict';

var once = require('once');
var sliced = require('sliced');

function propagateErrorEvent(to) {
  var reEmitEvent = once(function reEmitEvt(obj, args) {
    obj.emit.apply(obj, args);
  });

  return function interceptEmit(from) {
    var originalEmit = from.emit;

    from.emit = function emit() {
      var args = sliced(arguments);

      if (args[0] !== 'error') {
        originalEmit.apply(from, args);
      } else {
        reEmitEvent(to, args);
      }
    };
  };
}

module.exports = function bubbleError() {
  var streams = sliced(arguments);
  var len = streams.length;

  if (len > 1) {
    var propagateError = propagateErrorEvent(streams[len - 1]);

    for (var i = 0; i < len - 1; i++) {
      propagateError(streams[i]);
    }
  }

  return streams;
};
