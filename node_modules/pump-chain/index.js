'use strict';

var slice = require('sliced');
var pump = require('pump');
var bubbleError = require('bubble-stream-error');

module.exports = function pumpAndBubbleError() {
  var streams = slice(arguments);

  return pump.apply(null, bubbleError.apply(null, streams));
};
