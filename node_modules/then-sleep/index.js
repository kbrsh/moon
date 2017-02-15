'use strict';

var Promise = require('native-or-bluebird');

module.exports = function (ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
};
