'use strict';
// Note that this is called from PhantomJS
// and does not have access to node modules

var system = require('system');
var fs = require('fs');

function collectCoverage(page) {
  // istanbul stores coverage in global.__coverage__
  var coverage = page.evaluate(function() {
    return window.__coverage__;
  });

  // fail gracefully when we don't have coverage
  if (!coverage) {
    return;
  }

  // read coverageFile from mocha-phantomjs args
  var phantomOpts = JSON.parse(system.args[system.args.length-1]);
  var coverageFile = phantomOpts.coverageFile || 'coverage/coverage.json';
 
  // write coverage to file
  var json = JSON.stringify(coverage);
  fs.write(coverageFile, json);
}

// beforeStart and afterEnd hooks for mocha-phantomjs
module.exports = {
  afterEnd: function(runner) {
    collectCoverage(runner.page);
  }
};
