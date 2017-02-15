'use strict';

module.exports = function (done) {
  var cbCount = 0;
  var results = [];
  var error, called;

  process.nextTick(function () {
    if (!called) done(null, results);
  })

  return function (callback) {
    called = true;
    var index = cbCount++;
    return function (err, result) {
      if (callback) callback.apply(null, arguments);
      if (err && !error) error = err;
      results[index] = result;
      process.nextTick(function () {
        if (!--cbCount) done(error, results);
      });
    };
  };
};
